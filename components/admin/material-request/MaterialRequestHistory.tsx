"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardList, Download, Eye, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteMaterialRequest,
  useMaterialRequest,
  useMaterialRequestList,
} from "@/hooks/queries/use-material-request";
import type { RequestRecord } from "@/lib/material-request/sheet";
import { downloadElementAsPdf, printElement } from "@/lib/pdf/snapshot-pdf";
import MaterialRequestForm from "@/components/admin/material-request/MaterialRequestForm";
import MaterialRequestDocument from "@/components/admin/material-request/MaterialRequestDocument";

const PAGE_SIZES = [10, 20, 50];
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1040;

function FitPage({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const apply = () => {
      const width = frame.clientWidth;
      const height = Math.max(420, window.innerHeight * 0.7);
      const next = Math.min(width / PAGE_WIDTH, height / PAGE_HEIGHT);
      setScale(next > 0 && next < 1 ? next : 1);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(frame);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <div ref={frameRef} className="flex w-full justify-center">
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

export default function MaterialRequestHistory() {
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
  const [downloadJob, setDownloadJob] = useState<{
    request: RequestRecord;
    nonce: number;
    mode: "pdf" | "print";
  } | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const startedJob = useRef(0);
  const list = useMaterialRequestList(page, pageSize, date);
  const detail = useMaterialRequest(viewOpen ? viewId : undefined);
  const remove = useDeleteMaterialRequest();

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = list.data?.items ?? [];

  const openForm = (id?: string) => {
    setEditId(id);
    setFormKey((key) => key + 1);
    setOpen(true);
  };

  useEffect(() => {
    if (!downloadJob || startedJob.current === downloadJob.nonce) return;
    startedJob.current = downloadJob.nonce;
    const job = downloadJob;
    void (async () => {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        const node = captureRef.current;
        if (!node) throw new Error("تعذر تجهيز الورقة");
        const filename = `طلب-مواد-${job.request.serial}.pdf`;
        if (job.mode === "print") await printElement(node);
        else await downloadElementAsPdf(node, filename);
      } catch (error) {
        toast({
          title: job.mode === "print" ? "تعذر الطباعة" : "تعذر تحميل PDF",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    })();
  }, [downloadJob, toast]);

  const runOutput = async (id: string, mode: "pdf" | "print", source?: HTMLElement | null) => {
    setBusyId(id);
    try {
      if (source) {
        const serial = detail.data?.id === id ? detail.data.serial : id;
        if (mode === "print") await printElement(source);
        else await downloadElementAsPdf(source, `طلب-مواد-${serial}.pdf`);
        setBusyId(null);
        return;
      }
      const response = await fetch(`/api/material-request/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر فتح الطلب");
      const request = (await response.json()) as RequestRecord;
      setDownloadJob({ request, nonce: Date.now(), mode });
    } catch (error) {
      setBusyId(null);
      toast({
        title: mode === "print" ? "تعذر الطباعة" : "تعذر تحميل PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const onDelete = async (id: string, serial: string) => {
    if (!window.confirm(`حذف الطلب رقم ${serial}؟`)) return;
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
          title="طلب مواد"
          description="سجل طلبات المواد، مع الرجوع إلى أي رقم أو تاريخ."
          icon={ClipboardList}
          tone="sky"
          className="text-right [&_h2]:text-right [&_p]:text-right"
        />
        <button
          type="button"
          onClick={() => openForm()}
          className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
        >
          <Plus className="h-4 w-4" />
          إضافة طلب
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!flex max-h-[90vh] w-[min(96vw,860px)] !max-w-[860px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950 dark:text-white [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-600 dark:[&>button.absolute]:text-white">
          <MaterialRequestForm
            key={formKey}
            requestId={editId}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="!flex max-h-[92vh] w-[min(96vw,860px)] !max-w-[860px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-700">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white py-3 pl-14 pr-5">
            <h2 className="text-sm font-medium text-slate-800">طلب مواد</h2>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                if (!detail.data) return;
                void runOutput(detail.data.id, "pdf");
              }}
              className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-3 text-sm")}
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                if (!detail.data) return;
                void runOutput(detail.data.id, "print");
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </button>
          </div>
          <div className="p-4">
            {detail.isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">جاري التحميل…</p>
            ) : detail.data ? (
              <FitPage>
                <div className="bg-white shadow-md">
                  <MaterialRequestDocument request={detail.data} />
                </div>
              </FitPage>
            ) : (
              <p className="py-16 text-center text-sm text-rose-600">تعذر فتح الطلب</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed top-0 -left-[1200px]" aria-hidden>
        {downloadJob ? (
          <div ref={captureRef}>
            <MaterialRequestDocument request={downloadJob.request} />
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
        <span className="ms-auto text-xs text-slate-500">{total} طلب</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-sky-500/10 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">رقم</th>
                <th className="px-4 py-3 text-right font-medium">اليوم</th>
                <th className="px-4 py-3 text-right font-medium">الأسطر</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.isPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    لا توجد طلبات في السجل.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3 font-medium">{item.serial}</td>
                    <td className="px-4 py-3">{item.dateKey}</td>
                    <td className="px-4 py-3">{item.lineCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="عرض"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-500/10"
                          onClick={() => {
                            setViewId(item.id);
                            setViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="تعديل"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                          onClick={() => openForm(item.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="تحميل PDF"
                          disabled={busyId === item.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40"
                          onClick={() => void runOutput(item.id, "pdf")}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="طباعة"
                          disabled={busyId === item.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-800 hover:bg-sky-500/10 disabled:opacity-40"
                          onClick={() => void runOutput(item.id, "print")}
                        >
                          <Printer className="h-4 w-4" />
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
