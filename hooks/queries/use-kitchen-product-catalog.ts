"use client";

import { useQuery } from "@tanstack/react-query";
import type { CatalogProduct } from "@/lib/kitchen-suppliers/catalog";

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useKitchenProductCatalog() {
  return useQuery({
    queryKey: ["kitchen-suppliers", "catalog"],
    staleTime: 30_000,
    queryFn: async () => {
      const response = await fetch("/api/kitchen-suppliers/catalog", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as { products: CatalogProduct[] };
    },
  });
}
