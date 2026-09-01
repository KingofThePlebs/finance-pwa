import { useState } from "react";
import type { Store } from "../types";
import { IconTrash } from "./icons";

const CURRENCIES = [
  { symbol: "Kč", label: "Česká koruna (Kč)" },
  { symbol: "€", label: "Euro (€)" },
  { symbol: "$", label: "Dolar ($)" },
  { symbol: "£", label: "Libra (£)" },
];

const VIEWS = [
  { id: "overview", label: "Přehled" },
  { id: "statistics", label: "Statistiky" },
  { id: "investments", label: "Osobní plán" },
  { id: "categories", label: "Kategorie" },
  { id: "data", label: "Data" },
];

export function Settings({
  store,
  theme,
  onToggleTheme,
  onUpdateSettings,
  onResetData,
}: {
  store: Store;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onUpdateSettings: (currency: string, defaultView: string) => void;
  onResetData: () => void;
}) {
  const [currency, setCurrency] = useState(store.settings.currency);
  const [customCurrency, setCustomCurrency] = useState("");
  const [defaultView, setDefaultView] = useState(store.settings.default_view);
  const [confirmReset, setConfirmReset] = useState(false);

  function applyCurrency(symbol: string) {
    setCurrency(symbol);
    onUpdateSettings(symbol, defaultView);
  }

  function applyCustom() {
    const sym = customCurrency.trim();
    if (!sym) return;
    applyCurrency(sym);
    setCustomCurrency("");
  }

  function applyView(v: string) {
    setDefaultView(v);
    onUpdateSettings(currency, v);
  }

  return (
    <div className="settings-wrap">
      <div className="card">
        <h3>Vzhled</h3>
        <p className="panel-hint">Přepínání mezi tmavým a světlým režimem.</p>
        <div className="settings-group">
          <div className="theme-tabs">
            <button
              className={`theme-tab ${theme === "light" ? "active" : ""}`}
              onClick={() => theme === "dark" && onToggleTheme()}
            >
              Světlý
            </button>
            <button
              className={`theme-tab ${theme === "dark" ? "active" : ""}`}
              onClick={() => theme === "light" && onToggleTheme()}
            >
              Tmavý
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Měna</h3>
        <div className="settings-group">
          <div className="currency-presets">
            {CURRENCIES.map((c) => (
              <button
                key={c.symbol}
                className={`currency-btn ${currency === c.symbol ? "active" : ""}`}
                onClick={() => applyCurrency(c.symbol)}
              >
                <span className="currency-symbol">{c.symbol}</span>
                <span className="currency-label">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="inline-form">
            <input
              type="text"
              placeholder="Vlastní symbol (např. PLN, CHF…)"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
            />
            <button className="btn-ghost" onClick={applyCustom}>
              Použít
            </button>
          </div>
          <p className="panel-hint">
            Symbol měny se zobrazuje u všech částek. Změna se projeví okamžitě.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Úvodní pohled</h3>
        <p className="panel-hint">Která stránka se otevře po spuštění aplikace.</p>
        <div className="settings-group">
          {VIEWS.map((v) => (
            <label key={v.id} className="radio-row">
              <input
                type="radio"
                name="default-view"
                checked={defaultView === v.id}
                onChange={() => applyView(v.id)}
              />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card danger-card">
        <h3>Reset dat</h3>
        <p className="panel-hint">
          Smaže všechny položky, rozpočty, kategorie i opakované výdaje. Tuto akci nelze vrátit.
        </p>
        {confirmReset ? (
          <div className="confirm-row">
            <span className="confirm-text">Opravdu smazat všechna data?</span>
            <button className="btn-danger" onClick={onResetData}>
              Ano, smazat vše
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
              Zrušit
            </button>
          </div>
        ) : (
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            <IconTrash /> Smazat všechna data
          </button>
        )}
      </div>
    </div>
  );
}
