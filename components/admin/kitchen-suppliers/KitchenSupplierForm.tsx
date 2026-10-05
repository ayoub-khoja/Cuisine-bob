"use client";

import { useState } from "react";
import { Plus, Save, Trash2, Truck } from "lucide-react";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useKitchenSupplier,
  useSaveKitchenSupplier,
} from "@/hooks/queries/use-kitchen-suppliers";
import {
  emptyProduct,
  emptySupplier,
  type KitchenSupplierInput,
  type SupplierProduct,
} from "@/lib/kitchen-suppliers/supplier";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-950";

function SupplierEditor({
  supplierId,
  initial,
  onSaved,
  onCancel,
}: {
  supplierId?: string;
  initial: KitchenSupplierInput;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const saveSupplier = useSaveKitchenSupplier();
  const [draft, setDraft] = useState<KitchenSupplierInput>(initial);

  const updateProduct = (id: string, patch: Partial<SupplierProduct>) => {
    setDraft((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      ),
    }));
  };

  const save = async () => {
    try {
      await saveSupplier.mutateAsync({ id: supplierId, supplier: draft });
      toast({ title: supplierId ? "تم تحديث المزود" : "تمت إضافة المزود" });
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
          title={supplierId ? "تعديل مزود" : "مزود جديد"}
          description="اسم الشركة، المعرف الجبائي، والمنتجات التي يورّدها."
          icon={Truck}
          tone="sky"
          className="text-right"
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
            disabled={saveSupplier.isPending}
            className={cn(GLASS_PRIMARY_BUTTON.sky, "gap-2 px-4 text-sm")}
          >
            <Save className="h-4 w-4" />
            {saveSupplier.isPending ? "جاري الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            اسم الشركة
            <input
              value={draft.companyName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder="شركة الأمل للمواد الغذائية"
              autoComplete="organization"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            المعرف الجبائي
            <input
              value={draft.taxId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  taxId: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder="1234567/A/A/M/000"
              dir="ltr"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-sky-500/10 px-4 py-3">
            <h2 className="text-sm font-medium">المنتجات</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-sky-800 dark:text-sky-200"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  products: [...current.products, emptyProduct()],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              إضافة منتج
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {draft.products.map((product) => (
              <div
                key={product.id}
                className="grid items-end gap-2 p-3 sm:grid-cols-[1fr_160px_auto]"
              >
                <label className="flex flex-col gap-1 text-sm">
                  المنتج
                  <input
                    value={product.name}
                    onChange={(event) =>
                      updateProduct(product.id, { name: event.target.value })
                    }
                    className={fieldClass}
                    placeholder="أرز"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  الوحدة
                  <input
                    value={product.unit}
                    onChange={(event) =>
                      updateProduct(product.id, { unit: event.target.value })
                    }
                    className={fieldClass}
                    placeholder="كغ"
                  />
                </label>
                <button
                  type="button"
                  aria-label="حذف المنتج"
                  className="mb-1 inline-flex h-10 w-10 items-center justify-center text-rose-600"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      products:
                        current.products.length === 1
                          ? [emptyProduct()]
                          : current.products.filter(
                              (item) => item.id !== product.id,
                            ),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KitchenSupplierForm({
  supplierId,
  onSaved,
  onCancel,
}: {
  supplierId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const existing = useKitchenSupplier(supplierId);

  if (supplierId && existing.isLoading) {
    return (
      <p className="px-5 py-16 text-center text-sm text-slate-500">
        جاري التحميل…
      </p>
    );
  }
  if (supplierId && !existing.data) {
    return (
      <p className="px-5 py-16 text-center text-sm text-rose-600">
        تعذر فتح المزود
      </p>
    );
  }

  const initial: KitchenSupplierInput = existing.data
    ? {
        companyName: existing.data.companyName,
        taxId: existing.data.taxId,
        products:
          existing.data.products.length > 0
            ? existing.data.products
            : [emptyProduct()],
      }
    : emptySupplier();

  return (
    <SupplierEditor
      key={supplierId ?? "new"}
      supplierId={supplierId}
      initial={initial}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
