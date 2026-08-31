import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Store } from "../types";
import {
  colorForCategory,
  currentMonthKey,
  daysElapsedThisMonth,
  daysInMonthOf,
  formatMoney,
  monthLabel,
  monthTitle,
  previousMonthKeyOf,
} from "../utils";
import { IconChevronLeft, IconChevronRight } from "./icons";

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Statistics({ store }: { store: Store }) {
  const [selected, setSelected] = useState(currentMonthKey());
  const maxMonth = currentMonthKey();
  const isCurrent = selected === currentMonthKey();

  /* ── selected month ── */
  const selExpenses = useMemo(
    () => store.transactions.filter((t) => t.tx_type === "expense" && t.date.startsWith(selected)),
    [store.transactions, selected],
  );
  const selIncomes = useMemo(
    () => store.transactions.filter((t) => t.tx_type === "income" && t.date.startsWith(selected)),
    [store.transactions, selected],
  );
  const selIncome = selIncomes.reduce((s, t) => s + t.amount, 0);
  const selExpense = selExpenses.reduce((s, t) => s + t.amount, 0);
  const selSavings = selIncome - selExpense;
  const days = isCurrent ? Math.max(daysElapsedThisMonth(), 1) : daysInMonthOf(selected);
  const selDailyAvg = selExpense / days;
  const selSavingsRate = selIncome > 0 ? (selSavings / selIncome) * 100 : 0;
  const prevKey = previousMonthKeyOf(selected);
  const prevExpense = store.transactions
    .filter((t) => t.tx_type === "expense" && t.date.startsWith(prevKey))
    .reduce((s, t) => s + t.amount, 0);
  const selChangePct = prevExpense > 0 ? ((selExpense - prevExpense) / prevExpense) * 100 : null;

  const selPieData = useMemo(() => {
    return store.categories
      .map((c) => ({
        name: c.name,
        value: selExpenses.filter((t) => t.category === c.name).reduce((s, t) => s + t.amount, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [selExpenses, store.categories]);

  /* ── all months averages ── */
  const allKeys = useMemo(() => {
    const s = new Set<string>();
    store.transactions.forEach((t) => s.add(t.date.slice(0, 7)));
    return [...s].sort();
  }, [store.transactions]);
  const monthCount = allKeys.length || 1;

  const allMonthData = useMemo(() => {
    let cum = 0;
    return allKeys.map((key) => {
      const income = store.transactions
        .filter((t) => t.tx_type === "income" && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);
      const expense = store.transactions
        .filter((t) => t.tx_type === "expense" && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);
      cum += income - expense;
      return { label: monthLabel(key), příjmy: income, výdaje: expense, zůstatek: cum };
    });
  }, [store.transactions, allKeys]);

  const avgIncome = allMonthData.reduce((s, m) => s + m.příjmy, 0) / monthCount;
  const avgExpense = allMonthData.reduce((s, m) => s + m.výdaje, 0) / monthCount;
  const avgSavings = avgIncome - avgExpense;
  const avgSavingsRate = avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0;

  const avgPieData = useMemo(() => {
    return store.categories
      .map((c) => ({
        name: c.name,
        value: store.transactions
          .filter((t) => t.tx_type === "expense" && t.category === c.name)
          .reduce((s, t) => s + t.amount, 0) / monthCount,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [store.transactions, store.categories, monthCount]);

  /* ── theme ── */
  const ts = {
    contentStyle: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      color: "var(--text)",
      fontSize: 13,
    },
    labelStyle: { color: "var(--muted)" },
  };
  const axisColor = "var(--muted)";
  const gridColor = "var(--border)";

  return (
    <div className="stats-two-col">
      {/* ══ LEFT — selected month ══ */}
      <div className="stats-col">
        <div className="month-nav">
          <button className="icon-btn" onClick={() => setSelected(shiftMonth(selected, -1))}>
            <IconChevronLeft size={24} />
          </button>
          <div className="month-nav-title">{monthTitle(selected)}</div>
          <button className="icon-btn" onClick={() => setSelected(shiftMonth(selected, 1))} disabled={selected >= maxMonth}>
            <IconChevronRight size={24} />
          </button>
        </div>

        <ul className="stats-grid stats-grid-3">
          <li className="card stat">
            <span className="stat-label">Příjmy</span>
            <span className="stat-value" style={{ color: "#10b981" }}>{formatMoney(selIncome)}</span>
          </li>
          <li className="card stat">
            <span className="stat-label">Výdaje</span>
            <span className="stat-value" style={{ color: "#6366f1" }}>{formatMoney(selExpense)}</span>
          </li>
          <li className="card stat">
            <span className="stat-label">Úspora</span>
            <span className={`stat-value ${selSavings < 0 ? "negative" : ""}`} style={selSavings >= 0 ? { color: "#10b981" } : undefined}>
              {formatMoney(selSavings)}
            </span>
          </li>
        </ul>

        <div className="card chart">
          <h3>Výdaje podle kategorií</h3>
          {selPieData.length === 0 ? (
            <p className="empty">Zatím žádné výdaje.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={selPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                  {selPieData.map((d) => (
                    <Cell key={d.name} fill={colorForCategory(store.categories, d.name)} />
                  ))}
                </Pie>
                <Tooltip {...ts} formatter={(value) => formatMoney(Number(value))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: axisColor }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <ul className="stats-grid stats-grid-3">
          <li className="card stat-sm">
            <span className="stat-label">Denní průměr</span>
            <span className="stat-value-sm">{formatMoney(selDailyAvg)}</span>
          </li>
          <li className="card stat-sm">
            <span className="stat-label">Míra úspor</span>
            <span className="stat-value-sm">{selSavingsRate.toFixed(0)} %</span>
          </li>
          {selChangePct !== null && (
            <li className="card stat-sm">
              <span className="stat-label">Oproti minulému</span>
              <span className={`stat-value-sm ${selChangePct > 0 ? "negative" : ""}`} style={selChangePct <= 0 ? { color: "#10b981" } : undefined}>
                {selChangePct > 0 ? "+" : ""}{selChangePct.toFixed(0)} %
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* ══ RIGHT — all months ══ */}
      <div className="stats-col">
        <div className="card stat-header">
          <h3>Průměry přes {monthCount} měsíců</h3>
        </div>

        <ul className="stats-grid stats-grid-3">
          <li className="card stat">
            <span className="stat-label">Prům. příjmy</span>
            <span className="stat-value" style={{ color: "#10b981" }}>{formatMoney(avgIncome)}</span>
          </li>
          <li className="card stat">
            <span className="stat-label">Prům. výdaje</span>
            <span className="stat-value" style={{ color: "#6366f1" }}>{formatMoney(avgExpense)}</span>
          </li>
          <li className="card stat">
            <span className="stat-label">Prům. úspora</span>
            <span className={`stat-value ${avgSavings < 0 ? "negative" : ""}`} style={avgSavings >= 0 ? { color: "#10b981" } : undefined}>
              {formatMoney(avgSavings)}
            </span>
          </li>
        </ul>

        <div className="card chart">
          <h3>Vývoj přes měsíce</h3>
          {allMonthData.every((m) => m.příjmy === 0 && m.výdaje === 0) ? (
            <p className="empty">Zatím žádná data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allMonthData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={42} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip {...ts} formatter={(value) => formatMoney(Number(value))} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="příjmy" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22} />
                <Bar dataKey="výdaje" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart">
          <h3>Výdaje podle kategorií · průměr</h3>
          {avgPieData.length === 0 ? (
            <p className="empty">Zatím žádné výdaje.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={avgPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                  {avgPieData.map((d) => (
                    <Cell key={d.name} fill={colorForCategory(store.categories, d.name)} />
                  ))}
                </Pie>
                <Tooltip {...ts} formatter={(value) => formatMoney(Number(value))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: axisColor }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <ul className="stats-grid stats-grid-3">
          <li className="card stat-sm">
            <span className="stat-label">Prům. denní výdaje</span>
            <span className="stat-value-sm">{formatMoney(avgExpense / 30)}</span>
          </li>
          <li className="card stat-sm">
            <span className="stat-label">Prům. míra úspor</span>
            <span className="stat-value-sm">{avgSavingsRate.toFixed(0)} %</span>
          </li>
          <li className="card stat-sm">
            <span className="stat-label">Počet měsíců</span>
            <span className="stat-value-sm">{monthCount}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
