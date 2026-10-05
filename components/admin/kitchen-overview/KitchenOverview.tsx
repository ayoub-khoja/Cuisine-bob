"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Box,
  ChefHat,
  ClipboardList,
  Clock,
  Coins,
  FileText,
  Printer,
  ShoppingCart,
  Users,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import { useDashboard } from "@/hooks/queries";
import type { DashboardStats, DashboardTopProduct, DashboardTrendPoint } from "@/types";

const PIE_COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#a855f7", "#94a3b8"];

type Slice = { name: string; value: number; percent: number; fill: string };

function formatTnd(value: number): string {
  const amount = new Intl.NumberFormat("fr-TN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
  return `${amount} د.ت`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(value);
}

function salesDelta(trends: DashboardTrendPoint[]): number | null {
  if (trends.length < 2) return null;
  const previous = trends[trends.length - 2]?.revenue ?? 0;
  const latest = trends[trends.length - 1]?.revenue ?? 0;
  if (previous <= 0) return null;
  return Math.round(((latest - previous) / previous) * 100);
}

function categorySlices(products: DashboardTopProduct[]): Slice[] {
  const totals = new Map<string, number>();
  for (const product of products) {
    const name = product.categoryName?.trim() || "أخرى";
    totals.set(name, (totals.get(name) ?? 0) + product.totalRevenue);
  }
  const sum = [...totals.values()].reduce((total, value) => total + value, 0);
  return [...totals.entries()].map(([name, value], index) => ({
    name,
    value,
    percent: sum > 0 ? Math.round((value / sum) * 100) : 0,
    fill: PIE_COLORS[index % PIE_COLORS.length] ?? "#94a3b8",
  }));
}

function OverviewClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const dateLabel = now
    ? now.toLocaleDateString("ar-TN-u-nu-latn", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const timeLabel = now
    ? now.toLocaleTimeString("ar-TN-u-nu-latn", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
      <span>{dateLabel}</span>
      <span className="text-slate-300">|</span>
      <Clock className="h-4 w-4 text-sky-500" />
      <span>{timeLabel}</span>
    </div>
  );
}

function KpiCard({
  title,
  value,
  footer,
  icon: Icon,
  background,
}: {
  title: string;
  value: string;
  footer: string;
  icon: LucideIcon;
  background: string;
}) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl p-4 shadow-md"
      style={{ background, color: "#ffffff" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#ffffff" }}>
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "#ffffff" }}>
            {value}
          </p>
        </div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff" }}
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.92)" }}>
        {footer}
      </p>
    </article>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
  background,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  background: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4 text-center text-sm font-medium shadow-sm"
      style={{ background, color: "#ffffff" }}
    >
      <Icon className="h-6 w-6" />
      {label}
    </Link>
  );
}

function ModuleCard({
  href,
  title,
  description,
  icon: Icon,
  header,
  button,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  header: string;
  button: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex h-28 items-center justify-center" style={{ background: header }}>
        <Icon className="h-12 w-12 drop-shadow" style={{ color: "#ffffff" }} />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="min-h-10 text-xs leading-5 text-slate-500">{description}</p>
        <Link
          href={href}
          className="flex h-9 items-center justify-center rounded-lg text-sm font-medium"
          style={{ background: button, color: "#ffffff" }}
        >
          دخول
        </Link>
      </div>
    </article>
  );
}

export default function KitchenOverview({
  initialStats,
}: {
  initialStats?: DashboardStats | null;
}) {
  const dashboard = useDashboard(initialStats);
  const stats = dashboard.data ?? initialStats ?? null;
  const counts = stats?.counts;
  const trends = stats?.trends ?? [];
  const slices = categorySlices(stats?.orderAnalytics.topProducts ?? []);
  const pieData = slices.length > 0 ? slices : [{ name: "أخرى", value: 1, percent: 0, fill: "#e2e8f0" }];
  const pieTotal = slices.reduce((total, slice) => total + slice.value, 0);
  const delta = salesDelta(trends);
  const salesFooter =
    delta == null ? "إجمالي الطلبات" : `${delta > 0 ? "+" : ""}${delta}% عن الفترة السابقة`;
  const lineData =
    trends.length > 0
      ? trends.map((point) => ({ label: point.label, value: point.revenue }))
      : [{ label: "—", value: 0 }];
  const reports = (stats?.recent.orders ?? []).slice(0, 4);

  return (
    <div dir="rtl" lang="ar" className="min-h-full bg-[#e8eef8] p-3 text-slate-800 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-700 sm:text-xl">مرحبًا بك في منصة المطعم</h1>
        <OverviewClock />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-4">
          <KpiCard
            title="إجمالي المبيعات اليوم"
            value={formatTnd(stats?.orderAnalytics.totalRevenueExcludingCancelled ?? 0)}
            footer={salesFooter}
            icon={Utensils}
            background="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          />
          <KpiCard
            title="المخزون الحالي"
            value={formatTnd(stats?.totalInventoryValue ?? 0)}
            footer={`عدد الأصناف: ${formatCount(counts?.products ?? 0)}`}
            icon={Box}
            background="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          />
          <KpiCard
            title="عدد الزبائن اليوم"
            value={formatCount(counts?.orders ?? 0)}
            footer="الطلبات المسجّلة"
            icon={Users}
            background="linear-gradient(135deg, #22d3ee 0%, #0284c7 100%)"
          />
          <KpiCard
            title="المصروفات اليوم"
            value={formatTnd(stats?.invoiceAnalytics.outstandingAmount ?? 0)}
            footer="الفواتير غير المسددة"
            icon={Coins}
            background="linear-gradient(135deg, #fb923c 0%, #ea580c 100%)"
          />
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="text-amber-500">⚡</span>
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction href="/admin/material-request" label="إدخال الطلبات" icon={ChefHat} background="#7c3aed" />
            <QuickAction href="/admin/daily-consumption" label="تسيير المخزن" icon={Warehouse} background="#2563eb" />
            <QuickAction href="/admin/admin-log" label="عرض التقارير" icon={BarChart3} background="#16a34a" />
            <QuickAction href="/admin/invoices" label="طباعة الفواتير" icon={Printer} background="#f97316" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-5">
          <h2 className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            المبيعات اليومية
            <BarChart3 className="h-4 w-4 text-sky-500" />
          </h2>
          <ResponsiveChartContainer className="h-[220px] w-full min-w-0">
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip formatter={(value) => formatTnd(Number(value ?? 0))} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveChartContainer>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">توزيع المبيعات حسب الأصناف</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative h-[200px] w-[200px] shrink-0">
              <ResponsiveChartContainer className="h-[200px] w-[200px]">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={78} stroke="none">
                    {pieData.map((slice) => (
                      <Cell key={slice.name} fill={slice.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-slate-800">{formatTnd(pieTotal)}</span>
              </div>
            </div>
            <ul className="min-w-[140px] flex-1 space-y-2 text-xs text-slate-600">
              {(slices.length > 0 ? slices : [{ name: "لا توجد مبيعات", percent: 0, fill: "#e2e8f0", value: 0 }]).map(
                (slice) => (
                  <li key={slice.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.fill }} />
                      {slice.name}
                    </span>
                    <span>{slice.percent}%</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ClipboardList className="h-4 w-4 text-sky-500" />
            آخر التقارير
          </h2>
          <ul className="space-y-2">
            {reports.length === 0 ? (
              <li className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                لا توجد تقارير بعد
              </li>
            ) : (
              reports.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs hover:bg-sky-50"
                  >
                    <span className="font-medium text-slate-700">{order.orderNumber}</span>
                    <span className="text-slate-400">{order.createdAt.slice(0, 10)}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-4">
          <ModuleCard
            href="/admin/material-request"
            title="المطعم"
            description="إدارة الطلبات والمبيعات وتحضير الوجبات"
            icon={ChefHat}
            header="linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)"
            button="#0284c7"
          />
          <ModuleCard
            href="/admin/daily-consumption"
            title="المخزن"
            description="مراقبة الكميات وتحديث الأسعار والتزويد"
            icon={Warehouse}
            header="linear-gradient(135deg, #34d399 0%, #15803d 100%)"
            button="#16a34a"
          />
          <ModuleCard
            href="/admin/goods-acceptance"
            title="المواد الأولية"
            description="إدارة المواد الغذائية والمشروبات"
            icon={ShoppingCart}
            header="linear-gradient(135deg, #fb923c 0%, #d97706 100%)"
            button="#f97316"
          />
          <ModuleCard
            href="/admin/admin-log"
            title="التقارير"
            description="تقرير نهاية اليوم وتقرير نهاية الشهر"
            icon={FileText}
            header="linear-gradient(135deg, #a78bfa 0%, #7e22ce 100%)"
            button="#7c3aed"
          />
        </div>

        <section className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-amber-50 p-6 text-center shadow-sm xl:col-span-3">
          <p className="text-lg font-semibold text-sky-800">معًا من أجل</p>
          <p className="text-lg font-semibold text-amber-600">خدمة أفضل</p>
          <p className="mt-3 text-2xl" aria-hidden>
            🇹🇳
          </p>
        </section>
      </div>
    </div>
  );
}
