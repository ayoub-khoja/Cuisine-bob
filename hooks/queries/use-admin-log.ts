"use client";

import { useQuery } from "@tanstack/react-query";
import type { StockRow } from "@/lib/admin-log/stock";

export const adminLogKey = ["admin-log"] as const;

export function useAdminLogStock() {
  return useQuery({
    queryKey: [...adminLogKey, "stock"],
    queryFn: async () => {
      const response = await fetch("/api/admin-log/stock", { credentials: "include" });
      if (!response.ok) throw new Error("تعذر تحميل المخزون");
      return (await response.json()) as { items: StockRow[] };
    },
  });
}
