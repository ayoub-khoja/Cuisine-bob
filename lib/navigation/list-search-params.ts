/**
 * Zod-validated list URL search + pagination (Next.js App Router equivalent of typed useSearch).
 * URL drives UI filter/page state only — auth/role scoping stays on SSR/API.
 */

import { z } from "zod";
import { PAGE_SIZE_OPTIONS } from "@/components/shared/pagination-select-styles";

export const DEFAULT_LIST_PAGE_SIZE = 8;
export const LIST_SEARCH_Q_MAX = 100;
/** Hard ceiling for 1-based page (DoS / absurd deep links). */
export const LIST_PAGE_MAX = 10_000;

const PAGE_SIZE_SET = new Set<number>(PAGE_SIZE_OPTIONS);

export type ListSearchState = {
  /** 0-based, for TanStack Table */
  pageIndex: number;
  pageSize: number;
  /** Search box term (URL key `q`) */
  q: string;
};

export const DEFAULT_LIST_SEARCH_STATE: ListSearchState = {
  pageIndex: 0,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
  q: "",
};

/** Allowed page sizes only — invalid → default. */
export const listPageSizeSchema = z.coerce
  .number()
  .int()
  .refine((n) => PAGE_SIZE_SET.has(n), { message: "invalid pageSize" })
  .catch(DEFAULT_LIST_PAGE_SIZE);

/** 1-based URL `page` — invalid/out of range → 1. */
export const listPageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(LIST_PAGE_MAX)
  .catch(1);

/**
 * Search `q`: trim; oversize rejected then emptied (not reflected into URL as huge strings).
 * Callers may still truncate for display via `clampListSearchQuery`.
 */
export const listQuerySchema = z
  .string()
  .max(LIST_SEARCH_Q_MAX)
  .transform((s) => s.trim())
  .catch("");

export function clampListSearchQuery(raw: string): string {
  return raw.trim().slice(0, LIST_SEARCH_Q_MAX);
}

export function clampListPageSize(raw: number): number {
  return PAGE_SIZE_SET.has(raw) ? raw : DEFAULT_LIST_PAGE_SIZE;
}

function readParam(
  input: URLSearchParams | Record<string, string | undefined> | null | undefined,
  key: string,
): string | undefined {
  if (!input) return undefined;
  if (typeof (input as URLSearchParams).get === "function") {
    return (input as URLSearchParams).get(key) ?? undefined;
  }
  return (input as Record<string, string | undefined>)[key];
}

/**
 * Parse only allowlisted keys (`page`, `pageSize`, `q`). Unknown keys ignored.
 * Never throws — always returns a safe state.
 */
export function parseListSearchParams(
  input?: URLSearchParams | Record<string, string | undefined> | null,
): ListSearchState {
  const pageOneBased = listPageSchema.parse(readParam(input, "page") ?? "1");
  const pageSize = listPageSizeSchema.parse(
    readParam(input, "pageSize") ?? String(DEFAULT_LIST_PAGE_SIZE),
  );
  const qRaw = readParam(input, "q") ?? "";
  const qParsed = listQuerySchema.safeParse(qRaw);
  const q = qParsed.success ? qParsed.data : "";

  return {
    pageIndex: Math.max(0, pageOneBased - 1),
    pageSize,
    q,
  };
}

/**
 * Serialize list state to a plain record (omit defaults for clean URLs).
 * Does not include unknown keys — caller merges onto existing URLSearchParams.
 */
export function serializeListSearchParams(
  state: ListSearchState,
): Record<string, string> {
  const out: Record<string, string> = {};
  const pageOneBased = state.pageIndex + 1;
  if (pageOneBased > 1) out.page = String(pageOneBased);
  if (state.pageSize !== DEFAULT_LIST_PAGE_SIZE) {
    out.pageSize = String(clampListPageSize(state.pageSize));
  }
  const q = clampListSearchQuery(state.q);
  if (q) out.q = q;
  return out;
}

const LIST_URL_KEYS = ["page", "pageSize", "q"] as const;

/**
 * Shallow-update `page` / `pageSize` / `q` without touching other params (e.g. ownerId).
 * Omits default values so URLs stay clean.
 */
export function replaceShallowListSearchParams(state: ListSearchState): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of LIST_URL_KEYS) {
    url.searchParams.delete(key);
  }
  const next = serializeListSearchParams(state);
  for (const [key, value] of Object.entries(next)) {
    url.searchParams.set(key, value);
  }
  const href = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", href);
}
