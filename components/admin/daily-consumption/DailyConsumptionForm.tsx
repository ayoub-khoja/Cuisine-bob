"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateDailyConsumption,
  useDailyConsumption,
  useUpdateDailyConsumption,
} from "@/hooks/queries/use-daily-consumption";
import {
  DISH_CATALOG,
  MATERIAL_CATALOG,
  MEAL_COLUMNS,
  MEASURE_UNITS,
  emptySheet,
  sheetTotals,
  type ConsumptionLine,
  type DailySheetInput,
  type DayMenu,
  type HeadcountRow,
  type MealKey,
  type QtyMap,
} from "@/lib/daily-consumption/sheet";

type DraftQty = Partial<Record<MealKey, string>>;

type Draft = {
  dateKey: string;
  headcounts: { unit: string; paid: DraftQty; free: DraftQty }[];
  lines: { id: string; name: string; unit: string; qty: DraftQty }[];
  menu: DayMenu;
};

const cellInput =
  "h-8 w-14 rounded-md border border-gray-200 bg-white px-1 text-center text-xs dark:border-white/15 dark:bg-gray-950";

function toDraftQty(qty: QtyMap | undefined): DraftQty {
  const draft: DraftQty = {};
  for (const meal of MEAL_COLUMNS) {
    const value = qty?.[meal.key];
    if (value != null) draft[meal.key] = String(value);
  }
  return draft;
}

function sheetToDraft(sheet: DailySheetInput): Draft {
  return {
    dateKey: sheet.dateKey,
    headcounts: sheet.headcounts.map((row) => ({
      unit: row.unit,
      paid: toDraftQty(row.paid),
      free: toDraftQty(row.free),
    })),
    lines: sheet.lines.map((line) => ({
      ...line,
      qty: toDraftQty(line.qty),
    })),
    menu: sheet.menu,
  };
}

function freezeQty(qty: DraftQty): QtyMap | null {
  const next: QtyMap = {};
  for (const meal of MEAL_COLUMNS) {
    const raw = qty[meal.key];
    if (raw == null || raw === "") continue;
    if (!/^\d+(\.\d+)?$/.test(raw)) return null;
    next[meal.key] = Number(raw);
  }
  return next;
}

function draftToSheet(draft: Draft): DailySheetInput | string {
  const headcounts: HeadcountRow[] = [];
  for (const row of draft.headcounts) {
    const paid = freezeQty(row.paid);
    const free = freezeQty(row.free);
    if (!paid || !free) return "أعداد الآكلات يجب أن تكون أرقاماً صحيحة";
    if (Object.values(paid).some((n) => !Number.isInteger(n))) {
      return "عدد الآكلات يجب أن يكون بدون فاصلة";
    }
    if (Object.values(free).some((n) => !Number.isInteger(n))) {
      return "عدد الآكلات يجب أن يكون بدون فاصلة";
    }
    headcounts.push({ unit: row.unit, paid, free });
  }
  const lines: ConsumptionLine[] = [];
  for (const line of draft.lines) {
    const qty = freezeQty(line.qty);
    if (!qty) return `كمية غير صالحة في «${line.name}»`;
    lines.push({ id: line.id, name: line.name, unit: line.unit, qty });
  }
  return {
    dateKey: draft.dateKey,
    headcounts,
    lines,
    menu: draft.menu,
  };
}

function writeQty(qty: DraftQty, meal: MealKey, raw: string, decimal: boolean): DraftQty | null {
  const value = raw.replace(",", ".");
  const pattern = decimal ? /^\d{0,6}(\.\d{0,2})?$/ : /^\d{0,5}$/;
  if (!pattern.test(value)) return null;
  const next = { ...qty };
  if (value === "") delete next[meal];
  else next[meal] = value;
  return next;
}

export default function DailyConsumptionForm({
  sheetId,
  onSaved,
  onCancel,
}: {
  sheetId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const existing = useDailyConsumption(sheetId);
  const createSheet = useCreateDailyConsumption();
  const updateSheet = useUpdateDailyConsumption();
  const [draft, setDraft] = useState<Draft>(() => sheetToDraft(emptySheet()));
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState<string>(MEASURE_UNITS[0]);
  const [activeMeal, setActiveMeal] = useState<MealKey>("ghada");
  const [customDish, setCustomDish] = useState("");

  useEffect(() => {
    if (!existing.data) return;
    setDraft(
      sheetToDraft({
        dateKey: existing.data.dateKey,
        headcounts: existing.data.headcounts,
        lines: existing.data.lines,
        menu: existing.data.menu ?? {},
      }),
    );
  }, [existing.data]);

  const totals = useMemo(() => {
    const frozen = draftToSheet(draft);
    if (typeof frozen === "string") return { paid: 0, free: 0 };
    return sheetTotals(frozen.headcounts);
  }, [draft]);

  const selectedNames = useMemo(
    () => new Set(draft.lines.map((line) => line.name)),
    [draft.lines],
  );

  const filteredCatalog = useMemo(() => {
    const q = query.trim();
    if (!q) return MATERIAL_CATALOG;
    return MATERIAL_CATALOG.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.name.includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const toggleMaterial = (name: string, unit: string, checked: boolean) => {
    setDraft((current) => {
      if (!checked) {
        return { ...current, lines: current.lines.filter((line) => line.name !== name) };
      }
      if (current.lines.some((line) => line.name === name)) return current;
      return {
        ...current,
        lines: [
          ...current.lines,
          { id: crypto.randomUUID(), name, unit, qty: {} },
        ],
      };
    });
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    if (selectedNames.has(name)) {
      toast({ title: "هذه المادة مضافة مسبقاً", variant: "destructive" });
      return;
    }
    toggleMaterial(name, customUnit, true);
    setCustomName("");
  };

  const save = async () => {
    const sheet = draftToSheet(draft);
    if (typeof sheet === "string") {
      toast({ title: sheet, variant: "destructive" });
      return;
    }
    if (!draft.dateKey) {
      toast({ title: "اختر التاريخ", variant: "destructive" });
      return;
    }
    try {
      if (sheetId) {
        await updateSheet.mutateAsync({ id: sheetId, sheet });
      } else {
        await createSheet.mutateAsync({ sheet });
      }
      toast({ title: "تم حفظ الاستهلاك اليومي" });
      if (onSaved) onSaved();
      else router.push("/admin/daily-consumption");
    } catch (error) {
      toast({
        title: "تعذر الحفظ",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const pending = createSheet.isPending || updateSheet.isPending;
  const dishes = draft.menu[activeMeal] ?? [];
  const inDialog = Boolean(onCancel);

  return (
    <div
      dir="rtl"
      lang="ar"
      className={cn("flex flex-col", inDialog ? "bg-white dark:bg-slate-950" : "gap-4 p-3 sm:p-4")}
    >
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
          inDialog &&
            "sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-5 py-4 pe-14 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/95",
        )}
      >
        <PageSectionHeader
          title={sheetId ? "تعديل الاستهلاك اليومي" : "استهلاك يومي جديد"}
          description="نفس خانات الورقة: عدد الآكلات، المواد التي تختارها، وقائمة الأكلة."
          icon={Plus}
          tone="sky"
        />
        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-4 text-sm dark:border-white/15"
            >
              إلغاء
            </button>
          ) : (
            <Link
              href="/admin/daily-consumption"
              className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-4 text-sm dark:border-white/15"
            >
              السجل
            </Link>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || existing.isLoading}
            className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
          >
            <Save className="h-4 w-4" />
            {pending ? "جاري الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-4",
          inDialog && "gap-5 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_120px)] p-5 dark:bg-none",
        )}
      >
      <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-gray-950/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">ليوم</h2>
          <input
            type="date"
            value={draft.dateKey}
            onChange={(event) =>
              setDraft((current) => ({ ...current, dateKey: event.target.value }))
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-white/15 dark:bg-gray-950"
          />
        </div>
        <p className="mb-3 text-xs text-gray-500">
          المجموع: بمقابل {totals.paid} · مجاناً {totals.free}
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
          <table className="w-full min-w-[920px] border-collapse text-xs">
            <thead>
              <tr className="bg-sky-500/10">
                <th rowSpan={2} className="border border-gray-200 px-2 py-2 dark:border-white/10">
                  الوحدة
                </th>
                <th colSpan={MEAL_COLUMNS.length} className="border border-gray-200 px-2 py-2 dark:border-white/10">
                  عدد الآكلات بمقابل
                </th>
                <th colSpan={MEAL_COLUMNS.length} className="border border-gray-200 px-2 py-2 dark:border-white/10">
                  عدد الآكلات مجاناً
                </th>
              </tr>
              <tr className="bg-sky-500/5">
                {MEAL_COLUMNS.map((meal) => (
                  <th key={`paid-${meal.key}`} className="border border-gray-200 px-1 py-1 font-normal dark:border-white/10">
                    {meal.label}
                  </th>
                ))}
                {MEAL_COLUMNS.map((meal) => (
                  <th key={`free-${meal.key}`} className="border border-gray-200 px-1 py-1 font-normal dark:border-white/10">
                    {meal.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.headcounts.map((row) => (
                <tr key={row.unit}>
                  <td className="border border-gray-200 px-2 py-1 font-medium dark:border-white/10">
                    {row.unit}
                  </td>
                  {(["paid", "free"] as const).map((side) =>
                    MEAL_COLUMNS.map((meal) => (
                      <td key={`${row.unit}-${side}-${meal.key}`} className="border border-gray-200 p-1 dark:border-white/10">
                        <input
                          inputMode="numeric"
                          value={row[side][meal.key] ?? ""}
                          aria-label={`${row.unit} ${side === "paid" ? "بمقابل" : "مجاناً"} ${meal.label}`}
                          onChange={(event) => {
                            const next = writeQty(row[side], meal.key, event.target.value, false);
                            if (!next) return;
                            setDraft((current) => ({
                              ...current,
                              headcounts: current.headcounts.map((item) =>
                                item.unit === row.unit ? { ...item, [side]: next } : item,
                              ),
                            }));
                          }}
                          className={cellInput}
                        />
                      </td>
                    )),
                  )}
                </tr>
              ))}
              <tr className="bg-sky-500/10 font-medium">
                <td className="border border-gray-200 px-2 py-2 dark:border-white/10">
                  المجموع
                </td>
                {(["paid", "free"] as const).map((side) =>
                  MEAL_COLUMNS.map((meal) => {
                    const total = draft.headcounts.reduce((sum, row) => {
                      const raw = row[side][meal.key];
                      if (!raw || !/^\d+$/.test(raw)) return sum;
                      return sum + Number(raw);
                    }, 0);
                    return (
                      <td
                        key={`total-${side}-${meal.key}`}
                        className="border border-gray-200 px-1 py-2 text-center dark:border-white/10"
                      >
                        {total}
                      </td>
                    );
                  }),
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <h2 className="mb-2 text-sm font-medium">اختيار المواد</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث عن مادة"
            className="mb-3 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-gray-950"
          />
          <div className="space-y-3 pe-1">
            {filteredCatalog.map((group) => (
              <div key={group.group}>
                <p className="mb-1 text-xs text-gray-500">{group.group}</p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const checked = selectedNames.has(item.name);
                    return (
                      <li key={item.name}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-sky-500/10">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleMaterial(item.name, item.unit, value === true)
                            }
                          />
                          <span className="text-sm">{item.name}</span>
                          <span className="ms-auto text-xs text-gray-400">{item.unit}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="مادة أخرى"
              className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-sm dark:border-white/15 dark:bg-gray-950"
            />
            <select
              value={customUnit}
              onChange={(event) => setCustomUnit(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-1 text-sm dark:border-white/15 dark:bg-gray-950"
            >
              {MEASURE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <button type="button" onClick={addCustom} className="rounded-lg bg-sky-600 px-2 text-white" aria-label="إضافة مادة">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-medium">الكميات حسب الأكلة</h2>
            <span className="text-xs text-gray-500">{draft.lines.length} مادة</span>
          </div>
          {draft.lines.length === 0 ? (
            <div className="mx-4 mb-4 rounded-xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-6 text-center text-sm text-slate-500 dark:border-sky-400/20 dark:bg-sky-500/5">
              اختر المواد من القائمة. تظهر هنا فقط المواد التي تحددها.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-xs">
                <thead className="bg-sky-500/10">
                  <tr>
                    <th className="px-2 py-2 text-right font-medium">المواد</th>
                    <th className="px-2 py-2 font-medium">الوحدة</th>
                    {MEAL_COLUMNS.map((meal) => (
                      <th key={meal.key} className="px-1 py-2 font-normal">
                        {meal.label}
                      </th>
                    ))}
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {draft.lines.map((line) => (
                    <tr key={line.id} className="border-t border-gray-100 dark:border-white/10">
                      <td className="px-2 py-1 font-medium">{line.name}</td>
                      <td className="px-2 py-1">
                        <select
                          value={line.unit}
                          onChange={(event) => {
                            const unit = event.target.value;
                            setDraft((current) => ({
                              ...current,
                              lines: current.lines.map((item) =>
                                item.id === line.id ? { ...item, unit } : item,
                              ),
                            }));
                          }}
                          className="h-8 rounded-md border border-gray-200 bg-white px-1 dark:border-white/15 dark:bg-gray-950"
                        >
                          {MEASURE_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </td>
                      {MEAL_COLUMNS.map((meal) => (
                        <td key={meal.key} className="px-1 py-1">
                          <input
                            inputMode="decimal"
                            value={line.qty[meal.key] ?? ""}
                            aria-label={`${line.name} ${meal.label}`}
                            onChange={(event) => {
                              const next = writeQty(line.qty, meal.key, event.target.value, true);
                              if (!next) return;
                              setDraft((current) => ({
                                ...current,
                                lines: current.lines.map((item) =>
                                  item.id === line.id ? { ...item, qty: next } : item,
                                ),
                              }));
                            }}
                            className={cellInput}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          aria-label={`حذف ${line.name}`}
                          onClick={() => toggleMaterial(line.name, line.unit, false)}
                          className="text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-4 dark:border-white/10 dark:bg-gray-950/40">
        <h2 className="mb-3 text-sm font-medium">قائمة الأكلة</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {MEAL_COLUMNS.map((meal) => (
            <button
              key={meal.key}
              type="button"
              onClick={() => setActiveMeal(meal.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                activeMeal === meal.key
                  ? "border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-200"
                  : "border-gray-200 dark:border-white/15",
              )}
            >
              {meal.label}
              <span className="ms-1 text-gray-400">{draft.menu[meal.key]?.length ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DISH_CATALOG.map((dish) => {
            const checked = dishes.includes(dish);
            return (
              <label key={dish} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-sky-500/10">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    setDraft((current) => {
                      const currentDishes = current.menu[activeMeal] ?? [];
                      const nextDishes =
                        value === true
                          ? [...currentDishes, dish]
                          : currentDishes.filter((item) => item !== dish);
                      return {
                        ...current,
                        menu: { ...current.menu, [activeMeal]: nextDishes },
                      };
                    });
                  }}
                />
                <span className="text-sm">{dish}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={customDish}
            onChange={(event) => setCustomDish(event.target.value)}
            placeholder="طبق آخر لهذه الأكلة"
            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-sm dark:border-white/15 dark:bg-gray-950"
          />
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 text-sm dark:border-white/15"
            onClick={() => {
              const name = customDish.trim();
              if (!name || dishes.includes(name)) return;
              setDraft((current) => ({
                ...current,
                menu: { ...current.menu, [activeMeal]: [...dishes, name] },
              }));
              setCustomDish("");
            }}
          >
            إضافة
          </button>
        </div>
        {dishes.length > 0 ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{dishes.join(" · ")}</p>
        ) : null}
      </section>
      </div>
    </div>
  );
}
