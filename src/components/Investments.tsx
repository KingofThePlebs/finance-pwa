import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Investment, Store } from "../types";
import { formatMoney, monthLabel } from "../utils";
import { persistStore, newId } from "../storage";
import { IconEdit, IconInvest, IconPlus, IconRepeat, IconTrash, IconX } from "./icons";

const HIST_KEY = "finance.invhistory.v1";

function loadHistoryStore(): { month: string; value: number }[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistoryPoint(history: { month: string; value: number }[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(history));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 7);
}

async function fetchPriceKc(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const price = meta?.regularMarketPrice ?? meta?.chartPreviousClose;
    const currency = meta?.currency ?? "";
    if (typeof price !== "number") return null;
    if (currency.toUpperCase() === "CZK") return price;
    const fx = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(currency)}CZK=X?range=1d&interval=1d`);
    if (fx.ok) {
      const fxJson = await fx.json();
      const fxMeta = fxJson?.chart?.result?.[0]?.meta;
      const fxPrice = fxMeta?.regularMarketPrice;
      if (typeof fxPrice === "number") return price * fxPrice;
    }
    return price;
  } catch {
    return null;
  }
}

const YEARS_OPTIONS = [1, 2, 3, 5, 10];

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
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

interface InvModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function InvModal({ title, children, onClose }: InvModalProps) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} title="Zavřít">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Investments({
  store,
  onStore,
  onToast,
}: {
  store: Store;
  onStore: (s: Store) => void;
  onToast: (text: string, kind?: "ok" | "err") => void;
}) {
  const [history, setHistory] = useState<{ month: string; value: number }[]>([]);
  const [years, setYears] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    setHistory(loadHistoryStore());
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const invs = useMemo(() => store.investments, [store.investments]);

  const totals = useMemo(() => {
    const invested = invs.reduce((s, i) => s + i.invested, 0);
    const value = invs.reduce((s, i) => s + i.shares * i.current_price, 0);
    const profit = value - invested;
    const pct = invested > 0 ? (profit / invested) * 100 : 0;
    return { invested, value, profit, pct };
  }, [invs]);

  const pieData = useMemo(
    () =>
      invs
        .map((i) => ({ name: i.name || i.symbol, value: i.shares * i.current_price }))
        .filter((d) => d.value > 0),
    [invs],
  );

  const historyMonths = useMemo(
    () =>
      history.map((h, i) => ({
        i,
        label: monthLabel(h.month),
        full: h.month,
        value: h.value,
      })),
    [history],
  );

  const historyTicks = useMemo(() => {
    const ticks: { i: number; label: string }[] = [];
    historyMonths.forEach((p, i) => {
      if (p.full.endsWith("-01") || i === historyMonths.length - 1) {
        if (ticks.length === 0 || ticks[ticks.length - 1].label !== p.full.slice(0, 4)) {
          ticks.push({ i, label: p.full.slice(0, 4) });
        }
      }
    });
    return ticks;
  }, [historyMonths]);

  async function refreshPrices() {
    setRefreshing(true);
    try {
      let updated = false;
      const updatedInvs = [...store.investments];
      for (let i = 0; i < updatedInvs.length; i++) {
        const inv = updatedInvs[i];
        const price = await fetchPriceKc(inv.symbol);
        if (price !== null) {
          updatedInvs[i] = { ...inv, current_price: price, last_updated: new Date().toISOString() };
          updated = true;
        }
      }
      if (!updated) {
        throw new Error("Nepodařilo se načíst ceny (CORS/filter). Cenu můžeš zadat ručně.");
      }
      const next = persistStore({ ...store, investments: updatedInvs });
      onStore(next);
      onToast("Ceny aktualizovány.");
      const hist = loadHistoryStore();
      const key = todayKey();
      const value = updatedInvs.reduce((s, i) => s + i.shares * i.current_price, 0);
      const existing = hist.filter((h) => h.month !== key);
      saveHistoryPoint([...existing, { month: key, value }].sort((a, b) => (a.month < b.month ? -1 : 1)));
      loadHistory();
    } catch (err) {
      onToast(`Chyba: ${err}`, "err");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSave(data: {
    symbol: string;
    name: string;
    assetType: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
  }) {
    if (editing) {
      const next = persistStore({
        ...store,
        investments: store.investments.map((i) =>
          i.id === editing.id
            ? { ...i, symbol: data.symbol, name: data.name, asset_type: data.assetType, shares: data.shares, avg_price: data.avgPrice, current_price: data.currentPrice, last_updated: new Date().toISOString() }
            : i,
        ),
      });
      onStore(next);
      setShowForm(false);
      setEditing(null);
      onToast("Investice upravena.");
    } else {
      const next = persistStore({
        ...store,
        investments: [
          ...store.investments,
          {
            id: newId(),
            symbol: data.symbol,
            name: data.name,
            asset_type: data.assetType,
            shares: data.shares,
            avg_price: data.avgPrice,
            invested: data.avgPrice * data.shares,
            current_price: data.currentPrice,
            last_updated: null,
          },
        ],
      });
      onStore(next);
      setShowForm(false);
      setEditing(null);
      onToast("Investice přidána.");
    }
  }

  async function handleDelete(id: string) {
    const next = persistStore({
      ...store,
      investments: store.investments.filter((i) => i.id !== id),
    });
    onStore(next);
    setConfirmDelete(null);
    onToast("Investice smazána.");
  }

  const ts = tooltipStyle();
  const axisColor = "var(--muted)";
  const gridColor = "var(--border)";

  const kpis = [
    { label: "Celková hodnota", value: formatMoney(totals.value) },
    { label: "Vloženo", value: formatMoney(totals.invested) },
    {
      label: "Zisk / ztráta",
      value: formatMoney(totals.profit),
      hint: `${totals.pct >= 0 ? "+" : ""}${totals.pct.toFixed(1)} %`,
    },
    {
      label: "Počet investic",
      value: String(invs.length),
      hint: invs.length ? "aktivní pozice" : "",
    },
  ];

  return (
    <div className="stats-page">
      <ul className="stats-grid">
        {kpis.map((k, i) => (
          <li key={k.label} className="card stat" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="stat-label">{k.label}</span>
            <span
              className="stat-value"
              style={
                k.label === "Zisk / ztráta" && k.hint
                  ? { color: totals.profit >= 0 ? "var(--income)" : "var(--danger)" }
                  : undefined
              }
            >
              {k.value}
            </span>
            {k.hint && <span className="stat-sub">{k.hint}</span>}
          </li>
        ))}
      </ul>

      <section className="charts-grid">
        <div className="card chart" style={{ animationDelay: "200ms" }}>
          <div className="tx-head">
            <h3>
              <IconInvest size={16} /> Vývoj portfolia
            </h3>
            <div className="mini-tabs">
              {YEARS_OPTIONS.map((y) => (
                <button
                  key={y}
                  className={years === y ? "active" : ""}
                  onClick={() => setYears(y)}
                >
                  {y} r
                </button>
              ))}
            </div>
          </div>
          {historyMonths.length === 0 ? (
            <p className="empty">
              Žádná historie. Přidej investice a stiskni „Obnovit ceny".
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={historyMonths}>
                <defs>
                  <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="i"
                  type="number"
                  domain={[0, "dataMax"]}
                  ticks={historyTicks.map((t) => t.i)}
                  tickFormatter={(v) => historyTicks.find((t) => t.i === v)?.label ?? ""}
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
                  labelFormatter={(v) => {
                    const p = historyMonths.find((h) => h.i === v);
                    return p ? p.label : String(v);
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#invFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart" style={{ animationDelay: "260ms" }}>
          <h3>Rozložení portfolia</h3>
          {pieData.length === 0 ? (
            <p className="empty">Zatím žádné investice.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pieData.map((d, i) => (
                    <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
      </section>

      <section className="card" style={{ animationDelay: "320ms" }}>
        <div className="tx-head">
          <h3>Moje investice</h3>
          <div className="tx-sum" style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={refreshPrices} disabled={refreshing}>
              <IconRepeat size={15} /> {refreshing ? "Obnovuji…" : "Obnovit ceny"}
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <IconPlus size={15} /> Přidat investici
            </button>
          </div>
        </div>

        {invs.length === 0 ? (
          <p className="empty">Zatím žádné investice. Přidej první (např. AAPL, VWCE.DE, …).</p>
        ) : (
          <ul className="inv-list">
            {invs.map((inv) => {
              const value = inv.shares * inv.current_price;
              const profit = value - inv.invested;
              const pct = inv.invested > 0 ? (profit / inv.invested) * 100 : 0;
              return (
                <li key={inv.id}>
                  <div className="inv-main">
                    <span className="dot" style={{ backgroundColor: "#6366f1" }} />
                    <span className="inv-info">
                      <span className="inv-symbol">{inv.symbol}</span>
                      <span className="tx-note">
                        {inv.name || (inv.asset_type === "etf" ? "ETF" : "Akcie")} ·{" "}
                        {inv.shares} ks · prům. {inv.avg_price.toFixed(2)} Kč
                      </span>
                    </span>
                    <span className="inv-value">
                      <span className="tx-amount">{formatMoney(value)}</span>
                      <span className={`inv-profit ${profit >= 0 ? "up" : "down"}`}>
                        {profit >= 0 ? "+" : ""}
                        {formatMoney(profit)} ({pct.toFixed(1)} %)
                      </span>
                    </span>
                  </div>
                  <div className="inv-actions">
                    <button
                      className="icon-btn"
                      onClick={() => { setEditing(inv); setShowForm(true); }}
                      title="Upravit"
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setConfirmDelete(inv.id)}
                      title="Smazat"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <InvestmentCalculator />

      {showForm && (
        <InvModal
          title={editing ? "Upravit investici" : "Nová investice"}
          onClose={() => { setShowForm(false); setEditing(null); }}
        >
          <InvestmentForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </InvModal>
      )}

      {confirmDelete && (
        <InvModal title="Smazat investici" onClose={() => setConfirmDelete(null)}>
          <p className="panel-hint">Opravdu smazat tuto investici?</p>
          <div className="modal-actions">
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>
              Zrušit
            </button>
            <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>
              Smazat
            </button>
          </div>
        </InvModal>
      )}
    </div>
  );
}

function InvestmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Investment | null;
  onSave: (d: {
    symbol: string;
    name: string;
    assetType: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
  }) => void;
  onCancel: () => void;
}) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [assetType, setAssetType] = useState(initial?.asset_type ?? "stock");
  const [shares, setShares] = useState(initial ? String(initial.shares) : "");
  const [avgPrice, setAvgPrice] = useState(initial ? String(initial.avg_price) : "");
  const [currentPrice, setCurrentPrice] = useState(initial ? String(initial.current_price) : "");

  function submit() {
    const sh = parseFloat(shares.replace(",", "."));
    const pr = parseFloat(avgPrice.replace(",", "."));
    const cpInput = currentPrice.replace(",", ".");
    const cp = cpInput ? parseFloat(cpInput) : pr;
    if (!symbol.trim()) return;
    if (!Number.isFinite(sh) || sh <= 0) return;
    if (!Number.isFinite(pr) || pr <= 0) return;
    if (!Number.isFinite(cp) || cp <= 0) return;
    onSave({
      symbol: symbol.trim(),
      name: name.trim(),
      assetType,
      shares: sh,
      avgPrice: pr,
      currentPrice: cp,
    });
  }

  return (
    <>
      <label className="field">
        Symbol (ticker)
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL, VWCE.DE…" />
      </label>
      <label className="field">
        Název (volitelné)
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple, VWCE…" />
      </label>
      <div className="field">
        Typ
        <div className="mini-tabs" style={{ width: "100%" }}>
          <button
            className={assetType === "stock" ? "active" : ""}
            style={{ flex: 1 }}
            onClick={() => setAssetType("stock")}
          >
            Akcie
          </button>
          <button
            className={assetType === "etf" ? "active" : ""}
            style={{ flex: 1 }}
            onClick={() => setAssetType("etf")}
          >
            ETF
          </button>
        </div>
      </div>
      <div className="field-row">
        <label className="field">
          Počet kusů
          <input value={shares} onChange={(e) => setShares(e.target.value)} placeholder="10" />
        </label>
        <label className="field">
          Průměrná cena (Kč/ks)
          <input value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="185,50" />
        </label>
      </div>
      <label className="field">
        Aktuální cena (Kč/ks, volitelné — nech prázdné = jako průměrná)
        <input value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="190,00" />
      </label>
      <div className="modal-actions">
        <button className="btn-ghost" onClick={onCancel}>
          Zrušit
        </button>
        <button className="btn-primary" onClick={submit} disabled={!symbol.trim()}>
          Uložit
        </button>
      </div>
    </>
  );
}

const FREQ_OPTIONS = [
  { id: "monthly", label: "Měsíčně" },
  { id: "quarterly", label: "Čtvrtletně" },
  { id: "yearly", label: "Ročně" },
];

function InvestmentCalculator() {
  const [start, setStart] = useState("100000");
  const [amount, setAmount] = useState("5000");
  const [freq, setFreq] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");

  const data = useMemo(() => {
    const s0 = parseFloat(start.replace(",", "."));
    const a = parseFloat(amount.replace(",", "."));
    const r = parseFloat(rate.replace(",", "."));
    const y = parseInt(years, 10);
    if (
      !Number.isFinite(s0) || s0 < 0 ||
      !Number.isFinite(a) || a < 0 ||
      !Number.isFinite(r) || r <= -100 ||
      !Number.isFinite(y) || y < 1 || y > 60
    ) {
      return null;
    }

    const months = y * 12;
    const monthlyRate = Math.pow(1 + r / 100, 1 / 12) - 1;

    const points: { i: number; hodnota: number; vklad: number }[] = [];
    let value = s0;
    let invested = s0;
    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        value *= 1 + monthlyRate;
        if (freq === "monthly" || (freq === "quarterly" && m % 3 === 0) || (freq === "yearly" && m % 12 === 0)) {
          value += a;
          invested += a;
        }
      }
      points.push({
        i: m,
        hodnota: Math.round(value),
        vklad: Math.round(invested),
      });
    }
    return {
      points,
      final: value,
      invested,
      profit: value - invested,
      pct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
    };
  }, [start, amount, freq, rate, years]);

  const ts = tooltipStyle();
  const axisColor = "var(--muted)";
  const gridColor = "var(--border)";

  const yearTicks = useMemo(() => {
    if (!data) return [];
    const months = data.points.length - 1;
    const ticks: number[] = [];
    for (let m = 0; m <= months; m += 12) ticks.push(m);
    if (ticks[ticks.length - 1] !== months) ticks.push(months);
    return ticks;
  }, [data]);

  return (
    <section className="card" style={{ animationDelay: "380ms" }}>
      <h3>Investiční kalkulačka</h3>
      <div className="calc-wrap">
        <div className="calc-form">
          <label className="field">
            Počáteční vklad (Kč)
            <input value={start} onChange={(e) => setStart(e.target.value)} inputMode="decimal" />
          </label>
          <div className="field-row">
            <label className="field">
              Pravidelný vklad (Kč)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </label>
            <label className="field">
              Frekvence
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as typeof freq)}
              >
                {FREQ_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              Roční zhodnocení (%)
              <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </label>
            <label className="field">
              Doba spoření (roky)
              <input value={years} onChange={(e) => setYears(e.target.value)} inputMode="numeric" />
            </label>
          </div>

          {data && (
            <div className="calc-result">
              <div>
                <span className="stat-label">Konečná hodnota</span>
                <span className="calc-big">{formatMoney(data.final)}</span>
              </div>
              <div>
                <span className="stat-label">Vloženo</span>
                <span>{formatMoney(data.invested)}</span>
              </div>
              <div>
                <span className="stat-label">Zisk</span>
                <span className={data.profit >= 0 ? "calc-up" : "calc-down"}>
                  {data.profit >= 0 ? "+" : ""}
                  {formatMoney(data.profit)} ({data.pct.toFixed(1)} %)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="calc-chart">
          {!data ? (
            <p className="empty">Vyplň zadané údaje, aby se vygeneroval graf.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="calcFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="i"
                  type="number"
                  domain={[0, "dataMax"]}
                  ticks={yearTicks}
                  tickFormatter={(v) => (v === 0 ? "0" : `${v / 12}`)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip
                  {...ts}
                  labelFormatter={(v) => {
                    const m = Number(v);
                    const year = Math.floor(m / 12);
                    const mon = m % 12;
                    if (mon === 0) return `${year}. rok`;
                    return `${year}. rok, ${mon}. měsíc`;
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="vklad"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  name="Vloženo"
                />
                <Area
                  type="monotone"
                  dataKey="hodnota"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#calcFill)"
                  name="Hodnota"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
