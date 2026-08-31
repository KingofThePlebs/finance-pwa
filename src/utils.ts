let CURRENCY = "Kč";

export function setCurrency(symbol: string) {
  if (symbol && symbol.trim()) {
    CURRENCY = symbol.trim();
  }
}

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  return (
    sign +
    Math.abs(amount).toLocaleString("cs-CZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) +
    " " +
    CURRENCY
  );
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthKeyOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function currentMonthKey(date = todayISO()): string {
  return date.slice(0, 7);
}

export function monthLabel(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleDateString("cs-CZ", { month: "short" })
    .replace(".", "");
}

export function monthTitle(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
}

export function previousMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function daysElapsedThisMonth(): number {
  const now = new Date();
  return now.getDate();
}

export function daysInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function daysInMonthOf(ym: string): number {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function previousMonthKeyOf(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function colorForCategory(categories: { name: string; color: string }[], name: string): string {
  return categories.find((c) => c.name === name)?.color ?? "#94a3b8";
}

export function parseAmount(input: string): number | null {
  const value = parseFloat(input.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
