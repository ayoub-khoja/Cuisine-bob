"use client";

import { useState } from "react";
import { ClipboardList, Plus, Save, Trash2 } from "lucide-react";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useMaterialRequest,
  useSaveMaterialRequest,
} from "@/hooks/queries/use-material-request";
import { useKitchenProductCatalog } from "@/hooks/queries/use-kitchen-product-catalog";
import {
  matchCatalogProduct,
  type CatalogProduct,
} from "@/lib/kitchen-suppliers/catalog";
import { productNameKey } from "@/lib/kitchen-suppliers/supplier";
import {
  DEFAULT_SIGNATORY,
  emptyLine,
  emptyRequest,
  type RequestInput,
  type RequestLine,
} from "@/lib/material-request/sheet";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-950";

function MaterialNameField({
  line,
  catalog,
  onChange,
}: {
  line: RequestLine;
  catalog: CatalogProduct[];
  onChange: (patch: Partial<RequestLine>) => void;
}) {
  const [open, setOpen] = useState(false);
  const query = productNameKey(line.name);
  const matches = catalog
    .filter((item) => !query || productNameKey(item.name).includes(query))
    .slice(0, 8);

  return (
    <label className="relative flex flex-col gap-1 text-sm">
      المادة
      <input
        value={line.name}
        onChange={(event) => {
          const name = event.target.value;
          const match = matchCatalogProduct(name, catalog);
          onChange({
            name,
            supplierId: match?.supplierId ?? "",
            supplierName: match?.companyName ?? "",
            unit: match ? match.unit || line.unit : line.unit,
          });
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={fieldClass}
        placeholder="ابحث عن مادة"
        autoComplete="off"
      />
      {open && matches.length > 0 ? (
        <ul className="absolute top-full z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/15 dark:bg-slate-950">
          {matches.map((item) => (
            <li key={`${item.supplierId}-${item.productId}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-right text-sm hover:bg-sky-50 dark:hover:bg-white/10"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange({
                    name: item.name,
                    unit: item.unit || line.unit,
                    supplierId: item.supplierId,
                    supplierName: item.companyName,
                  });
                  setOpen(false);
                }}
              >
                <span>{item.name}</span>
                <span className="truncate text-xs text-slate-500">{item.companyName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

function RequestEditor({
  requestId,
  initial,
  onSaved,
  onCancel,
}: {
  requestId?: string;
  initial: RequestInput;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const catalog = useKitchenProductCatalog();
  const products = catalog.data?.products ?? [];
  const saveRequest = useSaveMaterialRequest();
  const [draft, setDraft] = useState<RequestInput>(initial);

  const updateLine = (id: string, patch: Partial<RequestLine>) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  };

  const save = async () => {
    try {
      await saveRequest.mutateAsync({ id: requestId, request: draft });
      toast({ title: "تم حفظ طلب المواد وإنشاء محضر القبول" });
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
          title={requestId ? "تعديل طلب مواد" : "طلب مواد جديد"}
          description="نفس خانات الورقة: الرقم، التاريخ، والمادة مع الكمية."
          icon={ClipboardList}
          tone="sky"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-4 text-sm dark:border-white/15"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saveRequest.isPending}
            className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
          >
            <Save className="h-4 w-4" />
            {saveRequest.isPending ? "جاري الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            الرقم
            <input
              value={draft.serial}
              onChange={(event) => setDraft((current) => ({ ...current, serial: event.target.value }))}
              className={fieldClass}
              inputMode="numeric"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            التاريخ
            <input
              type="date"
              value={draft.dateKey}
              onChange={(event) =>
                setDraft((current) => ({ ...current, dateKey: event.target.value }))
              }
              className={fieldClass}
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-sky-500/10 px-4 py-3">
            <h2 className="text-sm font-medium">المواد</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-sky-800"
              onClick={() =>
                setDraft((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))
              }
            >
              <Plus className="h-4 w-4" />
              إضافة سطر
            </button>
          </div>
          {products.length === 0 && !catalog.isLoading ? (
            <p className="px-4 py-2 text-xs text-amber-700">
              لا توجد مواد مسجّلة. أضفها أولاً من صفحة المزودون.
            </p>
          ) : null}
          <div className="divide-y divide-slate-100">
            {draft.lines.map((line) => {
              const supplier = matchCatalogProduct(line.name, products);
              return (
              <div key={line.id} className="grid items-end gap-2 p-3 sm:grid-cols-[1.2fr_1fr_110px_120px_auto]">
                <MaterialNameField
                  line={line}
                  catalog={products}
                  onChange={(patch) => updateLine(line.id, patch)}
                />
                <label className="flex flex-col gap-1 text-sm">
                  المزود
                  <input
                    readOnly
                    value={supplier?.companyName ?? ""}
                    placeholder={catalog.isLoading ? "جاري التحميل…" : "يظهر تلقائياً"}
                    className={cn(fieldClass, "bg-slate-50 text-slate-700 dark:bg-white/5")}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  الكمية
                  <input
                    inputMode="numeric"
                    value={line.quantity ? String(line.quantity) : ""}
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (!/^\d{0,7}$/.test(raw)) return;
                      updateLine(line.id, { quantity: raw === "" ? 0 : Number(raw) });
                    }}
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  الوحدة
                  <input
                    value={line.unit}
                    onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                    className={fieldClass}
                    placeholder="بلاتو"
                  />
                </label>
                <button
                  type="button"
                  aria-label="حذف السطر"
                  className="mb-1 inline-flex h-10 w-10 items-center justify-center text-rose-600"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      lines:
                        current.lines.length === 1
                          ? [emptyLine()]
                          : current.lines.filter((item) => item.id !== line.id),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span>العميد / الإمضاء</span>
          <input
            value={draft.signatory || DEFAULT_SIGNATORY}
            onChange={(event) =>
              setDraft((current) => ({ ...current, signatory: event.target.value }))
            }
            className="box-border h-11 w-full overflow-hidden rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white"
            style={{ height: "2.75rem", lineHeight: "2.75rem", paddingTop: 0, paddingBottom: 0 }}
          />
        </label>
      </div>
    </div>
  );
}

export default function MaterialRequestForm({
  requestId,
  onSaved,
  onCancel,
}: {
  requestId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const existing = useMaterialRequest(requestId);
  if (requestId && existing.isLoading) {
    return <p className="px-5 py-16 text-center text-sm text-slate-500">جاري التحميل…</p>;
  }
  if (requestId && !existing.data) {
    return <p className="px-5 py-16 text-center text-sm text-rose-600">تعذر فتح الطلب</p>;
  }
  const initial: RequestInput = existing.data
    ? {
        serial: existing.data.serial,
        dateKey: existing.data.dateKey,
        lines: existing.data.lines.length > 0 ? existing.data.lines : [emptyLine()],
        signatory: existing.data.signatory || DEFAULT_SIGNATORY,
      }
    : emptyRequest();
  return (
    <RequestEditor
      key={requestId ?? "new"}
      requestId={requestId}
      initial={initial}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
