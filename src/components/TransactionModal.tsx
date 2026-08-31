import { useEffect, useState } from "react";
import type { Transaction, TxType } from "../types";
import { todayISO } from "../utils";
import { IconX } from "./icons";

interface Props {
  open: boolean;
  editing: Transaction | null;
  categories: { name: string; color: string; tx_type: TxType }[];
  initialDate?: string | null;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    tx_type: TxType;
    category: string;
    note: string;
    date: string;
  }) => void;
}

export function TransactionModal({ open, editing, categories, initialDate, onClose, onSave }: Props) {
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<TxType>("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  const filteredCats = categories.filter((c) => c.tx_type === txType);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAmount(String(editing.amount));
      setTxType(editing.tx_type);
      setCategory(editing.category);
      setNote(editing.note);
      setDate(editing.date);
    } else {
      setAmount("");
      setTxType("expense");
      const expCats = categories.filter((c) => c.tx_type === "expense");
      setCategory(expCats[0]?.name ?? "");
      setNote("");
      setDate(initialDate ?? todayISO());
    }
    setError("");
  }, [open, editing, categories, initialDate]);

  useEffect(() => {
    if (!category || !filteredCats.some((c) => c.name === category)) {
      setCategory(filteredCats[0]?.name ?? "");
    }
  }, [txType]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Zadej platnou částku.");
      return;
    }
    if (!category) {
      setError("Vyber kategorii.");
      return;
    }
    if (!date) {
      setError("Zadej datum.");
      return;
    }
    onSave({ amount: value, tx_type: txType, category, note: note.trim(), date });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{editing ? "Upravit položku" : "Nová položka"}</h3>
          <button className="icon-btn" onClick={onClose} title="Zavřít">
            <IconX />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="type-switch">
            <button
              type="button"
              className={txType === "expense" ? "active expense" : ""}
              onClick={() => setTxType("expense")}
            >
              Výdaj
            </button>
            <button
              type="button"
              className={txType === "income" ? "active income" : ""}
              onClick={() => setTxType("income")}
            >
              Příjem
            </button>
          </div>

          <label className="field">
            Částka (Kč)
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
            />
          </label>

          <div className="field-row">
            <label className="field">
              Kategorie
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {filteredCats.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Datum
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <label className="field">
            Poznámka (volitelné)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="např. nájem, benzín…"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="btn-primary">
              {editing ? "Uložit změny" : "Přidat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
