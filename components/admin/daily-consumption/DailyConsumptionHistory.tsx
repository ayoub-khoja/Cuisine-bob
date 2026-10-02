"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DailyConsumptionForm from "@/components/admin/daily-consumption/DailyConsumptionForm";
import DailyConsumptionDocument from "@/components/admin/daily-consumption/DailyConsumptionDocument";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDailyConsumption,
  useDailyConsumptionList,
  useDeleteDailyConsumption,
} from "@/hooks/queries/use-daily-consumption";
import type { DailySheetRecord } from "@/lib/daily-consumption/sheet";
import { downloadElementAsPdf } from "@/lib/pdf/snapshot-pdf";

const PAGE_SIZES = [10, 20, 50];
const PAPER_WIDTH = 1080;

function PaperViewport({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const apply = () => {
      const width = frame.clientWidth;
      setScale(width > 0 ? Math.min(1, width / PAPER_WIDTH) : 1);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="w-full">
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

export default function DailyConsumptionHistory() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editId, setEditId] = useState<string | undefined>();
  const [viewId, setViewId] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloadJob, setDownloadJob] = useState<{ sheet: DailySheetRecord; nonce: number } | null>(
    null,
  );
  const captureRef = useRef<HTMLDivElement>(null);
  const startedDownload = useRef(0);
  const list = useDailyConsumptionList(page, pageSize, date);
  const detail = useDailyConsumption(viewOpen ? viewId : undefined);
  const remove = useDeleteDailyConsumption();

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = list.data?.items ?? [];

  const openForm = (id?: string) => {
    setEditId(id);
    setFormKey((key) => key + 1);
    setOpen(true);
  };

  const openView = (id: string) => {
    setViewId(id);
    setViewOpen(true);
  };

  useEffect(() => {
    if (!downloadJob || startedDownload.current === downloadJob.nonce) return;
    startedDownload.current = downloadJob.nonce;
    const sheet = downloadJob.sheet;
    void (async () => {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        const node = captureRef.current;
        if (!node) throw new Error("تعذر تجهيز الورقة");
        await downloadElementAsPdf(node, `استهلاك-يومي-${sheet.dateKey}.pdf`, "landscape");
      } catch (error) {
        toast({
          title: "تعذر تحميل PDF",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    })();
  }, [downloadJob, toast]);

  const downloadSheet = async (id: string, source?: HTMLElement | null) => {
    setBusyId(id);
    try {
      if (source) {
        const dateKey = detail.data?.id === id ? detail.data.dateKey : id;
        await downloadElementAsPdf(source, `استهلاك-يومي-${dateKey}.pdf`, "landscape");
        setBusyId(null);
        return;
      }
      const response = await fetch(`/api/daily-consumption/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر فتح الورقة");
      const sheet = (await response.json()) as DailySheetRecord;
      setDownloadJob({ sheet, nonce: Date.now() });
    } catch (error) {
      setBusyId(null);
      toast({
        title: "تعذر تحميل PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

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
          onClick={() => openForm()}
          className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
        >
          <Plus className="h-4 w-4" />
          إضافة استهلاك يومي
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!flex max-h-[90vh] w-[min(96vw,1140px)] !max-w-[1140px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950 dark:text-white [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-600 dark:[&>button.absolute]:text-white">
          <DailyConsumptionForm
            key={formKey}
            sheetId={editId}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="!flex max-h-[92vh] w-[min(96vw,1180px)] !max-w-[1180px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-700">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white py-3 pl-14 pr-5">
            <h2 className="text-sm font-medium text-slate-800">ورقة الاستهلاك اليومي</h2>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                if (!detail.data) return;
                void downloadSheet(detail.data.id);
              }}
              className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-3 text-sm")}
            >
              <Download className="h-4 w-4" />
              {busyId && busyId === detail.data?.id ? "جاري التحميل…" : "تحميل PDF"}
            </button>
          </div>
          <div className="bg-slate-100 p-4">
            {detail.isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">جاري التحميل…</p>
            ) : detail.data ? (
              <PaperViewport>
                <div className="mx-auto w-fit bg-white shadow-md">
                  <DailyConsumptionDocument sheet={detail.data} />
                </div>
              </PaperViewport>
            ) : (
              <p className="py-16 text-center text-sm text-rose-600">تعذر فتح الورقة</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed top-0 -left-[1600px]" aria-hidden>
        {downloadJob ? (
          <div ref={captureRef}>
            <DailyConsumptionDocument sheet={downloadJob.sheet} />
          </div>
        ) : null}
      </div>

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
          <table className="w-full min-w-[720px] text-sm">
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="عرض"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
                          onClick={() => openView(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="تعديل"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                          onClick={() => openForm(item.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="تحميل PDF"
                          disabled={busyId === item.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40 dark:text-emerald-300"
                          onClick={() => void downloadSheet(item.id)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="حذف"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-500/10"
                          aria-label={`حذف ${item.dateKey}`}
                          onClick={() => onDelete(item.id, item.dateKey)}
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
