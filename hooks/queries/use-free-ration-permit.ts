"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermitInput, PermitListItem, PermitRecord } from "@/lib/free-ration/sheet";

const rootKey = ["free-ration-permit"] as const;

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useFreeRationList(page: number, pageSize: number, date: string) {
  return useQuery({
    queryKey: [...rootKey, "list", page, pageSize, date],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (date) params.set("date", date);
      const response = await fetch(`/api/free-ration-permit?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as {
        items: PermitListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useFreeRationPermit(id: string | undefined) {
  return useQuery({
    queryKey: [...rootKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/free-ration-permit/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as PermitRecord;
    },
  });
}

export function useSaveFreeRationPermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id?: string; permit: PermitInput }) => {
      const response = await fetch(
        variables.id ? `/api/free-ration-permit/${variables.id}` : "/api/free-ration-permit",
        {
          method: variables.id ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables.permit),
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

export function useDeleteFreeRationPermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: string }) => {
      const response = await fetch(`/api/free-ration-permit/${variables.id}`, {
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
