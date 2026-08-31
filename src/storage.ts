import type { Store } from "./types";
import { setCurrency } from "./utils";

const STORAGE_KEY = "finance.store.v1";

export function defaultStore(): Store {
  const expenseCats = [
    { name: "Potraviny", color: "#e74c3c" },
    { name: "Bydlení", color: "#8e44ad" },
    { name: "Doprava", color: "#2980b9" },
    { name: "Zábava", color: "#e67e22" },
    { name: "Zdraví", color: "#27ae60" },
    { name: "Oblečení", color: "#f39c12" },
    { name: "Vzdělání", color: "#16a085" },
    { name: "Ostatní výdaje", color: "#95a5a6" },
  ];
  const incomeCats = [
    { name: "Mzda", color: "#10b981" },
    { name: "Podnikání", color: "#06b6d4" },
    { name: "Investice", color: "#8b5cf6" },
    { name: "Ostatní příjmy", color: "#64748b" },
  ];
  return {
    categories: [
      ...expenseCats.map((c) => ({ ...c, tx_type: "expense" as const })),
      ...incomeCats.map((c) => ({ ...c, tx_type: "income" as const })),
    ],
    transactions: [],
    investments: [],
    settings: { currency: "Kč", default_view: "overview" },
  };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const d = defaultStore();
      setCurrency(d.settings.currency);
      return d;
    }
    const parsed = JSON.parse(raw) as Store;
    const def = defaultStore();
    const store: Store = {
      categories: parsed.categories ?? def.categories,
      transactions: parsed.transactions ?? [],
      investments: parsed.investments ?? [],
      settings: {
        currency: parsed.settings?.currency ?? "Kč",
        default_view: parsed.settings?.default_view ?? "overview",
      },
    };
    setCurrency(store.settings.currency);
    return store;
  } catch {
    const d = defaultStore();
    setCurrency(d.settings.currency);
    return d;
  }
}

export function persistStore(store: Store): Store {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  setCurrency(store.settings.currency);
  return store;
}

export function resetStore(): Store {
  const d = defaultStore();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  setCurrency(d.settings.currency);
  return d;
}

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
