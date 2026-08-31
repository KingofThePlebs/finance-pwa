import type { Store } from "../types";
import {
  currentMonthKey,
  daysElapsedThisMonth,
  daysInMonthOf,
  formatMoney,
  monthTitle,
  previousMonthKeyOf,
} from "../utils";
import { useCountUp } from "../hooks";
import { IconCalendar, IconInvest, IconPiggy, IconTrend, IconWallet } from "./icons";

function Stat({
  label,
  value,
  sub,
  icon,
  accent,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  delay: number;
}) {
  return (
    <div className="card stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" style={{ color: accent, background: `${accent}1a` }}>
          {icon}
        </span>
      </div>
      <div className="stat-value" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function AnimatedValue({ amount }: { amount: number }) {
  const v = useCountUp(amount);
  return <>{formatMoney(v)}</>;
}

export function StatCards({ store, month }: { store: Store; month: string }) {
  const income = store.transactions
    .filter((t) => t.tx_type === "income" && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);
  const expense = store.transactions
    .filter((t) => t.tx_type === "expense" && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = store.transactions
    .filter((t) => t.tx_type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = store.transactions
    .filter((t) => t.tx_type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const isCurrent = month === currentMonthKey();
  const lastMonth = previousMonthKeyOf(month);
  const lastExpense = store.transactions
    .filter((t) => t.tx_type === "expense" && t.date.startsWith(lastMonth))
    .reduce((s, t) => s + t.amount, 0);
  const change = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : null;

  const stats = [
    {
      label: "Zůstatek",
      value: balance,
      sub: "příjmy − výdaje celkem",
      icon: <IconWallet />,
      accent: balance >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Příjmy",
      value: income,
      sub: monthTitle(month),
      icon: <IconTrend up />,
      accent: "#10b981",
    },
    {
      label: "Výdaje",
      value: expense,
      sub: monthTitle(month),
      icon: <IconTrend up={false} />,
      accent: "#6366f1",
    },
  ];

  const changeInfo = change === null
    ? "minulý měsíc bez výdajů"
    : change >= 0
      ? `+${change.toFixed(0)} % oproti minulému měsíci`
      : `${change.toFixed(0)} % oproti minulému měsíci`;

  const invValue = store.investments.reduce((s, i) => s + i.shares * i.current_price, 0);
  const invInvested = store.investments.reduce((s, i) => s + i.invested, 0);
  const invProfit = invValue - invInvested;
  const invPct = invInvested > 0 ? (invProfit / invInvested) * 100 : 0;

  const savings = income - expense;
  const monthExpenses = store.transactions
    .filter((t) => t.tx_type === "expense" && t.date.startsWith(month))
    .map((t) => t);
  const biggest = monthExpenses.reduce(
    (m, t) => (t.amount > m.amount ? t : m),
    monthExpenses[0] ?? { amount: 0, category: "", date: "" },
  );
  const days = isCurrent ? Math.max(daysElapsedThisMonth(), 1) : daysInMonthOf(month);
  const dailyAvg = expense / days;

  return (
    <section className="stats-grid">
      {stats.map((s, i) => (
        <Stat
          key={s.label}
          label={s.label}
          value={<AnimatedValue amount={s.value} />}
          sub={s.sub}
          icon={s.icon}
          accent={s.accent}
          delay={i * 70}
        />
      ))}
      <div className="card stat" style={{ animationDelay: `${stats.length * 70}ms` }}>
        <div className="stat-top">
          <span className="stat-label">Investice</span>
          <span className="stat-icon" style={{ color: "#8b5cf6", background: "#8b5cf61a" }}>
            <IconInvest />
          </span>
        </div>
        <div className="stat-value" style={{ color: "#8b5cf6" }}>
          <AnimatedValue amount={invValue} />
        </div>
        <div className="stat-sub">
          {invInvested > 0
            ? `${invProfit >= 0 ? "+" : ""}${formatMoney(invProfit)} (${invPct.toFixed(1)} %)`
            : "zatím žádné investice"}
        </div>
      </div>
      <div className="card stat" style={{ animationDelay: `${stats.length * 70}ms` }}>
        <div className="stat-top">
          <span className="stat-label">Měsíční srovnání</span>
          <span
            className="stat-icon"
            style={{
              color: change !== null && change < 0 ? "#10b981" : "#6366f1",
              background:
                change !== null && change < 0 ? "#10b9811a" : "#6366f11a",
            }}
          >
            <IconTrend up={change !== null && change < 0} />
          </span>
        </div>
        <div className="stat-value">
          <AnimatedValue amount={expense - lastExpense} />
        </div>
        <div className="stat-sub">
          {changeInfo} · {days}. den měsíce
        </div>
      </div>
      <div className="card stat" style={{ animationDelay: `${(stats.length + 1) * 70}ms` }}>
        <div className="stat-top">
          <span className="stat-label">Úspora měsíce</span>
          <span
            className="stat-icon"
            style={{
              color: savings >= 0 ? "#10b981" : "#ef4444",
              background: savings >= 0 ? "#10b9811a" : "#ef44441a",
            }}
          >
            <IconPiggy />
          </span>
        </div>
        <div className="stat-value" style={{ color: savings >= 0 ? "#10b981" : "#ef4444" }}>
          <AnimatedValue amount={savings} />
        </div>
        <div className="stat-sub">{monthTitle(month)}</div>
      </div>
      <div className="card stat" style={{ animationDelay: `${(stats.length + 2) * 70}ms` }}>
        <div className="stat-top">
          <span className="stat-label">Největší výdaj</span>
          <span className="stat-icon" style={{ color: "#ef4444", background: "#ef44441a" }}>
            <IconTrend up={false} />
          </span>
        </div>
        <div className="stat-value" style={{ color: "#ef4444" }}>
          {biggest.amount > 0 ? <AnimatedValue amount={biggest.amount} /> : "—"}
        </div>
        <div className="stat-sub">
          {biggest.amount > 0 ? `${biggest.category} · ${biggest.date}` : "zatím žádný výdaj"}
        </div>
      </div>
      <div className="card stat" style={{ animationDelay: `${(stats.length + 3) * 70}ms` }}>
        <div className="stat-top">
          <span className="stat-label">Denní průměr</span>
          <span className="stat-icon" style={{ color: "#0ea5e9", background: "#0ea5e91a" }}>
            <IconCalendar size={16} />
          </span>
        </div>
        <div className="stat-value" style={{ color: "#0ea5e9" }}>
          <AnimatedValue amount={dailyAvg} />
        </div>
        <div className="stat-sub">za {days} dní</div>
      </div>
    </section>
  );
}
