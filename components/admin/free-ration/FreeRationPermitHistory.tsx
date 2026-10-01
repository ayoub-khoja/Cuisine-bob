"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eye, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteFreeRationPermit,
  useFreeRationList,
  useFreeRationPermit,
} from "@/hooks/queries/use-free-ration-permit";
import type { PermitRecord } from "@/lib/free-ration/sheet";
import { downloadElementAsPdf } from "@/lib/pdf/snapshot-pdf";
import FreeRationPermitForm from "@/components/admin/free-ration/FreeRationPermitForm";
import FreeRationPermitDocument from "@/components/admin/free-ration/FreeRationPermitDocument";

const PAGE_SIZES = [10, 20, 50];

export default function FreeRationPermitHistory() {
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
  const [downloadJob, setDownloadJob] = useState<{ permit: PermitRecord; nonce: number } | null>(
    null,
  );
  const viewPaperRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const startedDownload = useRef(0);
  const list = useFreeRationList(page, pageSize, date);
  const detail = useFreeRationPermit(viewOpen ? viewId : undefined);
  const remove = useDeleteFreeRationPermit();

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
    const permit = downloadJob.permit;
    void (async () => {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        const node = captureRef.current;
        if (!node) throw new Error("تعذر تجهيز الورقة");
        await downloadElementAsPdf(node, `اذن-اعاشة-${permit.serial}.pdf`);
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

  const downloadPermit = async (id: string, source?: HTMLElement | null) => {
    setBusyId(id);
    try {
      if (source) {
        const serial = detail.data?.id === id ? detail.data.serial : id;
        await downloadElementAsPdf(source, `اذن-اعاشة-${serial}.pdf`);
        setBusyId(null);
        return;
      }
      const response = await fetch(`/api/free-ration-permit/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر فتح الإذن");
      const permit = (await response.json()) as PermitRecord;
      setDownloadJob({ permit, nonce: Date.now() });
    } catch (error) {
      setBusyId(null);
      toast({
        title: "تعذر تحميل PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const onDelete = async (id: string, serial: string) => {
    if (!window.confirm(`حذف الإذن عدد ${serial}؟`)) return;
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
          title="اذن باعاشة مجانية"
          description="سجل أذون الإعاشة المجانية، مع الرجوع إلى أي تاريخ."
          icon={Ticket}
          tone="sky"
        />
        <button
          type="button"
          onClick={() => openForm()}
          className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
        >
          <Plus className="h-4 w-4" />
          إضافة إذن
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!flex max-h-[90vh] w-[min(96vw,980px)] !max-w-[980px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950 dark:text-white [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-600 dark:[&>button.absolute]:text-white">
          <FreeRationPermitForm
            key={formKey}
            permitId={editId}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="!flex max-h-[92vh] w-[min(96vw,860px)] !max-w-[860px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-700">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white py-3 pl-14 pr-5">
            <h2 className="text-sm font-medium text-slate-800">إذن بإعاشة مجانية</h2>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                if (!detail.data) return;
                void downloadPermit(detail.data.id, viewPaperRef.current);
              }}
              className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-3 text-sm")}
            >
              <Download className="h-4 w-4" />
              {busyId && busyId === detail.data?.id ? "جاري التحميل…" : "تحميل PDF"}
            </button>
          </div>
          <div className="p-4">
            {detail.isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">جاري التحميل…</p>
            ) : detail.data ? (
              <div ref={viewPaperRef} className="mx-auto w-fit bg-white shadow-md">
                <FreeRationPermitDocument permit={detail.data} />
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-rose-600">تعذر فتح الإذن</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed top-0 -left-[1400px]" aria-hidden>
        {downloadJob ? (
          <div ref={captureRef}>
            <FreeRationPermitDocument permit={downloadJob.permit} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          التاريخ
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-white/15 dark:bg-slate-950"
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
        <span className="ms-auto text-xs text-slate-500">{total} إذن</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-sky-500/10 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">عدد</th>
                <th className="px-4 py-3 text-right font-medium">اليوم</th>
                <th className="px-4 py-3 text-right font-medium">الساعة</th>
                <th className="px-4 py-3 text-right font-medium">الأشخاص</th>
                <th className="px-4 py-3 text-right font-medium">الأسطر</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    لا توجد أذون في السجل.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3 font-medium text-rose-700">{item.serial}</td>
                    <td className="px-4 py-3">{item.dateKey}</td>
                    <td className="px-4 py-3">{item.time}</td>
                    <td className="px-4 py-3">{item.peopleTotal}</td>
                    <td className="px-4 py-3">{item.lineCount}</td>
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
                          onClick={() => void downloadPermit(item.id)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="حذف"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-500/10"
                          aria-label={`حذف ${item.serial}`}
                          onClick={() => onDelete(item.id, item.serial)}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm dark:border-white/10">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            في الصفحة
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 dark:border-white/15 dark:bg-slate-950"
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
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              السابق
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
