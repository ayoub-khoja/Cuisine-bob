import type { RequestLine } from "@/lib/material-request/sheet";
import { productNameKey, type SupplierProduct } from "@/lib/kitchen-suppliers/supplier";

/** One sellable product, owned by exactly one kitchen supplier. */
export type CatalogProduct = {
  productId: string;
  name: string;
  unit: string;
  supplierId: string;
  companyName: string;
};

export function foreignProductOwner(
  products: Pick<SupplierProduct, "name">[],
  catalog: CatalogProduct[],
  supplierId?: string,
): string | null {
  const owned = new Map<string, CatalogProduct>();
  for (const item of catalog) {
    const key = productNameKey(item.name);
    if (!key || owned.has(key)) continue;
    owned.set(key, item);
  }
  for (const product of products) {
    const owner = owned.get(productNameKey(product.name));
    if (owner && owner.supplierId !== supplierId) {
      return `المنتج «${product.name}» مسجّل لدى ${owner.companyName}`;
    }
  }
  return null;
}

export function matchCatalogProduct(
  name: string,
  catalog: CatalogProduct[],
): CatalogProduct | undefined {
  const key = productNameKey(name);
  if (!key) return undefined;
  const hits = catalog.filter((item) => productNameKey(item.name) === key);
  return hits.length === 1 ? hits[0] : undefined;
}

/** Stamp the single supplier that sells each material. */
export function resolveRequestSuppliers(
  lines: RequestLine[],
  catalog: CatalogProduct[],
): RequestLine[] | string {
  const resolved: RequestLine[] = [];
  for (const line of lines) {
    const key = productNameKey(line.name);
    const hits = catalog.filter((item) => productNameKey(item.name) === key);
    if (hits.length > 1) return `المادة «${line.name}» مرتبطة بأكثر من مزود`;
    const match = hits[0];
    if (!match) return `المادة «${line.name}» غير مرتبطة بمزود`;
    resolved.push({
      ...line,
      name: match.name,
      unit: line.unit || match.unit,
      supplierId: match.supplierId,
      supplierName: match.companyName,
    });
  }
  return resolved;
}
