"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestInput, RequestListItem, RequestRecord } from "@/lib/material-request/sheet";
import { adminLogKey } from "@/hooks/queries/use-admin-log";

const rootKey = ["material-request"] as const;

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useMaterialRequestList(page: number, pageSize: number, date: string) {
  return useQuery({
    queryKey: [...rootKey, "list", page, pageSize, date],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (date) params.set("date", date);
      const response = await fetch(`/api/material-request?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as {
        items: RequestListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useMaterialRequest(id: string | undefined) {
  return useQuery({
    queryKey: [...rootKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/material-request/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as RequestRecord;
    },
  });
}

export function useSaveMaterialRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id?: string; request: RequestInput }) => {
      const response = await fetch(
        variables.id ? `/api/material-request/${variables.id}` : "/api/material-request",
        {
          method: variables.id ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables.request),
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      return response.json() as Promise<{ id: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rootKey });
      await queryClient.invalidateQueries({ queryKey: adminLogKey });
    },
  });
}

export function useDeleteMaterialRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: string }) => {
      const response = await fetch(`/api/material-request/${variables.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rootKey });
      await queryClient.invalidateQueries({ queryKey: adminLogKey });
    },
  });
}
