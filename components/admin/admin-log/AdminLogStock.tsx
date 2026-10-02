"use client";

import { ScrollText } from "lucide-react";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { useAdminLogStock } from "@/hooks/queries/use-admin-log";
import { paperDate } from "@/lib/material-request/sheet";

export default function AdminLogStock() {
  const stock = useAdminLogStock();
  const items = stock.data?.items ?? [];

  return (
    <div dir="rtl" lang="ar" className="flex flex-col gap-4 p-3 sm:p-4">
      <PageSectionHeader
        title="سجل الادارة"
        description="مخزون المواد المضافة تلقائياً من طلبات المواد."
        icon={ScrollText}
        tone="sky"
        className="text-right [&_h2]:text-right [&_p]:text-right"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-sky-500/10 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-4 py-3 text-right font-medium">المادة</th>
                <th className="px-4 py-3 text-right font-medium">الوحدة</th>
                <th className="px-4 py-3 text-right font-medium">الكمية</th>
                <th className="px-4 py-3 text-right font-medium">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {stock.isPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    جاري التحميل…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    لا توجد مواد في المخزون.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={`${item.name}\0${item.unit}`}
                    className="border-t border-slate-100 dark:border-white/10"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.unit || "—"}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.dateKey ? paperDate(item.dateKey) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
