"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardCheck, Download, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useGoodsAcceptance,
  useGoodsAcceptanceList,
} from "@/hooks/queries/use-goods-acceptance";
import type { GoodsAcceptanceSheet } from "@/lib/goods-acceptance/sheet";
import { downloadElementAsPdf, printElement } from "@/lib/pdf/snapshot-pdf";
import GoodsAcceptanceDocument from "@/components/admin/goods-acceptance/GoodsAcceptanceDocument";

const PAGE_SIZES = [10, 20, 50];
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1120;

function FitPage({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const apply = () => {
      const width = frame.clientWidth;
      const height = Math.max(420, window.innerHeight * 0.72);
      const next = Math.min(width / PAGE_WIDTH, height / PAGE_HEIGHT);
      setScale(next > 0 && next < 1 ? next : 1);
    };
    const frameId = window.requestAnimationFrame(apply);
    const observer = new ResizeObserver(apply);
    observer.observe(frame);
    window.addEventListener("resize", apply);
    return () => {
      window.cancelAnimationFrame(frameId);
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

export default function GoodsAcceptanceHistory() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [date, setDate] = useState("");
  const [viewId, setViewId] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloadJob, setDownloadJob] = useState<{
    sheet: GoodsAcceptanceSheet;
    nonce: number;
    mode: "pdf" | "print";
  } | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const startedJob = useRef(0);
  const list = useGoodsAcceptanceList(page, pageSize, date);
  const detail = useGoodsAcceptance(viewOpen ? viewId : undefined);

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (list.data && page > pageCount) setPage(pageCount);
  const items = list.data?.items ?? [];

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
        const filename = `محضر-قبول-${job.sheet.serial}.pdf`;
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
        else await downloadElementAsPdf(source, `محضر-قبول-${serial}.pdf`);
        setBusyId(null);
        return;
      }
      const response = await fetch(`/api/goods-acceptance/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر فتح المحضر");
      const sheet = (await response.json()) as GoodsAcceptanceSheet;
      setDownloadJob({ sheet, nonce: Date.now(), mode });
    } catch (error) {
      setBusyId(null);
      toast({
        title: mode === "print" ? "تعذر الطباعة" : "تعذر تحميل PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div dir="rtl" lang="ar" className="flex flex-col gap-4 p-3 sm:p-4">
      <PageSectionHeader
        title="محاضر قبول السلع"
        description="تُنشأ تلقائياً عند حفظ طلب المواد: محضر لكل مزود، بنفس ورقة القبول."
        icon={ClipboardCheck}
        tone="sky"
        className="text-right [&_h2]:text-right [&_p]:text-right"
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="!flex max-h-[92vh] w-[min(96vw,900px)] !max-w-[900px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-700">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white py-3 pl-14 pr-5">
            <h2 className="text-sm font-medium text-slate-800">محضر قبول السلع</h2>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                const node = document.getElementById("goods-acceptance-preview");
                if (!detail.data) return;
                void runOutput(detail.data.id, "pdf", node);
              }}
              className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-3 text-sm")}
            >
              <Download className="h-4 w-4" />
              تحميل PDF
            </button>
            <button
              type="button"
              disabled={!detail.data || busyId === detail.data.id}
              onClick={() => {
                const node = document.getElementById("goods-acceptance-preview");
                if (!detail.data) return;
                void runOutput(detail.data.id, "print", node);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </button>
          </div>
          <div className="bg-slate-100 p-4">
            {detail.isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">جاري التحميل…</p>
            ) : detail.data ? (
              <FitPage>
                <div id="goods-acceptance-preview" className="bg-white shadow-md">
                  <GoodsAcceptanceDocument sheet={detail.data} />
                </div>
              </FitPage>
            ) : (
              <p className="py-16 text-center text-sm text-rose-600">تعذر فتح المحضر</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed top-0 -left-[1600px]" aria-hidden>
        {downloadJob ? (
          <div ref={captureRef}>
            <GoodsAcceptanceDocument sheet={downloadJob.sheet} />
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
        <span className="ms-auto text-xs text-gray-500">{total} محضر</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-gray-950/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-sky-500/10 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium">وصل التسليم</th>
                <th className="px-4 py-3 text-right font-medium">المزود</th>
                <th className="px-4 py-3 text-right font-medium">المواد</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    لا توجد محاضر. احفظ طلب مواد ليُنشأ المحضر تلقائياً.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="px-4 py-3">{item.dateKey}</td>
                    <td className="px-4 py-3 font-medium">{item.serial}</td>
                    <td className="px-4 py-3">{item.supplierName}</td>
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                          onClick={() => void runOutput(item.id, "print")}
                        >
                          <Printer className="h-4 w-4" />
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
