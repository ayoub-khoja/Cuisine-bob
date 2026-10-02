"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Save, Trash2 } from "lucide-react";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { GLASS_PRIMARY_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useMaterialRequest,
  useSaveMaterialRequest,
} from "@/hooks/queries/use-material-request";
import {
  DEFAULT_SIGNATORY,
  emptyLine,
  emptyRequest,
  type RequestInput,
  type RequestLine,
} from "@/lib/material-request/sheet";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-950";

export default function MaterialRequestForm({
  requestId,
  onSaved,
  onCancel,
}: {
  requestId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const existing = useMaterialRequest(requestId);
  const saveRequest = useSaveMaterialRequest();
  const [draft, setDraft] = useState<RequestInput>(emptyRequest);

  useEffect(() => {
    if (!existing.data) return;
    setDraft({
      serial: existing.data.serial,
      dateKey: existing.data.dateKey,
      lines: existing.data.lines.length > 0 ? existing.data.lines : [emptyLine()],
      signatory: existing.data.signatory || DEFAULT_SIGNATORY,
    });
  }, [existing.data]);

  const updateLine = (id: string, patch: Partial<RequestLine>) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  };

  const save = async () => {
    try {
      await saveRequest.mutateAsync({ id: requestId, request: draft });
      toast({ title: "تم حفظ طلب المواد" });
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
            disabled={saveRequest.isPending || existing.isLoading}
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
          <div className="divide-y divide-slate-100">
            {draft.lines.map((line) => (
              <div key={line.id} className="grid items-end gap-2 p-3 sm:grid-cols-[1fr_120px_140px_auto]">
                <label className="flex flex-col gap-1 text-sm">
                  المادة
                  <input
                    value={line.name}
                    onChange={(event) => updateLine(line.id, { name: event.target.value })}
                    className={fieldClass}
                    placeholder="بلاتو ألمنيوم"
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
            ))}
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
