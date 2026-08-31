import { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { Store, Transaction } from "../types";
import {
  colorForCategory,
  currentMonthKey,
  daysInMonthOf,
  daysElapsedThisMonth,
  formatMoney,
  monthTitle,
  previousMonthKeyOf,
} from "../utils";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconTrash,
} from "./icons";

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function TxList({
  items,
  categories,
  onEdit,
  onDelete,
}: {
  items: Transaction[];
  categories: Store["categories"];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return <p className="empty">Zatím žádné položky.</p>;
  return (
    <ul className="tx-list">
      {items.map((t) => (
        <li key={t.id}>
          <span
            className="dot"
            style={{ backgroundColor: colorForCategory(categories, t.category) }}
          />
          <div className="tx-info">
            <span className="tx-category">{t.category}</span>
            {t.note && <span className="tx-note">{t.note}</span>}
            <span className="tx-date">
              <IconCalendar size={12} />
              {new Date(t.date).toLocaleDateString("cs-CZ")}
            </span>
          </div>
          <span className={`tx-amount ${t.tx_type}`}>
            {t.tx_type === "income" ? "+" : "−"}
            {formatMoney(t.amount).replace("−", "")}
          </span>
          <div className="tx-actions">
            <button className="icon-btn" onClick={() => onEdit(t)} title="Upravit">
              <IconEdit />
            </button>
            <button className="icon-btn danger" onClick={() => onDelete(t.id)} title="Smazat">
              <IconTrash />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MonthView({
  store,
  onEdit,
  onDelete,
  onAdd,
}: {
  store: Store;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: (date?: string) => void;
}) {
  const [selected, setSelected] = useState(currentMonthKey());
  const isCurrent = selected === currentMonthKey();
  const maxMonth = currentMonthKey();

  const expenses = useMemo(
    () => store.transactions.filter((t) => t.tx_type === "expense" && t.date.startsWith(selected)),
    [store.transactions, selected],
  );
  const incomes = useMemo(
    () => store.transactions.filter((t) => t.tx_type === "income" && t.date.startsWith(selected)),
    [store.transactions, selected],
  );

  const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);
  const savings = incomeTotal - expenseTotal;

  const prevKey = previousMonthKeyOf(selected);
  const prevExpense = store.transactions
    .filter((t) => t.tx_type === "expense" && t.date.startsWith(prevKey))
    .reduce((s, t) => s + t.amount, 0);
  const changePct = prevExpense > 0 ? ((expenseTotal - prevExpense) / prevExpense) * 100 : null;

  const days = isCurrent ? Math.max(daysElapsedThisMonth(), 1) : daysInMonthOf(selected);
  const dailyAvg = expenseTotal / days;
  const savingsRate = incomeTotal > 0 ? (savings / incomeTotal) * 100 : 0;
  const biggestExpense = expenses.reduce(
    (m, t) => (t.amount > m.amount ? t : m),
    expenses[0] ?? { amount: 0, category: "", note: "" },
  );

  const pieData = [
    { name: "Příjmy", value: incomeTotal },
    { name: "Výdaje", value: expenseTotal },
  ].filter((d) => d.value > 0);

  const pieColors = ["#10b981", "#6366f1"];

  return (
    <div className="month-view">
      {/* ── month navigator ── */}
      <div className="month-nav">
        <button
          className="icon-btn"
          onClick={() => setSelected(shiftMonth(selected, -1))}
          title="Předchozí měsíc"
        >
          <IconChevronLeft size={28} />
        </button>
        <div className="month-nav-title">{monthTitle(selected)}</div>
        <button
          className="icon-btn"
          onClick={() => setSelected(shiftMonth(selected, 1))}
          disabled={selected >= maxMonth}
          title="Další měsíc"
        >
          <IconChevronRight size={28} />
        </button>
      </div>

      {/* ── summary ── */}
      <div className="month-summary">
        <div className="summary-item">
          <span className="summary-label">Příjmy</span>
          <span className="summary-value income">{formatMoney(incomeTotal)}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">Výdaje</span>
          <span className="summary-value expense">{formatMoney(expenseTotal)}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">Úspora</span>
          <span className={`summary-value ${savings < 0 ? "negative" : ""}`} style={savings >= 0 ? { color: "#10b981" } : undefined}>
            {formatMoney(savings)}
          </span>
        </div>
      </div>

      {/* ── chart ── */}
      <div className="card chart">
        {incomeTotal === 0 && expenseTotal === 0 ? (
          <p className="empty">Zatím žádná data za tento měsíc.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
                formatter={(value) => formatMoney(Number(value))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── lists ── */}
      <div className="month-lists">
        <div className="card">
          <div className="chart-head">
            <h3>Výdaje</h3>
            <button className="btn-ghost small" onClick={() => onAdd(`${selected}-01`)}>
              <IconPlus size={14} /> Přidat
            </button>
          </div>
          <TxList items={expenses} categories={store.categories} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="card">
          <div className="chart-head">
            <h3>Příjmy</h3>
            <button className="btn-ghost small" onClick={() => onAdd(`${selected}-01`)}>
              <IconPlus size={14} /> Přidat
            </button>
          </div>
          <TxList items={incomes} categories={store.categories} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* ── stats ── */}
      <div className="month-stats">
        <div className="card stat-sm">
          <span className="stat-label">Denní průměr</span>
          <span className="stat-value-sm">{formatMoney(dailyAvg)}</span>
          <span className="stat-sub">za {days} dní</span>
        </div>
        <div className="card stat-sm">
          <span className="stat-label">Míra úspor</span>
          <span className="stat-value-sm">{savingsRate.toFixed(0)} %</span>
          <span className="stat-sub">z příjmů</span>
        </div>
        <div className="card stat-sm">
          <span className="stat-label">Největší výdaj</span>
          <span className="stat-value-sm">
            {biggestExpense.amount > 0 ? formatMoney(biggestExpense.amount) : "—"}
          </span>
          <span className="stat-sub">
            {biggestExpense.amount > 0
              ? `${biggestExpense.category}${biggestExpense.note ? " · " + biggestExpense.note : ""}`
              : "žádný výdaj"}
          </span>
        </div>
        {changePct !== null && (
          <div className="card stat-sm">
            <span className="stat-label">Oproti minulému</span>
            <span className={`stat-value-sm ${changePct > 0 ? "negative" : ""}`} style={changePct <= 0 ? { color: "#10b981" } : undefined}>
              {changePct > 0 ? "+" : ""}{changePct.toFixed(0)} %
            </span>
            <span className="stat-sub">změna výdajů</span>
          </div>
        )}
      </div>
    </div>
  );
}
