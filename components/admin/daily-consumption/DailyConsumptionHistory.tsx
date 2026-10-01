"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DailyConsumptionForm from "@/components/admin/daily-consumption/DailyConsumptionForm";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDailyConsumptionList,
  useDeleteDailyConsumption,
} from "@/hooks/queries/use-daily-consumption";

const PAGE_SIZES = [10, 20, 50];

export default function DailyConsumptionHistory() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [date, setDate] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const list = useDailyConsumptionList(page, pageSize, date);
  const remove = useDeleteDailyConsumption();

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = list.data?.items ?? [];

  const onDelete = async (id: string, dateKey: string) => {
    if (!window.confirm(`حذف استهلاك يوم ${dateKey}؟`)) return;
    try {
      await remove.mutateAsync({ id });
      toast({ title: "تم الحذف" });
    } catch (error) {
      toast({
        title: "تعذر الحذف",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div dir="rtl" lang="ar" className="flex flex-col gap-4 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageSectionHeader
          title="الاستهلاك اليومي"
          description="سجل الأوراق اليومية للمواد الغذائية، مع إمكانية الرجوع إلى أي تاريخ."
          icon={CalendarDays}
          tone="sky"
        />
        <button
          type="button"
          onClick={() => {
            setAddKey((key) => key + 1);
            setAddOpen(true);
          }}
          className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
        >
          <Plus className="h-4 w-4" />
          إضافة استهلاك يومي
        </button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="!flex max-h-[90vh] w-[min(96vw,1140px)] !max-w-[1140px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950 dark:text-white [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-600 dark:[&>button.absolute]:text-white">
          <DailyConsumptionForm
            key={addKey}
            onSaved={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          التاريخ
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-white/15 dark:bg-gray-950"
          />
        </label>
        {date ? (
          <button
            type="button"
            className="text-sm text-sky-700 dark:text-sky-300"
            onClick={() => {
              setDate("");
              setPage(1);
            }}
          >
            عرض كل السجل
          </button>
        ) : null}
        <span className="ms-auto text-xs text-gray-500">{total} ورقة</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-gray-950/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sky-500/10 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">اليوم</th>
                <th className="px-4 py-3 text-right font-medium">بمقابل</th>
                <th className="px-4 py-3 text-right font-medium">مجاناً</th>
                <th className="px-4 py-3 text-right font-medium">المواد</th>
                <th className="px-4 py-3 text-right font-medium">آخر تحديث</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    لا توجد أوراق في السجل. أضف أول استهلاك يومي.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 dark:border-white/10"
                  >
                    <td className="px-4 py-3 font-medium">{item.dateKey}</td>
                    <td className="px-4 py-3">{item.paidTotal}</td>
                    <td className="px-4 py-3">{item.freeTotal}</td>
                    <td className="px-4 py-3">{item.lineCount}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(item.updatedAt).toLocaleString("ar-TN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/daily-consumption/${item.id}`}
                          className="text-sky-700 hover:underline dark:text-sky-300"
                        >
                          فتح
                        </Link>
                        <button
                          type="button"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => onDelete(item.id, item.dateKey)}
                          aria-label={`حذف ${item.dateKey}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm dark:border-white/10">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            في الصفحة
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 dark:border-white/15 dark:bg-gray-950"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              السابق
            </button>
            <span className="text-gray-600 dark:text-gray-300">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
