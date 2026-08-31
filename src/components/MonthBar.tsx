import { useMemo } from "react";
import type { Store } from "../types";
import { currentMonthKey, monthTitle } from "../utils";

export function MonthBar({
  store,
  selected,
  onSelect,
}: {
  store: Store;
  selected: string;
  onSelect: (month: string) => void;
}) {
  const months = useMemo(() => {
    const set = new Set(store.transactions.map((t) => t.date.slice(0, 7)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [store.transactions]);

  return (
    <section className="month-bar">
      {months.map((m) => (
        <button
          key={m}
          className={`month-chip${m === selected ? " active" : ""}`}
          onClick={() => onSelect(m)}
        >
          {monthTitle(m)}
        </button>
      ))}
    </section>
  );
}
