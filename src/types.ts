export interface Category {
  name: string;
  color: string;
  tx_type: TxType;
}

export type TxType = "expense" | "income";

export interface Transaction {
  id: string;
  amount: number;
  tx_type: TxType;
  category: string;
  note: string;
  date: string;
}

export interface Settings {
  currency: string;
  default_view: string;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  shares: number;
  avg_price: number;
  invested: number;
  current_price: number;
  last_updated: string | null;
}

export interface Store {
  categories: Category[];
  transactions: Transaction[];
  investments: Investment[];
  settings: Settings;
}

export interface ToastMsg {
  id: number;
  text: string;
  kind: "ok" | "err";
}
