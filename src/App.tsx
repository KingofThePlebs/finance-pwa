import { useCallback, useEffect, useRef, useState } from "react";
import type { Store, ToastMsg, Transaction, TxType } from "./types";
import { setCurrency } from "./utils";
import { loadStore, persistStore, resetStore, newId } from "./storage";
import { MonthView } from "./components/MonthView";
import { Statistics } from "./components/Statistics";
import { CategoriesPanel, DataPanel } from "./components/Panels";
import { TransactionModal } from "./components/TransactionModal";
import { Settings } from "./components/Settings";
import { PersonalPlan } from "./components/PersonalPlan";
import {
  IconChart,
  IconDownload,
  IconInvest,
  IconPlus,
  IconSettings,
  IconTag,
  IconTrend,
} from "./components/icons";
import "./App.css";

type Theme = "light" | "dark";

type View = "overview" | "statistics" | "investments" | "categories" | "data" | "settings";

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Přehled", icon: <IconChart /> },
  { id: "statistics", label: "Statistiky", icon: <IconTrend /> },
  { id: "investments", label: "Osobní plán", icon: <IconInvest /> },
  { id: "categories", label: "Kategorie", icon: <IconTag /> },
  { id: "data", label: "Data", icon: <IconDownload /> },
];

const TITLES: Record<View, string> = {
  overview: "Přehled",
  statistics: "Statistiky",
  investments: "Osobní plán",
  categories: "Kategorie",
  data: "Záloha a export",
  settings: "Nastavení",
};

const VALID_VIEWS: View[] = ["overview", "statistics", "investments", "categories", "data", "settings"];

function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<View>("overview");
  const [prevView, setPrevView] = useState<View>("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("finance.theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(saved ?? (prefersDark ? "dark" : "light"));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("finance.theme", theme);
  }, [theme]);

  const applyStore = useCallback((s: Store) => {
    setCurrency(s.settings.currency);
    setStore(s);
  }, []);

  useEffect(() => {
    const s = loadStore();
    applyStore(s);
    const dv = s.settings.default_view as View;
    setView(VALID_VIEWS.includes(dv) ? dv : "overview");
  }, [applyStore]);

  function save(data: Store) {
    persistStore(data);
    applyStore(data);
  }

  function handleSave(data: {
    amount: number;
    tx_type: TxType;
    category: string;
    note: string;
    date: string;
  }) {
    if (!store) return;
    let next: Store;
    if (editing) {
      next = {
        ...store,
        transactions: store.transactions.map((t) =>
          t.id === editing.id
            ? { ...t, amount: data.amount, tx_type: data.tx_type, category: data.category, note: data.note, date: data.date }
            : t,
        ),
      };
    } else {
      next = {
        ...store,
        transactions: [
          ...store.transactions,
          {
            id: newId(),
            amount: data.amount,
            tx_type: data.tx_type,
            category: data.category,
            note: data.note,
            date: data.date,
          },
        ],
      };
    }
    save(next);
    setModalOpen(false);
    setEditing(null);
    setPrefillDate(null);
    toast(editing ? "Položka upravena." : "Položka přidána.");
  }

  function handleDeleteTx(id: string) {
    if (!store) return;
    save({ ...store, transactions: store.transactions.filter((t) => t.id !== id) });
    toast("Položka smazána.");
  }

  function handleAddCategory(name: string, color: string, txType: string) {
    if (!store) return;
    save({
      ...store,
      categories: [...store.categories, { name, color, tx_type: txType as TxType }],
    });
    toast("Kategorie přidána.");
  }

  function handleUpdateCategory(oldName: string, name: string, color: string, txType: string) {
    if (!store) return;
    const categories = store.categories.map((c) =>
      c.name === oldName ? { ...c, name, color, tx_type: txType as TxType } : c,
    );
    const transactions = store.transactions.map((t) =>
      t.category === oldName ? { ...t, category: name } : t,
    );
    save({ ...store, categories, transactions });
    toast("Kategorie upravena.");
  }

  function handleDeleteCategory(name: string) {
    if (!store) return;
    save({
      ...store,
      categories: store.categories.filter((c) => c.name !== name),
      transactions: store.transactions.filter((t) => t.category !== name),
    });
    toast("Kategorie smazána.");
  }

  function handleUpdateSettings(currency: string, defaultView: string) {
    if (!store) return;
    save({ ...store, settings: { currency, default_view: defaultView } });
  }

  function handleResetData() {
    const s = resetStore();
    applyStore(s);
    setView("overview");
    toast("Všechna data byla smazána.");
  }

  function openAdd(date?: string) {
    setEditing(null);
    setPrefillDate(date ?? null);
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setPrefillDate(null);
    setModalOpen(true);
  }

  function goTo(v: View) {
    if (v === "settings" && view !== "settings") {
      setPrevView(view);
    }
    setView(v);
  }

  function toggleSettings() {
    if (view === "settings") {
      setView(prevView);
    } else {
      setPrevView(view);
      setView("settings");
    }
  }

  if (!store) {
    return <div className="loading">Načítám…</div>;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Finance</span>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => goTo(item.id)}
              title={item.label}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item settings-nav ${view === "settings" ? "active" : ""}`}
            onClick={toggleSettings}
            title="Nastavení"
          >
            <IconSettings />
            <span className="nav-label">Nastavení</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="page-head">
          <h1>{TITLES[view]}</h1>
        </header>

        <div className="view" key={view}>
          {view === "overview" && (
            <MonthView
              store={store}
              onEdit={openEdit}
              onDelete={handleDeleteTx}
              onAdd={openAdd}
            />
          )}

          {view === "statistics" && <Statistics store={store} />}

          {view === "investments" && <PersonalPlan />}

          {view === "categories" && (
            <CategoriesPanel
              store={store}
              onAdd={handleAddCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
              onToast={toast}
            />
          )}

          {view === "data" && <DataPanel store={store} onStore={applyStore} onToast={toast} />}

          {view === "settings" && (
            <Settings
              store={store}
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              onUpdateSettings={handleUpdateSettings}
              onResetData={handleResetData}
            />
          )}
        </div>
      </main>

      <nav className="mobile-tabbar">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`mobile-tab ${view === item.id ? "active" : ""}`}
            onClick={() => goTo(item.id)}
            title={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={`mobile-tab ${view === "settings" ? "active" : ""}`}
          onClick={toggleSettings}
          title="Nastavení"
        >
          <IconSettings />
          <span>Nastavení</span>
        </button>
      </nav>

      <button className="fab" onClick={() => openAdd()} title="Nová položka">
        <IconPlus size={24} />
      </button>

      <TransactionModal
        open={modalOpen}
        editing={editing}
        categories={store.categories}
        initialDate={prefillDate}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setPrefillDate(null);
        }}
        onSave={handleSave}
      />

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
