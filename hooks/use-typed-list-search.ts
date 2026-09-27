"use client";

/**
 * Typed list search + pagination synced to the URL (shallow replaceState).
 * Next.js App Router stand-in for TanStack Start useSearch on list pages.
 */

import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSearchParams } from "next/navigation";
import type { PaginationType } from "@/components/shared/PaginationSelector";
import {
  clampListPageSize,
  clampListSearchQuery,
  LIST_PAGE_MAX,
  parseListSearchParams,
  replaceShallowListSearchParams,
  type ListSearchState,
} from "@/lib/navigation/list-search-params";

export type UseTypedListSearchResult = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  pagination: PaginationType;
  setPagination: Dispatch<SetStateAction<PaginationType>>;
};

function toPagination(state: ListSearchState): PaginationType {
  return { pageIndex: state.pageIndex, pageSize: state.pageSize };
}

/**
 * Hydrate from current URL once; subsequent updates write shallow URL params.
 * Invalid URL values coerce to safe defaults (Zod catch).
 */
export function useTypedListSearch(): UseTypedListSearchResult {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ListSearchState>(() =>
    parseListSearchParams(searchParams),
  );

  const setSearchTerm = useCallback<Dispatch<SetStateAction<string>>>(
    (update) => {
      setState((prev) => {
        const raw =
          typeof update === "function" ? update(prev.q) : update;
        const next: ListSearchState = {
          ...prev,
          q: clampListSearchQuery(raw),
          pageIndex: 0,
        };
        replaceShallowListSearchParams(next);
        return next;
      });
    },
    [],
  );

  const setPagination = useCallback<Dispatch<SetStateAction<PaginationType>>>(
    (update) => {
      setState((prev) => {
        const current = toPagination(prev);
        const nextPag =
          typeof update === "function" ? update(current) : update;
        const next: ListSearchState = {
          ...prev,
          pageIndex: Math.min(
            LIST_PAGE_MAX - 1,
            Math.max(0, Math.floor(nextPag.pageIndex) || 0),
          ),
          pageSize: clampListPageSize(nextPag.pageSize),
        };
        replaceShallowListSearchParams(next);
        return next;
      });
    },
    [],
  );

  const pagination = useMemo(() => toPagination(state), [state]);

  return {
    searchTerm: state.q,
    setSearchTerm,
    pagination,
    setPagination,
  };
}
