import { useState } from "react";
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
  formatMoney,
  monthLabel,
  previousMonthKeys,
} from "../utils";

const RANGE_OPTIONS = [
  { value: 6, label: "6m" },
  { value: 12, label: "1r" },
  { value: 24, label: "2r" },
];

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      color: "var(--text)",
      fontSize: 13,
      boxShadow: "0 10px 30px rgba(0,0,0,.12)",
    },
    labelStyle: { color: "var(--muted)" },
  };
}

function BandCursor({
  x,
  y,
  width,
  height,
  payload,
  onSelectMonth,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: Array<{ payload?: { month?: string } }>;
  onSelectMonth?: (month: string) => void;
}) {
  const month = payload?.[0]?.payload?.month;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(99,102,241,.07)"
      style={{ cursor: "pointer" }}
      onClick={() => month && onSelectMonth?.(month)}
    />
  );
}

function PieCard({
  title,
  data,
  emptyText,
  categories,
  ts,
  axisColor,
}: {
  title: string;
  data: { name: string; value: number }[];
  emptyText: string;
  categories: Store["categories"];
  ts: ReturnType<typeof tooltipStyle>;
  axisColor: string;
}) {
  return (
    <div className="card chart" style={{ animationDelay: "380ms" }}>
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colorForCategory(categories, d.name)} />
              ))}
            </Pie>
            <Tooltip {...ts} formatter={(value) => formatMoney(Number(value))} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: axisColor }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function Charts({
  store,
  onSelectMonth,
}: {
  store: Store;
  onSelectMonth?: (month: string) => void;
}) {
  const [range, setRange] = useState(6);
  const keys = previousMonthKeys(range);
  const data = keys.map((key) => {
    const income = store.transactions
      .filter((t) => t.tx_type === "income" && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    const expense = store.transactions
      .filter((t) => t.tx_type === "expense" && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    return { label: monthLabel(key), month: key, příjmy: income, výdaje: expense };
  });

  const month = currentMonthKey();
  const monthExpenses = store.transactions.filter(
    (t) => t.tx_type === "expense" && t.date.startsWith(month),
  );
  const monthIncomes = store.transactions.filter(
    (t) => t.tx_type === "income" && t.date.startsWith(month),
  );
  const expensePieData = store.categories
    .map((c) => ({
      name: c.name,
      value: monthExpenses
        .filter((t) => t.category === c.name)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const incomePieData = store.categories
    .map((c) => ({
      name: c.name,
      value: monthIncomes
        .filter((t) => t.category === c.name)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const ts = tooltipStyle();
  const axisColor = "var(--muted)";
  const gridColor = "var(--border)";

  return (
    <section className="charts-grid">
      <div className="card chart chart-full" style={{ animationDelay: "300ms" }}>
        <div className="chart-head">
          <h3>Příjmy a výdaje · {range} měsíců</h3>
          <div className="mini-tabs">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={range === o.value ? "active" : ""}
                onClick={() => setRange(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip
              {...ts}
              formatter={(value) => formatMoney(Number(value))}
              cursor={<BandCursor onSelectMonth={onSelectMonth} />}
            />
            <Bar
              dataKey="příjmy"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={26}
              className="chart-bar"
              onClick={(entry) => {
                const m = (entry.payload as { month?: string }).month;
                if (m) onSelectMonth?.(m);
              }}
            />
            <Bar
              dataKey="výdaje"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={26}
              className="chart-bar"
              onClick={(entry) => {
                const m = (entry.payload as { month?: string }).month;
                if (m) onSelectMonth?.(m);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <PieCard
        title="Výdaje podle kategorií"
        data={expensePieData}
        emptyText="Tento měsíc zatím žádné výdaje."
        categories={store.categories}
        ts={ts}
        axisColor={axisColor}
      />
      <PieCard
        title="Příjmy podle kategorií"
        data={incomePieData}
        emptyText="Tento měsíc zatím žádné příjmy."
        categories={store.categories}
        ts={ts}
        axisColor={axisColor}
      />
    </section>
  );
}
