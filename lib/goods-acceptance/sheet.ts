import type { RequestLine } from "@/lib/material-request/sheet";

/** Printed header on محضر قبول السلع. */
export const ACCEPTANCE_UNIT = "مطعم الفوج الجهوي لحفظ النظام بالمنستير";
export const ACCEPTANCE_BENEFICIARY = ACCEPTANCE_UNIT;
export const ACCEPTANCE_COMMAND = "امر الفوج الجهوي لحفظ النظام بالمنستير";
export const ACCEPTANCE_SIGNATORY = "العميد / وجدي اليعقوبي";
export const ACCEPTANCE_VET_NOTE =
  "يتم اللجوء إلى الطبيب البيطري في صورة تسجيل اخلالات باللحوم المعروضة. (1)";

/** Two-line block, underlined, on the right of the paper header. */
export const ACCEPTANCE_UNIT_LINES = ["مطعم الفوج الجهوي لحفظ النظام", "بالمنستير"] as const;

export type AcceptanceNoteSection = {
  label: string;
  value?: string;
  underline?: boolean;
  items: readonly string[];
};

/** Upper half of the ملاحظات cell. Dotted leaders sit between this block and the committee. */
export const ACCEPTANCE_NOTE_TOP: readonly AcceptanceNoteSection[] = [
  { label: "نوعية البضاعة", value: "خضر و غلال", items: [] },
  {
    label: "صلاحية البضاعة",
    underline: true,
    items: ["مطابقة لكراس الشروط : نعم", "غير مطابقة لكراس الشروط : .........."],
  },
  { label: "التعليل", underline: true, items: [".........."] },
];

/** Lower half of the ملاحظات cell, matching the printed committee. */
export const ACCEPTANCE_NOTE_COMMITTEE: AcceptanceNoteSection = {
  label: "اللجنة",
  underline: true,
  items: [
    "رئيس اللجنة : الراند/ لطفي الصغيرة",
    "المكلف بمغازة التموين : ن أ/ ايمن بن عمر",
    "رئيس المطبخ : ن م / خالد بوضلعة",
    "ممثل الخفارة : ن أأ/ أنيس القيلوشي",
    "الطبيب البيطري (1) : ..........",
  ],
};

/** Blank rows keep the paper table the same height as the printed form. */
export const ACCEPTANCE_BODY_ROWS = 16;

export type AcceptanceLine = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export type AcceptanceDraft = {
  requestId: string;
  serial: string;
  dateKey: string;
  supplierId: string;
  supplierName: string;
  lines: AcceptanceLine[];
};

export type GoodsAcceptanceSheet = AcceptanceDraft & {
  id: string;
};

export type GoodsAcceptanceListItem = {
  id: string;
  requestId: string;
  serial: string;
  dateKey: string;
  supplierName: string;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Bare number, as on the paper. The column header already says الوزن بالكلغ. */
export function quantityLabel(line: Pick<AcceptanceLine, "quantity">): string {
  if (!line.quantity) return "";
  return String(line.quantity);
}

/** One acceptance sheet per supplier on the material request. */
export function buildAcceptances(input: {
  requestId: string;
  serial: string;
  dateKey: string;
  lines: RequestLine[];
}): AcceptanceDraft[] {
  const groups = new Map<string, AcceptanceDraft>();
  for (const line of input.lines) {
    const supplierId = line.supplierId?.trim() || "unknown";
    const supplierName = line.supplierName?.trim() || "غير محدد";
    const current = groups.get(supplierId) ?? {
      requestId: input.requestId,
      serial: input.serial,
      dateKey: input.dateKey,
      supplierId,
      supplierName,
      lines: [],
    };
    current.lines.push({
      id: line.id,
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
    });
    groups.set(supplierId, current);
  }
  return [...groups.values()];
}
