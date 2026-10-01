"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useFreeRationPermit,
  useSaveFreeRationPermit,
} from "@/hooks/queries/use-free-ration-permit";
import {
  MEAL_SUGGESTIONS,
  emptyLine,
  emptyPermit,
  peopleTotal,
  type PermitInput,
  type PermitLine,
} from "@/lib/free-ration/sheet";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-950";

export default function FreeRationPermitForm({
  permitId,
  onSaved,
  onCancel,
}: {
  permitId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const existing = useFreeRationPermit(permitId);
  const savePermit = useSaveFreeRationPermit();
  const [draft, setDraft] = useState<PermitInput>(emptyPermit);

  useEffect(() => {
    if (!existing.data) return;
    setDraft({
      serial: existing.data.serial,
      dateKey: existing.data.dateKey,
      time: existing.data.time,
      lines: existing.data.lines,
    });
  }, [existing.data]);

  const updateLine = (id: string, patch: Partial<PermitLine>) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  };

  const save = async () => {
    try {
      await savePermit.mutateAsync({ id: permitId, permit: draft });
      toast({ title: "تم حفظ إذن الإعاشة" });
      onSaved?.();
    } catch (error) {
      toast({
        title: "تعذر الحفظ",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div dir="rtl" lang="ar" className="bg-white dark:bg-slate-950">
      <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200/80 bg-white/95 px-5 py-4 pe-14 shadow-sm backdrop-blur-md sm:flex-row sm:items-end sm:justify-between dark:border-white/10 dark:bg-slate-950/95">
        <PageSectionHeader
          title={permitId ? "تعديل إذن بإعاشة مجانية" : "إذن بإعاشة مجانية"}
          description="نفس خانات الورقة: العدد، اليوم، الساعة، وأسطر التابعين."
          icon={Plus}
          tone="sky"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm dark:border-white/15"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={save}
            disabled={savePermit.isPending}
            className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
          >
            <Save className="h-4 w-4" />
            {savePermit.isPending ? "جاري الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_140px)] p-5 dark:bg-none">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <div className="mb-4 text-center">
            <p className="text-xs text-slate-500">قسم المطعم</p>
            <h2 className="mt-1 text-lg font-semibold text-sky-800 dark:text-sky-200">
              إذن بإعاشة مجانية
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-slate-600 dark:text-slate-300">
              عدد
              <input
                value={draft.serial}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, serial: event.target.value }))
                }
                className={cn(fieldClass, "mt-1 text-rose-700")}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              ليوم
              <input
                type="date"
                value={draft.dateKey}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateKey: event.target.value }))
                }
                className={cn(fieldClass, "mt-1")}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              الساعة
              <input
                type="time"
                value={draft.time}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, time: event.target.value }))
                }
                className={cn(fieldClass, "mt-1")}
              />
            </label>
          </div>
          <p className="mt-4 text-center text-sm text-slate-700 dark:text-slate-200">
            يأذن آمر الفوج الجهوي لحفظ النظام بالمنستير بإعاشة
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-medium">الأسطر</h3>
            <span className="text-xs text-slate-500">المجموع: {peopleTotal(draft.lines)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-sky-500/10 text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-right font-medium">عدد</th>
                  <th className="px-3 py-2 text-right font-medium">تابعين</th>
                  <th className="px-3 py-2 text-right font-medium">بوجبة</th>
                  <th className="px-3 py-2 text-right font-medium">المهمة</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-2 py-2">
                      <input
                        inputMode="numeric"
                        value={line.count ? String(line.count) : ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw !== "" && !/^\d{0,4}$/.test(raw)) return;
                          updateLine(line.id, { count: raw === "" ? 0 : Number(raw) });
                        }}
                        className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-center dark:border-white/15 dark:bg-slate-950"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={line.followers}
                        onChange={(event) => updateLine(line.id, { followers: event.target.value })}
                        className={fieldClass}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        list="meal-suggestions"
                        value={line.meal}
                        onChange={(event) => updateLine(line.id, { meal: event.target.value })}
                        className={fieldClass}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={line.mission}
                        onChange={(event) => updateLine(line.id, { mission: event.target.value })}
                        className={fieldClass}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        aria-label="حذف السطر"
                        className="text-rose-600"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            lines:
                              current.lines.length === 1
                                ? current.lines
                                : current.lines.filter((item) => item.id !== line.id),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-sky-500/10 font-medium dark:border-white/10">
                  <td className="px-3 py-2 text-center">{peopleTotal(draft.lines)}</td>
                  <td className="px-3 py-2" colSpan={4}>
                    المجموع
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <datalist id="meal-suggestions">
            {MEAL_SUGGESTIONS.map((meal) => (
              <option key={meal} value={meal} />
            ))}
          </datalist>
          <div className="border-t border-slate-100 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-sky-700 dark:text-sky-300"
              onClick={() =>
                setDraft((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))
              }
            >
              <Plus className="h-4 w-4" />
              إضافة سطر
            </button>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:grid-cols-3 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          <p>تأشيرة مقتصد المطعم</p>
          <p>النقيب / البشير عمامة</p>
          <p>آمر الفوج الجهوي لحفظ النظام بالمنستير</p>
        </section>
      </div>
    </div>
  );
}
