import { useEffect, useMemo, useState } from "react";
import type { Store, Transaction } from "../types";
import {
  colorForCategory,
  formatMoney,
  monthLabel,
} from "../utils";
import { IconCalendar, IconEdit, IconSearch, IconTrash } from "./icons";

interface Props {
  store: Store;
  month?: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function Transactions({ store, month, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [catFilter, setCatFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    setMonthFilter(month ?? "");
  }, [month]);

  const months = useMemo(() => {
    const set = new Set(store.transactions.map((t) => t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [store.transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.transactions.filter((t) => {
      if (typeFilter !== "all" && t.tx_type !== typeFilter) return false;
      if (catFilter && t.category !== catFilter) return false;
      if (monthFilter && !t.date.startsWith(monthFilter)) return false;
      if (q && !`${t.note} ${t.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [store.transactions, search, typeFilter, catFilter, monthFilter]);

  const sum = filtered.reduce((s, t) => s + (t.tx_type === "income" ? t.amount : -t.amount), 0);

  return (
    <section className="card tx-card">
      <div className="tx-head">
        <h3>Položky</h3>
        <span className="tx-sum">{formatMoney(sum)}</span>
      </div>

      <div className="filters">
        <div className="type-tabs">
          {(["all", "expense", "income"] as const).map((t) => (
            <button
              key={t}
              className={typeFilter === t ? "active" : ""}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "Vše" : t === "expense" ? "Výdaje" : "Příjmy"}
            </button>
          ))}
        </div>

        <div className="filter-fields">
          <div className="search">
            <IconSearch />
            <input
              type="text"
              placeholder="Hledat…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">Všechny kategorie</option>
            {store.categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">Všechny měsíce</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)} {m.slice(0, 4)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Žádné položky neodpovídají filtrům.</p>
      ) : (
        <ul className="tx-list">
          {filtered.map((t, i) => (
            <li key={t.id} style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}>
              <span
                className="dot"
                style={{ backgroundColor: colorForCategory(store.categories, t.category) }}
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
      )}
    </section>
  );
}
