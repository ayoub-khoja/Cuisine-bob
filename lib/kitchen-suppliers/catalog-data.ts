import type { CatalogProduct } from "@/lib/kitchen-suppliers/catalog";
import { kitchenSupplierCollection } from "@/lib/kitchen-suppliers/store";

export async function loadProductCatalog(): Promise<CatalogProduct[]> {
  const collection = await kitchenSupplierCollection();
  const rows = await collection
    .find({}, { projection: { companyName: 1, products: 1 } })
    .toArray();
  const catalog: CatalogProduct[] = [];
  for (const row of rows) {
    if (!Array.isArray(row.products)) continue;
    for (const product of row.products) {
      if (!product?.name) continue;
      catalog.push({
        productId: product.id,
        name: product.name,
        unit: product.unit ?? "",
        supplierId: row._id.toHexString(),
        companyName: row.companyName,
      });
    }
  }
  catalog.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return catalog;
}
