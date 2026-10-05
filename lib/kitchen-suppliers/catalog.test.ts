import { describe, expect, it } from "vitest";
import {
  foreignProductOwner,
  resolveRequestSuppliers,
} from "@/lib/kitchen-suppliers/catalog";
import type { CatalogProduct } from "@/lib/kitchen-suppliers/catalog";

const catalog: CatalogProduct[] = [
  {
    productId: "p1",
    name: "أرز",
    unit: "كغ",
    supplierId: "s1",
    companyName: "شركة الأمل",
  },
];

describe("supplier product catalog", () => {
  it("fills the only supplier that sells the material", () => {
    const resolved = resolveRequestSuppliers(
      [{ id: "line-1", name: "  أرز ", quantity: 2, unit: "" }],
      catalog,
    );
    expect(typeof resolved).not.toBe("string");
    if (typeof resolved === "string") return;
    expect(resolved[0]).toMatchObject({
      name: "أرز",
      unit: "كغ",
      supplierId: "s1",
      supplierName: "شركة الأمل",
    });
  });

  it("rejects a material that no supplier sells", () => {
    expect(
      resolveRequestSuppliers(
        [{ id: "line-1", name: "سكر", quantity: 1, unit: "كغ" }],
        catalog,
      ),
    ).toBe("المادة «سكر» غير مرتبطة بمزود");
  });

  it("blocks assigning the same product to a second supplier", () => {
    expect(
      foreignProductOwner([{ name: "أرز" }], catalog, "s2"),
    ).toBe("المنتج «أرز» مسجّل لدى شركة الأمل");
    expect(foreignProductOwner([{ name: "أرز" }], catalog, "s1")).toBeNull();
  });
});
