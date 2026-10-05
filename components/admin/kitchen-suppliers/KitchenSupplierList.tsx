"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import KitchenSupplierForm from "@/components/admin/kitchen-suppliers/KitchenSupplierForm";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteKitchenSupplier,
  useKitchenSupplierList,
} from "@/hooks/queries/use-kitchen-suppliers";

const PAGE_SIZES = [10, 20, 50];

export default function KitchenSupplierList() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editId, setEditId] = useState<string | undefined>();
  const list = useKitchenSupplierList(page, pageSize, search);
  const remove = useDeleteKitchenSupplier();

  useEffect(() => {
    const next = query.trim();
    const timer = window.setTimeout(() => {
      setSearch((current) => {
        if (current === next) return current;
        setPage(1);
        return next;
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (list.data && page > pageCount) {
    setPage(pageCount);
  }
  const items = list.data?.items ?? [];

  const openForm = (id?: string) => {
    setEditId(id);
    setFormKey((key) => key + 1);
    setOpen(true);
  };

  const onDelete = async (id: string, companyName: string) => {
    if (!window.confirm(`حذف المزود ${companyName}؟`)) return;
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
          title="المزودون"
          description="سجل الشركات المورّدة مع المعرف الجبائي والمنتجات."
          icon={Truck}
          tone="sky"
          className="text-right"
        />
        <button
          type="button"
          onClick={() => openForm()}
          className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
        >
          <Plus className="h-4 w-4" />
          إضافة مزود
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!flex max-h-[90vh] w-[min(96vw,860px)] !max-w-[860px] !flex-col !overflow-y-scroll overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white p-0 text-gray-900 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950 dark:text-white [&>button.absolute]:left-4 [&>button.absolute]:right-auto [&>button.absolute]:z-30 [&>button.absolute]:text-slate-600 dark:[&>button.absolute]:text-white">
          <KitchenSupplierForm
            key={formKey}
            supplierId={editId}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث بالشركة أو المعرف الجبائي"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm dark:border-white/15 dark:bg-gray-950"
          />
        </label>
        <span className="text-xs text-gray-500">{total} مزود</span>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-gray-950/40",
          list.isFetching && items.length > 0 && "opacity-70",
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-sky-500/10 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">اسم الشركة</th>
                <th className="px-4 py-3 text-right font-medium">
                  المعرف الجبائي
                </th>
                <th className="px-4 py-3 text-right font-medium">المنتجات</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    لا يوجد مزودون. أضف أول شركة.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 dark:border-white/10"
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.companyName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {item.taxId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-800 dark:text-sky-200">
                          {item.productCount}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.productPreview.join(" · ")}
                          {item.productCount > item.productPreview.length
                            ? " …"
                            : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
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
                          title="حذف"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-500/10"
                          aria-label={`حذف ${item.companyName}`}
                          onClick={() =>
                            void onDelete(item.id, item.companyName)
                          }
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
