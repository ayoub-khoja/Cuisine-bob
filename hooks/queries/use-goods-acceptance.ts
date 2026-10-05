"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  GoodsAcceptanceListItem,
  GoodsAcceptanceSheet,
} from "@/lib/goods-acceptance/sheet";

export const goodsAcceptanceKey = ["goods-acceptance"] as const;

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useGoodsAcceptanceList(page: number, pageSize: number, date: string) {
  return useQuery({
    queryKey: [...goodsAcceptanceKey, "list", page, pageSize, date],
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.at(-1) === date ? previous : undefined,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (date) params.set("date", date);
      const response = await fetch(`/api/goods-acceptance?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as {
        items: GoodsAcceptanceListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useGoodsAcceptance(id: string | undefined) {
  return useQuery({
    queryKey: [...goodsAcceptanceKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/goods-acceptance/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as GoodsAcceptanceSheet;
    },
  });
}
