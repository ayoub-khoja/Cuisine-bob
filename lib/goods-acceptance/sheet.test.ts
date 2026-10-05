import { describe, expect, it } from "vitest";
import { buildAcceptances, quantityLabel } from "@/lib/goods-acceptance/sheet";

describe("goods acceptance from material request", () => {
  it("creates one sheet per supplier and keeps that supplier's goods", () => {
    const sheets = buildAcceptances({
      requestId: "req-1",
      serial: "3585",
      dateKey: "2026-04-13",
      lines: [
        {
          id: "a",
          name: "بطاطا",
          quantity: 99,
          unit: "كلغ",
          supplierId: "s1",
          supplierName: "محمد مالك عرعود",
        },
        {
          id: "b",
          name: "كرنب أخضر",
          quantity: 69,
          unit: "كلغ",
          supplierId: "s1",
          supplierName: "محمد مالك عرعود",
        },
        {
          id: "c",
          name: "سكر",
          quantity: 2,
          unit: "كغ",
          supplierId: "s2",
          supplierName: "شركة النور",
        },
      ],
    });
    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toMatchObject({
      serial: "3585",
      supplierName: "محمد مالك عرعود",
    });
    expect(sheets[0]?.lines.map((line) => line.name)).toEqual(["بطاطا", "كرنب أخضر"]);
    expect(sheets[1]?.lines).toHaveLength(1);
    expect(quantityLabel({ quantity: 99 })).toBe("99");
    expect(quantityLabel({ quantity: 0 })).toBe("");
  });
});
