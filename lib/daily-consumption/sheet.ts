/** Daily consumption sheet (الاستهلاك اليومي) — fields match the paper form. */

export const MEAL_COLUMNS = [
  { key: "awda", label: "عودة" },
  { key: "laylia", label: "لمجة ليلية" },
  { key: "lamjaAsha", label: "لمجة عشاء" },
  { key: "lamjaGhada", label: "لمجة غداء" },
  { key: "asha", label: "عشاء" },
  { key: "ghada", label: "غداء" },
  { key: "futur", label: "فطور" },
] as const;

export type MealKey = (typeof MEAL_COLUMNS)[number]["key"];

export const HEADCOUNT_UNITS = [
  "وحدات التدخل",
  "الضباط",
  "الأمن العمومي",
  "الحرس الوطني",
  "أعوان الدراسة",
] as const;

export const MEASURE_UNITS = ["كغ", "غ", "ل", "ملل", "حبة", "علبة", "ربطة", "كيس"] as const;

export type QtyMap = Partial<Record<MealKey, number>>;

export type HeadcountRow = {
  unit: string;
  paid: QtyMap;
  free: QtyMap;
};

export type ConsumptionLine = {
  id: string;
  name: string;
  unit: string;
  qty: QtyMap;
};

export type DayMenu = Partial<Record<MealKey, string[]>>;

export type DailySheetInput = {
  dateKey: string;
  headcounts: HeadcountRow[];
  lines: ConsumptionLine[];
  menu: DayMenu;
};

export type DailySheetRecord = DailySheetInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type DailySheetListItem = {
  id: string;
  dateKey: string;
  paidTotal: number;
  freeTotal: number;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
};

type CatalogItem = { name: string; unit: string };

export const MATERIAL_CATALOG: { group: string; items: CatalogItem[] }[] = [
  {
    group: "لحوم وأسماك",
    items: [
      { name: "لحم بقري", unit: "كغ" },
      { name: "لحم غنمي", unit: "كغ" },
      { name: "دجاج", unit: "كغ" },
      { name: "اسكالوب", unit: "كغ" },
      { name: "سمك", unit: "كغ" },
      { name: "ستاك", unit: "كغ" },
    ],
  },
  {
    group: "خضر وغلال",
    items: [
      { name: "بطاطا", unit: "كغ" },
      { name: "طماطم خضراء", unit: "كغ" },
      { name: "فلفل أخضر", unit: "كغ" },
      { name: "بصل", unit: "كغ" },
      { name: "ثوم", unit: "كغ" },
      { name: "خس", unit: "كغ" },
      { name: "خيار", unit: "كغ" },
      { name: "معدنوس", unit: "ربطة" },
      { name: "كرافس", unit: "ربطة" },
      { name: "نعناع", unit: "ربطة" },
      { name: "سلطة خضراء", unit: "كغ" },
      { name: "تفاح", unit: "كغ" },
      { name: "ليمون", unit: "كغ" },
    ],
  },
  {
    group: "حبوب ومخبوزات",
    items: [
      { name: "كسكسي", unit: "كغ" },
      { name: "أرز", unit: "كغ" },
      { name: "خبز", unit: "كغ" },
      { name: "مفورة بالخضرة", unit: "كغ" },
      { name: "طمسن", unit: "كغ" },
    ],
  },
  {
    group: "توابل ومعلبات",
    items: [
      { name: "ملح", unit: "كغ" },
      { name: "فلفل أحمر", unit: "كغ" },
      { name: "كمون", unit: "كغ" },
      { name: "معجون", unit: "كغ" },
      { name: "زيت نباتي", unit: "ل" },
      { name: "ياغورت", unit: "علبة" },
    ],
  },
  {
    group: "مشروبات وأخرى",
    items: [
      { name: "ماء 1.5 ل", unit: "حبة" },
      { name: "عصير", unit: "ل" },
      { name: "كيك", unit: "حبة" },
      { name: "بلاطو", unit: "حبة" },
      { name: "رشة", unit: "كغ" },
      { name: "بيض", unit: "حبة" },
    ],
  },
];

export const DISH_CATALOG = [
  "كسكسي",
  "سمك",
  "سلطة خضراء",
  "طمسن",
  "ماء 1.5 ل",
  "مفورة بالخضرة",
  "ستاك",
  "تفاح",
  "بلاطو",
  "رشة",
  "كيك",
  "عصير",
  "خبز",
];

const MEAL_KEYS = new Set<string>(MEAL_COLUMNS.map((meal) => meal.key));

export function todayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptyHeadcounts(): HeadcountRow[] {
  return HEADCOUNT_UNITS.map((unit) => ({ unit, paid: {}, free: {} }));
}

export function emptySheet(dateKey = todayDateKey()): DailySheetInput {
  return {
    dateKey,
    headcounts: emptyHeadcounts(),
    lines: [],
    menu: {},
  };
}

function isMealKey(value: string): value is MealKey {
  return MEAL_KEYS.has(value);
}

function readQtyMap(value: unknown, integerOnly: boolean): QtyMap | null {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const qty: QtyMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!isMealKey(key) || raw == null || raw === "") continue;
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num) || num < 0 || num > 100000) return null;
    if (integerOnly && !Number.isInteger(num)) return null;
    qty[key] = num;
  }
  return qty;
}

export function sumQty(map: QtyMap | undefined): number {
  if (!map) return 0;
  return MEAL_COLUMNS.reduce((total, meal) => total + (map[meal.key] ?? 0), 0);
}

export function sheetTotals(headcounts: HeadcountRow[]): {
  paid: number;
  free: number;
} {
  return headcounts.reduce(
    (totals, row) => ({
      paid: totals.paid + sumQty(row.paid),
      free: totals.free + sumQty(row.free),
    }),
    { paid: 0, free: 0 },
  );
}

export function parseDailySheet(body: unknown): DailySheetInput | string {
  if (!body || typeof body !== "object") return "بيانات غير صالحة";
  const raw = body as Record<string, unknown>;
  const dateKey = typeof raw.dateKey === "string" ? raw.dateKey.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "التاريخ غير صالح";

  if (!Array.isArray(raw.headcounts)) return "جدول الآكلات غير صالح";
  const headcounts: HeadcountRow[] = [];
  for (const unit of HEADCOUNT_UNITS) {
    const row = raw.headcounts.find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry as { unit?: unknown }).unit === unit,
    ) as { paid?: unknown; free?: unknown } | undefined;
    const paid = readQtyMap(row?.paid, true);
    const free = readQtyMap(row?.free, true);
    if (!paid || !free) return "أعداد الآكلات غير صالحة";
    headcounts.push({ unit, paid, free });
  }

  if (!Array.isArray(raw.lines)) return "قائمة المواد غير صالحة";
  if (raw.lines.length > 200) return "عدد المواد كبير جداً";
  const lines: ConsumptionLine[] = [];
  const seen = new Set<string>();
  for (const entry of raw.lines) {
    if (!entry || typeof entry !== "object") return "مادة غير صالحة";
    const line = entry as Record<string, unknown>;
    const name = typeof line.name === "string" ? line.name.trim() : "";
    const unit = typeof line.unit === "string" ? line.unit.trim() : "";
    const id = typeof line.id === "string" ? line.id.trim() : "";
    if (!name || name.length > 80 || !unit || unit.length > 20 || !id) {
      return "اسم المادة أو الوحدة غير صالح";
    }
    const key = name.toLocaleLowerCase("ar");
    if (seen.has(key)) return `المادة «${name}» مكررة`;
    seen.add(key);
    const qty = readQtyMap(line.qty, false);
    if (!qty) return "الكميات غير صالحة";
    lines.push({ id, name, unit, qty });
  }

  const menu: DayMenu = {};
  if (raw.menu != null) {
    if (typeof raw.menu !== "object" || Array.isArray(raw.menu)) {
      return "قائمة الأكلة غير صالحة";
    }
    for (const [key, dishes] of Object.entries(
      raw.menu as Record<string, unknown>,
    )) {
      if (!isMealKey(key)) continue;
      if (!Array.isArray(dishes)) return "أطباق غير صالحة";
      const clean = dishes
        .filter((dish): dish is string => typeof dish === "string")
        .map((dish) => dish.trim())
        .filter(Boolean)
        .slice(0, 40);
      if (clean.some((dish) => dish.length > 80)) return "اسم طبق طويل جداً";
      if (clean.length > 0) menu[key] = clean;
    }
  }

  return { dateKey, headcounts, lines, menu };
}
