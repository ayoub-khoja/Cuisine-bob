import { describe, expect, it } from "vitest";
import {
  emptySheet,
  parseDailySheet,
  sheetTotals,
} from "@/lib/daily-consumption/sheet";

describe("daily consumption sheet", () => {
  it("accepts a checked material with decimal quantities", () => {
    const sheet = emptySheet("2026-01-15");
    const firstUnit = sheet.headcounts[0]?.unit ?? "وحدات التدخل";
    sheet.headcounts[0] = {
      unit: firstUnit,
      paid: { ghada: 48, asha: 14 },
      free: { awda: 8 },
    };
    sheet.lines = [
      {
        id: "line-1",
        name: "كسكسي",
        unit: "كغ",
        qty: { ghada: 0.6, asha: 0.1 },
      },
    ];
    sheet.menu = { ghada: ["كسكسي", "سلطة خضراء"] };

    const parsed = parseDailySheet(sheet);
    expect(typeof parsed).not.toBe("string");
    if (typeof parsed === "string") return;
    expect(parsed.lines).toHaveLength(1);
    expect(sheetTotals(parsed.headcounts)).toEqual({ paid: 62, free: 8 });
  });

  it("rejects a duplicate material", () => {
    const sheet = emptySheet("2026-01-15");
    sheet.lines = [
      { id: "a", name: "أرز", unit: "كغ", qty: {} },
      { id: "b", name: "أرز", unit: "كغ", qty: {} },
    ];
    expect(parseDailySheet(sheet)).toContain("مكررة");
  });
});
