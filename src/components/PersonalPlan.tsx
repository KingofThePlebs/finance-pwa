import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "../utils";
import { IconRepeat } from "./icons";

/* ------------------------------------------------------------------ */
/*  Otázky testu                                                        */
/* ------------------------------------------------------------------ */

interface ScaleQuestion {
  id: string;
  label: string;
  low: string;
  high: string;
}

const SCALE_QUESTIONS: ScaleQuestion[] = [
  {
    id: "stability",
    label: "Jak stabilní je tvůj měsíční příjem?",
    low: "Nepravidelný",
    high: "Zcela stabilní",
  },
  {
    id: "reserve",
    label: "Jak velkou finanční rezervu nyní máš?",
    low: "Žádnou",
    high: "Na 6+ měsíců",
  },
  {
    id: "risk",
    label: "Jak moc jsi ochotný/a snášet riziko?",
    low: "Vůbec",
    high: "Velmi ochotný/á",
  },
  {
    id: "horizon",
    label: "Na jak dlouhý horizont investuješ?",
    low: "Do 1 roku",
    high: "10+ let",
  },
  {
    id: "experience",
    label: "Jaké máš zkušenosti s investováním?",
    low: "Žádné",
    high: "Velké",
  },
];

/* ------------------------------------------------------------------ */
/*  Investiční kalkulačka (původní, umístěná úplně dole)                */
/* ------------------------------------------------------------------ */

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
      points.push({ i: m, hodnota: Math.round(value), vklad: Math.round(invested) });
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
              <select value={freq} onChange={(e) => setFreq(e.target.value as typeof freq)}>
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

/* ------------------------------------------------------------------ */
/*  Hlavní komponenta: Osobní plán                                       */
/* ------------------------------------------------------------------ */

export function PersonalPlan() {
  /* Škálové odpovědi: id → 1..5 */
  const [scale, setScale] = useState<Record<string, number>>({});
  /* Číselné odpovědi */
  const [salary, setSalary] = useState("");
  const [expenses, setExpenses] = useState("");
  /* Šetřicí plán */
  const [goal, setGoal] = useState("");
  const [goalYears, setGoalYears] = useState("1");

  const answeredScale = SCALE_QUESTIONS.every((q) => typeof scale[q.id] === "number");
  const salaryNum = parseFloat(salary.replace(/\s/g, "").replace(",", "."));
  const expNum = parseFloat(expenses.replace(/\s/g, "").replace(",", "."));
  const numericValid = Number.isFinite(salaryNum) && salaryNum > 0 && Number.isFinite(expNum) && expNum >= 0;

  const testDone = answeredScale && numericValid;

  function restart() {
    setScale({});
    setSalary("");
    setExpenses("");
  }

  const results = useMemo(() => {
    if (!testDone) return null;
    const avg = SCALE_QUESTIONS.reduce((s, q) => s + (scale[q.id] ?? 0), 0) / SCALE_QUESTIONS.length; // 1..5
    const free = Math.max(0, salaryNum - expNum); // disponibilní příjem
    const cushionMonths = Math.round(3 + ((avg - 1) / 4) * 3); // 3..6
    const cushion = expNum * cushionMonths;
    const pctEtf = Math.round(20 + (avg - 1) * 12.5); // 20..70 %
    const pctCash = 100 - pctEtf;
    return { avg, free, cushionMonths, cushion, pctEtf, pctCash };
  }, [testDone, scale, salaryNum, expNum]);

  /* Šetřicí plán */
  const goalNum = parseFloat(goal.replace(/\s/g, "").replace(",", "."));
  const gy = parseInt(goalYears, 10);
  const saving = useMemo(() => {
    if (!Number.isFinite(goalNum) || goalNum <= 0 || !Number.isFinite(gy) || gy < 1 || gy > 100) {
      return null;
    }
    const months = gy * 12;
    const monthly = goalNum / months;
    return {
      monthly,
      quarterly: monthly * 3,
      yearly: monthly * 12,
    };
  }, [goalNum, gy]);

  return (
    <div className="plan-page">
      {/* ------- TEST ------- */}
      <section className="card">
        <div className="tx-head">
          <h3>Finanční test</h3>
          {testDone && (
            <button className="btn-ghost" onClick={restart}>
              <IconRepeat size={15} /> Spustit test znovu
            </button>
          )}
        </div>

        <p className="panel-hint">
          Projdi si otázky. Škála udává tvůj postoj od <b>1 ({SCALE_QUESTIONS[0].low})</b> po{" "}
          <b>5 ({SCALE_QUESTIONS[0].high})</b>. U každé otázky vyber právě jednu hodnotu.
        </p>

        {/* Škálové otázky */}
        {SCALE_QUESTIONS.map((q) => (
          <div key={q.id} className="plan-question">
            <div className="plan-q-label">{q.label}</div>
            <div className="survey-scale">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`sq ${scale[q.id] === n ? "active" : ""}`}
                  onClick={() => setScale((prev) => ({ ...prev, [q.id]: n }))}
                  title={`${q.low} … ${q.high}`}
                >
                  <span className="sq-icon" />
                  <span className="sq-num">{n}</span>
                </button>
              ))}
            </div>
            <div className="survey-ends">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
          </div>
        ))}

        {/* Číselné otázky */}
        <div className="plan-question">
          <div className="plan-q-label">Jaká je vaše přibližná měsíční výplata?</div>
          <input
            className="plan-num-input"
            type="text"
            inputMode="numeric"
            placeholder="např. 40000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div className="plan-question">
          <div className="plan-q-label">
            Jaké jsou vaše přibližné měsíční výdaje (pouze nutné: bydlení, jídlo, elektřina atd.)?
          </div>
          <input
            className="plan-num-input"
            type="text"
            inputMode="numeric"
            placeholder="např. 25000"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
          />
        </div>

        {!testDone && (
          <button className="btn-primary" disabled>
            Vyplníš všechny otázky, abys viděl/a výsledky
          </button>
        )}
      </section>

      {/* ------- VÝSLEDKY ------- */}
      {results && (
        <section className="plan-results">
          <div className="stats-grid">
            <div className="card stat">
              <span className="stat-label">Ideální finanční polštář</span>
              <span className="stat-value">{formatMoney(results.cushion)}</span>
              <span className="stat-sub">≈ {results.cushionMonths} měsíců provozních výdajů</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Doporučené % na ETF</span>
              <span className="stat-value">{results.pctEtf} %</span>
              <span className="stat-sub">z volného příjmu ({formatMoney(results.free)} / měsíc)</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Do hotovosti / na účet</span>
              <span className="stat-value">{results.pctCash} %</span>
              <span className="stat-sub">z volného příjmu</span>
            </div>
          </div>
        </section>
      )}

      {/* ------- ŠETŘICÍ PLÁN ------- */}
      <section className="card">
        <h3>Šetřicí plán</h3>
        <p className="panel-hint">
          Zadej cílovou částku a časový horizont. Plán spočítá, kolik musíš měsíčně odkládat bokem.
        </p>
        <div className="field-row">
          <label className="field">
            Cílová částka (Kč)
            <input
              type="text"
              inputMode="numeric"
              placeholder="např. 60000"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <label className="field">
            Za jak dlouho (roky)
            <input
              type="number"
              min={1}
              value={goalYears}
              onChange={(e) => setGoalYears(e.target.value)}
            />
          </label>
        </div>

        {saving ? (
          <div className="calc-result">
            <div>
              <span className="stat-label">Měsíčně odkládat</span>
              <span className="calc-big">{formatMoney(saving.monthly)}</span>
            </div>
            <div>
              <span className="stat-label">Čtvrtletně</span>
              <span>{formatMoney(saving.quarterly)}</span>
            </div>
            <div>
              <span className="stat-label">Ročně</span>
              <span>{formatMoney(saving.yearly)}</span>
            </div>
          </div>
        ) : (
          <p className="empty">Vyplň cílovou částku a horizont, aby se spočítal plán.</p>
        )}
      </section>

      {/* ------- INVESTIČNÍ KALKULAČKA (dole) ------- */}
      <InvestmentCalculator />
    </div>
  );
}