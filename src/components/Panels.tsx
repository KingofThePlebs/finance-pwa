import { useRef, useState } from "react";
import type { Store } from "../types";
import { persistStore } from "../storage";
import { downloadText } from "../utils";
import {
  IconDownload,
  IconEdit,
  IconTag,
  IconTrash,
  IconUpload,
} from "./icons";

const SWATCHES = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#3b82f6", "#84cc16", "#64748b",
];

export function CategoriesPanel({
  store,
  onAdd,
  onUpdate,
  onDelete,
  onToast,
}: {
  store: Store;
  onAdd: (name: string, color: string, txType: string) => void;
  onUpdate: (oldName: string, name: string, color: string, txType: string) => void;
  onDelete: (name: string) => void;
  onToast: (text: string, kind?: "ok" | "err") => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [txType, setTxType] = useState<string>("expense");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(SWATCHES[0]);
  const [editTxType, setEditTxType] = useState<string>("expense");

  const expenseCats = store.categories.filter((c) => c.tx_type === "expense");
  const incomeCats = store.categories.filter((c) => c.tx_type === "income");

  function add() {
    const n = name.trim();
    if (!n) return;
    if (store.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      onToast("Kategorie už existuje.", "err");
      return;
    }
    onAdd(n, color, txType);
    setName("");
  }

  function startEdit(cat: (typeof store.categories)[number]) {
    setEditing(cat.name);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditTxType(cat.tx_type);
  }

  function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (!n) return;
    if (store.categories.some((c) => c.name.toLowerCase() === n.toLowerCase() && c.name !== editing)) {
      onToast("Kategorie už existuje.", "err");
      return;
    }
    onUpdate(editing, n, editColor, editTxType);
    setEditing(null);
  }

  function renderCat(c: (typeof store.categories)[number]) {
    return (
      <li key={c.name}>
        <span className="dot" style={{ backgroundColor: c.color }} />
        {editing === c.name ? (
          <>
            <input
              type="text"
              className="edit-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="swatches compact">
              {SWATCHES.map((s) => (
                <button
                  key={s}
                  className={`swatch ${editColor === s ? "selected" : ""}`}
                  style={{ background: s }}
                  onClick={() => setEditColor(s)}
                />
              ))}
            </div>
            <select
              className="edit-select"
              value={editTxType}
              onChange={(e) => setEditTxType(e.target.value)}
            >
              <option value="expense">Výdaje</option>
              <option value="income">Příjmy</option>
            </select>
            <button className="btn-ghost" onClick={saveEdit}>
              Uložit
            </button>
          </>
        ) : (
          <>
            <span className="simple-name">{c.name}</span>
            <button className="icon-btn" onClick={() => startEdit(c)} title="Upravit">
              <IconEdit />
            </button>
            <button
              className="icon-btn danger"
              onClick={() => onDelete(c.name)}
              title="Smazat"
            >
              <IconTrash />
            </button>
          </>
        )}
      </li>
    );
  }

  return (
    <div className="card panel">
      <h3>
        <IconTag /> Kategorie
      </h3>

      <div className="inline-form wrap">
        <select
          className="edit-select"
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
        >
          <option value="expense">Výdaje</option>
          <option value="income">Příjmy</option>
        </select>
        <input
          type="text"
          placeholder="Nová kategorie"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="swatches">
          {SWATCHES.map((s) => (
            <button
              key={s}
              className={`swatch ${color === s ? "selected" : ""}`}
              style={{ background: s }}
              onClick={() => setColor(s)}
            />
          ))}
        </div>
        <button className="btn-ghost" onClick={add}>
          Přidat
        </button>
      </div>

      {expenseCats.length > 0 && (
        <>
          <h4 className="cat-section-title">Výdaje</h4>
          <ul className="simple-list">
            {expenseCats.map(renderCat)}
          </ul>
        </>
      )}

      {incomeCats.length > 0 && (
        <>
          <h4 className="cat-section-title">Příjmy</h4>
          <ul className="simple-list">
            {incomeCats.map(renderCat)}
          </ul>
        </>
      )}
    </div>
  );
}

export function DataPanel({
  store,
  onStore,
  onToast,
}: {
  store: Store;
  onStore: (s: Store) => void;
  onToast: (text: string, kind?: "ok" | "err") => void;
}) {
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    const filename = `finance-data_${new Date().toISOString().slice(0, 10)}.json`;
    downloadText(filename, JSON.stringify(store, null, 2));
    onToast(`Exportováno: ${filename}`);
  }

  function exportCsv() {
    let csv = "\uFEFFTRANSAKCE\r\nDatum;Kategorie;Poznámka;Typ;Částka\r\n";
    for (const t of store.transactions) {
      csv += `${t.date};${t.category};${t.note.replace(/;/g, ",")};${t.tx_type};${t.amount.toString().replace(".", ",")}\r\n`;
    }
    csv += "\r\nINVESTICE\r\nSymbol;Název;Typ aktiva;Počet kusů;Průměrná cena;Vloženo;Aktuální cena\r\n";
    for (const i of store.investments) {
      csv += `${i.symbol};${i.name.replace(/;/g, ",")};${i.asset_type};${i.shares};${i.avg_price};${i.invested};${i.current_price}\r\n`;
    }
    csv += "\r\nKATEGORIE\r\nNázev;Barva;Typ\r\n";
    for (const c of store.categories) {
      csv += `${c.name};${c.color};${c.tx_type}\r\n`;
    }
    const filename = `finance-data_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadText(filename, csv);
    onToast(`Exportováno: ${filename}`);
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Store;
      const s = persistStore(parsed);
      onStore(s);
      onToast("Data byla naimportována.");
    } catch {
      onToast("Nepodařilo se načíst soubor.", "err");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="card panel">
      <h3>Záloha a export</h3>
      <p className="panel-hint">
        Data jsou uložená v prohlížeči na tomto zařízení. Pravidelně exportuj zálohu.
      </p>
      <div className="btn-stack">
        <button className="btn-ghost wide" onClick={exportJson}>
          <IconDownload /> Export JSON
        </button>
        <button className="btn-ghost wide" onClick={exportCsv}>
          <IconDownload /> Export CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={onFilePicked}
        />
        <button
          className="btn-ghost wide"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          <IconUpload /> {importing ? "Načítám…" : "Import JSON"}
        </button>
      </div>
    </div>
  );
}
