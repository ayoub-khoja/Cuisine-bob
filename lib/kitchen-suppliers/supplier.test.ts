import { describe, expect, it } from "vitest";
import {
  parseKitchenSupplier,
  toListItem,
} from "@/lib/kitchen-suppliers/supplier";

describe("kitchen suppliers", () => {
  it("accepts company, tax id, and products", () => {
    const parsed = parseKitchenSupplier({
      companyName: "  شركة  الأمل  ",
      taxId: "1234567/a/a/m/000",
      products: [
        { id: "product-1", name: "أرز", unit: "كغ" },
        { id: "blank", name: "", unit: "" },
        { name: "زيت", unit: "" },
      ],
    });
    expect(typeof parsed).not.toBe("string");
    if (typeof parsed === "string") return;
    expect(parsed.companyName).toBe("شركة الأمل");
    expect(parsed.taxId).toBe("1234567/A/A/M/000");
    expect(parsed.products).toHaveLength(2);
    expect(parsed.products[1]?.name).toBe("زيت");
    expect(parsed.products[1]?.id.length).toBeGreaterThan(8);
  });

  it("rejects a duplicate product and a short tax id", () => {
    expect(
      parseKitchenSupplier({
        companyName: "شركة النور",
        taxId: "12A",
        products: [{ id: "product-1", name: "سكر", unit: "كغ" }],
      }),
    ).toBe("المعرف الجبائي غير صالح");

    expect(
      parseKitchenSupplier({
        companyName: "شركة النور",
        taxId: "1234567A",
        products: [
          { id: "product-1", name: "سكر", unit: "كغ" },
          { id: "product-2", name: "سكر", unit: "كيس" },
        ],
      }),
    ).toBe("المنتج مكرر لدى هذا المزود");
  });

  it("previews only the first product names on the list", () => {
    const item = toListItem({
      id: "abc",
      companyName: "شركة الأمل",
      taxId: "1234567A",
      products: [
        { id: "1", name: "أرز", nameKey: "أرز", unit: "كغ" },
        { id: "2", name: "زيت", nameKey: "زيت", unit: "ل" },
        { id: "3", name: "سكر", nameKey: "سكر", unit: "كغ" },
        { id: "4", name: "حليب", nameKey: "حليب", unit: "ل" },
      ],
      createdAt: "2026-10-05T00:00:00.000Z",
      updatedAt: "2026-10-05T00:00:00.000Z",
    });
    expect(item.productCount).toBe(4);
    expect(item.productPreview).toEqual(["أرز", "زيت", "سكر"]);
  });
});
