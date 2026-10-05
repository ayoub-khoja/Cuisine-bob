"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  KitchenSupplierInput,
  KitchenSupplierListItem,
  KitchenSupplierRecord,
} from "@/lib/kitchen-suppliers/supplier";

const rootKey = ["kitchen-suppliers"] as const;

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useKitchenSupplierList(
  page: number,
  pageSize: number,
  query: string,
) {
  return useQuery({
    queryKey: [...rootKey, "list", page, pageSize, query],
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.at(-1) === query ? previous : undefined,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query) params.set("q", query);
      const response = await fetch(`/api/kitchen-suppliers?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as {
        items: KitchenSupplierListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useKitchenSupplier(id: string | undefined) {
  return useQuery({
    queryKey: [...rootKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/kitchen-suppliers/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as KitchenSupplierRecord;
    },
  });
}

export function useSaveKitchenSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      id?: string;
      supplier: KitchenSupplierInput;
    }) => {
      const response = await fetch(
        variables.id
          ? `/api/kitchen-suppliers/${variables.id}`
          : "/api/kitchen-suppliers",
        {
          method: variables.id ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables.supplier),
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      return response.json() as Promise<{ id: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}

export function useDeleteKitchenSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: string }) => {
      const response = await fetch(`/api/kitchen-suppliers/${variables.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}
