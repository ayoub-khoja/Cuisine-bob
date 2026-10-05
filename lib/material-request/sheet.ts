/** Material request (طلب مواد) — fields match the paper form. */

export type RequestLine = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  /** Supplier that sells this material. One product belongs to one supplier. */
  supplierId?: string;
  supplierName?: string;
};

/** Signature line under the unit title on the paper. */
export const DEFAULT_SIGNATORY = "العميد / وجدي اليعقوبي";

export type RequestInput = {
  serial: string;
  dateKey: string;
  lines: RequestLine[];
  signatory: string;
};

export type RequestRecord = RequestInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type RequestListItem = {
  id: string;
  serial: string;
  dateKey: string;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
};

export function todayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptyLine(): RequestLine {
  return { id: crypto.randomUUID(), name: "", quantity: 0, unit: "" };
}

export function emptyRequest(): RequestInput {
  return {
    serial: "",
    dateKey: todayDateKey(),
    lines: [emptyLine()],
    signatory: DEFAULT_SIGNATORY,
  };
}

export function paperDate(dateKey: string): string {
  return dateKey.replaceAll("-", "/");
}

export function parseRequest(body: unknown): RequestInput | string {
  if (!body || typeof body !== "object") return "بيانات غير صالحة";
  const raw = body as Record<string, unknown>;
  const serial = typeof raw.serial === "string" ? raw.serial.trim() : "";
  const dateKey = typeof raw.dateKey === "string" ? raw.dateKey.trim() : "";
  if (!serial || serial.length > 20) return "الرقم غير صالح";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "التاريخ غير صالح";
  if (!Array.isArray(raw.lines)) return "الأسطر غير صالحة";

  const lines: RequestLine[] = [];
  for (const entry of raw.lines) {
    if (!entry || typeof entry !== "object") return "سطر غير صالح";
    const row = entry as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const unit = typeof row.unit === "string" ? row.unit.trim() : "";
    const quantityRaw = row.quantity;
    const quantity =
      quantityRaw == null || quantityRaw === ""
        ? 0
        : typeof quantityRaw === "number"
          ? quantityRaw
          : Number(quantityRaw);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1000000) {
      return "الكمية غير صالحة";
    }
    if (!name && quantity === 0 && !unit) continue;
    if (!name || name.length > 80) return "اسم المادة غير صالح";
    if (unit.length > 30) return "الوحدة طويلة جداً";
    const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : crypto.randomUUID();
    lines.push({ id, name, quantity, unit });
  }
  if (lines.length === 0) return "أضف مادة واحدة على الأقل";
  if (lines.length > 30) return "عدد المواد كبير جداً";
  const signatoryRaw = typeof raw.signatory === "string" ? raw.signatory.trim() : "";
  if (signatoryRaw.length > 80) return "الإمضاء طويل جداً";
  return { serial, dateKey, lines, signatory: signatoryRaw || DEFAULT_SIGNATORY };
}
