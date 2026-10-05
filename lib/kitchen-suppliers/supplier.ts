/** Kitchen supplier registry (المزودون) — company, tax id, products. */

export type SupplierProduct = {
  id: string;
  name: string;
  /** Normalized name so the same product cannot belong to two suppliers. */
  nameKey: string;
  unit: string;
};

export type KitchenSupplierInput = {
  companyName: string;
  taxId: string;
  products: SupplierProduct[];
};

export type KitchenSupplierRecord = KitchenSupplierInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type KitchenSupplierListItem = {
  id: string;
  companyName: string;
  taxId: string;
  productCount: number;
  productPreview: string[];
  createdAt: string;
  updatedAt: string;
};

const PREVIEW_LIMIT = 3;
const MAX_PRODUCTS = 40;

export function productNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar");
}

export function emptyProduct(): SupplierProduct {
  return { id: crypto.randomUUID(), name: "", nameKey: "", unit: "" };
}

export function emptySupplier(): KitchenSupplierInput {
  return { companyName: "", taxId: "", products: [emptyProduct()] };
}

/** Store tax ids without spaces so 123 / A and 123/A are the same matricule. */
export function normalizeTaxId(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function toListItem(
  record: Pick<
    KitchenSupplierRecord,
    "id" | "companyName" | "taxId" | "products" | "createdAt" | "updatedAt"
  >,
): KitchenSupplierListItem {
  const names = record.products.map((product) => product.name);
  return {
    id: record.id,
    companyName: record.companyName,
    taxId: record.taxId,
    productCount: names.length,
    productPreview: names.slice(0, PREVIEW_LIMIT),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function parseKitchenSupplier(
  body: unknown,
): KitchenSupplierInput | string {
  if (!body || typeof body !== "object") return "بيانات غير صالحة";
  const raw = body as Record<string, unknown>;
  const companyName =
    typeof raw.companyName === "string"
      ? raw.companyName.trim().replace(/\s+/g, " ")
      : "";
  if (companyName.length < 2 || companyName.length > 120)
    return "اسم الشركة غير صالح";

  const taxId = typeof raw.taxId === "string" ? normalizeTaxId(raw.taxId) : "";
  if (!/^[0-9A-Z][0-9A-Z/-]{5,31}$/.test(taxId))
    return "المعرف الجبائي غير صالح";

  if (!Array.isArray(raw.products)) return "المنتجات غير صالحة";
  const products: SupplierProduct[] = [];
  const seen = new Set<string>();
  for (const entry of raw.products) {
    if (!entry || typeof entry !== "object") return "منتج غير صالح";
    const row = entry as Record<string, unknown>;
    const name =
      typeof row.name === "string" ? row.name.trim().replace(/\s+/g, " ") : "";
    const unit =
      typeof row.unit === "string" ? row.unit.trim().replace(/\s+/g, " ") : "";
    if (!name && !unit) continue;
    if (!name || name.length > 80) return "اسم المنتج غير صالح";
    if (unit.length > 30) return "الوحدة طويلة جداً";
    const key = productNameKey(name);
    if (seen.has(key)) return "المنتج مكرر لدى هذا المزود";
    seen.add(key);
    const id =
      typeof row.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(row.id.trim())
        ? row.id.trim()
        : crypto.randomUUID();
    products.push({ id, name, nameKey: key, unit });
  }
  if (products.length === 0) return "أضف منتجاً واحداً على الأقل";
  if (products.length > MAX_PRODUCTS) return "عدد المنتجات كبير جداً";
  return { companyName, taxId, products };
}
