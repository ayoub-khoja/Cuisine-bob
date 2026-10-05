"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  Package,
  ScrollText,
  Ticket,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCounts } from "@/hooks/queries";
import { isDataSlotUnsettled } from "@/lib/react-query";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import {
  ADMIN_MENU_ITEMS,
  type AdminNavItemConfig,
} from "@/lib/navigation/admin-nav-config";
import { adminSidebarLinkClass } from "@/lib/navigation/nav-link-styles";
import type { AdminCounts } from "@/types";

/** Icon map for admin sidebar items (REQ-0094 — hrefs live in admin-nav-config). */
const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  "/admin/dashboard-overall-insights": LayoutDashboard,
  "/admin/material-request": ClipboardList,
  "/admin/goods-acceptance": FileCheck,
  "/admin/free-ration-permit": Ticket,
  "/admin/daily-consumption": CalendarDays,
  "/admin/suppliers": Truck,
  "/admin/admin-log": ScrollText,
  /*
  "/admin/dashboard-overall-insights": LayoutDashboard,
  "/admin/orders": ShoppingCart,
  "/admin/invoices": FileText,
  "/admin/support-tickets": MessageSquare,
  "/admin/product-reviews": Star,
  "/admin/products": Package,
  "/admin/warehouses": Warehouse,
  "/admin/supplier-portal": Truck,
  "/admin/client-portal": Store,
  "/admin/user-management": Users,
  "/admin/activity-history": History,
  "/admin/my-activity": UserCircle,
  "/admin/settings/email-preferences": Mail,
  */
};

export default function AdminSidebar({
  collapsed = false,
  initialCounts,
}: {
  collapsed?: boolean;
  /** SSR-passed sidebar badge counts (REQ-0025) */
  initialCounts?: AdminCounts;
} = {}) {
  const pathname = usePathname();
  const countsQuery = useAdminCounts(initialCounts);
  const counts = countsQuery.data ?? initialCounts;
  const countsLoading = isDataSlotUnsettled(countsQuery, initialCounts);

  const getCount = (key: AdminNavItemConfig["countKey"]): number | undefined => {
    if (!counts || !key) return undefined;
    return counts[key];
  };

  const renderNavItems = (items: AdminNavItemConfig[], isSub = true) =>
    items.map((item) => {
      const Icon = ADMIN_NAV_ICONS[item.href] ?? Package;
      const count = getCount(item.countKey);
      const showBadge = item.countKey != null;
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          className={adminSidebarLinkClass(pathname, item.href, {
            isSub,
            collapsed,
          })}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          )}
          {!collapsed && showBadge && (
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-1 py-0.5 text-xs font-medium min-w-[1.25rem] text-center",
                "bg-muted text-muted-foreground",
              )}
              aria-label={
                countsLoading
                  ? "Loading count"
                  : count !== undefined
                    ? `${count} items`
                    : undefined
              }
            >
              {countsLoading ? (
                <DataSlotPulse variant="badge" className="mx-auto" />
              ) : count !== undefined && count > 0 ? (
                count > 99 ? (
                  "99+"
                ) : (
                  count
                )
              ) : null}
            </span>
          )}
        </Link>
      );
    });

  /*
  Anciens menus (conservés, non affichés) :
  My Store — Store Overview, Orders, Invoices, Support Tickets, Product Reviews
  Product & System Management — Products, Warehouses, Supplier Portal, Client Portal, User Management, Activity History
  Personal activity — My Activity
  System Settings — Email Preferences
  */

  if (collapsed) {
    return (
      <nav
        className="flex min-h-0 flex-col items-center px-2 gap-1"
        aria-label="Admin navigation"
        dir="rtl"
        lang="ar"
      >
        {renderNavItems(ADMIN_MENU_ITEMS)}
      </nav>
    );
  }

  return (
    <nav
      className="flex min-h-0 flex-col p-2 gap-1"
      dir="rtl"
      lang="ar"
    >
      {renderNavItems(ADMIN_MENU_ITEMS, false)}
    </nav>
  );
}
