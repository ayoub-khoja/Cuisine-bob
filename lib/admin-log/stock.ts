export type StockLine = {
  name: string;
  unit: string;
  quantity: number;
  dateKey: string;
};

export type StockRow = StockLine;

/** Sum material-request lines into one stock row per name + unit. */
export function aggregateStock(lines: StockLine[]): StockRow[] {
  const totals = new Map<string, StockRow>();
  for (const line of lines) {
    const name = line.name.trim();
    if (!name || line.quantity <= 0) continue;
    const unit = line.unit.trim();
    const dateKey = line.dateKey.trim();
    const key = `${name}\0${unit}`;
    const current = totals.get(key);
    if (current) {
      current.quantity += line.quantity;
      if (dateKey > current.dateKey) current.dateKey = dateKey;
    } else totals.set(key, { name, unit, quantity: line.quantity, dateKey });
  }
  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
}
