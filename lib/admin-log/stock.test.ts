import { describe, expect, it } from "vitest";
import { aggregateStock } from "@/lib/admin-log/stock";

describe("admin log stock", () => {
  it("adds the same material from several requests", () => {
    const rows = aggregateStock([
      { name: "بلاتو ألمنيوم", unit: "بلاتو", quantity: 5000, dateKey: "2026-04-10" },
      { name: "بلاتو ألمنيوم", unit: "بلاتو", quantity: 20, dateKey: "2026-10-02" },
      { name: "سكر", unit: "كلغ", quantity: 4, dateKey: "2026-10-02" },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.name === "بلاتو ألمنيوم")).toEqual({
      name: "بلاتو ألمنيوم",
      unit: "بلاتو",
      quantity: 5020,
      dateKey: "2026-10-02",
    });
    expect(rows.find((row) => row.name === "سكر")).toEqual({
      name: "سكر",
      unit: "كلغ",
      quantity: 4,
      dateKey: "2026-10-02",
    });
  });

  it("skips empty names and zero quantities", () => {
    expect(
      aggregateStock([
        { name: "  ", unit: "كلغ", quantity: 3, dateKey: "2026-10-02" },
        { name: "سكر", unit: "كلغ", quantity: 0, dateKey: "2026-10-02" },
      ]),
    ).toEqual([]);
  });
});
