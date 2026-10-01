"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DailySheetInput,
  DailySheetListItem,
  DailySheetRecord,
} from "@/lib/daily-consumption/sheet";

const rootKey = ["daily-consumption"] as const;

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "تعذر تنفيذ العملية";
  } catch {
    return "تعذر تنفيذ العملية";
  }
}

export function useDailyConsumptionList(page: number, pageSize: number, date: string) {
  return useQuery({
    queryKey: [...rootKey, "list", page, pageSize, date],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (date) params.set("date", date);
      const response = await fetch(`/api/daily-consumption?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as {
        items: DailySheetListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useDailyConsumption(id: string | undefined) {
  return useQuery({
    queryKey: [...rootKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/daily-consumption/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      return (await response.json()) as DailySheetRecord;
    },
  });
}

function useSheetMutation<TVariables>(
  method: "POST" | "PUT" | "DELETE",
  url: (variables: TVariables) => string,
  body?: (variables: TVariables) => DailySheetInput | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await fetch(url(variables), {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body(variables)) : undefined,
      });
      if (!response.ok) throw new Error(await readError(response));
      return response.json() as Promise<{ id?: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}

export function useCreateDailyConsumption() {
  return useSheetMutation<{ sheet: DailySheetInput }>(
    "POST",
    () => "/api/daily-consumption",
    (variables) => variables.sheet,
  );
}

export function useUpdateDailyConsumption() {
  return useSheetMutation<{ id: string; sheet: DailySheetInput }>(
    "PUT",
    (variables) => `/api/daily-consumption/${variables.id}`,
    (variables) => variables.sheet,
  );
}

export function useDeleteDailyConsumption() {
  return useSheetMutation<{ id: string }>(
    "DELETE",
    (variables) => `/api/daily-consumption/${variables.id}`,
  );
}
