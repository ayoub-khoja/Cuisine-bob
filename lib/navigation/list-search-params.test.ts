import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIST_PAGE_SIZE,
  LIST_SEARCH_Q_MAX,
  clampListPageSize,
  clampListSearchQuery,
  parseListSearchParams,
  serializeListSearchParams,
} from "./list-search-params";

describe("parseListSearchParams", () => {
  it("parses valid page (1-based), pageSize, and q", () => {
    const state = parseListSearchParams(
      new URLSearchParams("page=3&pageSize=10&q=sony"),
    );
    expect(state).toEqual({ pageIndex: 2, pageSize: 10, q: "sony" });
  });

  it("defaults when params missing", () => {
    expect(parseListSearchParams(new URLSearchParams())).toEqual({
      pageIndex: 0,
      pageSize: DEFAULT_LIST_PAGE_SIZE,
      q: "",
    });
  });

  it("clamps invalid pageSize to default", () => {
    const state = parseListSearchParams(
      new URLSearchParams("pageSize=999"),
    );
    expect(state.pageSize).toBe(DEFAULT_LIST_PAGE_SIZE);
  });

  it("rejects oversized q (empty catch)", () => {
    const huge = "x".repeat(LIST_SEARCH_Q_MAX + 50);
    const state = parseListSearchParams(
      new URLSearchParams(`q=${huge}`),
    );
    expect(state.q).toBe("");
  });

  it("ignores unknown keys", () => {
    const state = parseListSearchParams(
      new URLSearchParams("ownerId=abc&hack=1&page=2"),
    );
    expect(state.pageIndex).toBe(1);
    expect(state).not.toHaveProperty("ownerId");
  });

  it("coerces page=0 and negative to page 1", () => {
    expect(parseListSearchParams({ page: "0" }).pageIndex).toBe(0);
    expect(parseListSearchParams({ page: "-3" }).pageIndex).toBe(0);
  });
});

describe("serializeListSearchParams", () => {
  it("omits defaults", () => {
    expect(
      serializeListSearchParams({
        pageIndex: 0,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        q: "",
      }),
    ).toEqual({});
  });

  it("writes non-default page, pageSize, q", () => {
    expect(
      serializeListSearchParams({
        pageIndex: 1,
        pageSize: 20,
        q: "beats",
      }),
    ).toEqual({ page: "2", pageSize: "20", q: "beats" });
  });
});

describe("clamps", () => {
  it("clampListPageSize", () => {
    expect(clampListPageSize(8)).toBe(8);
    expect(clampListPageSize(99)).toBe(DEFAULT_LIST_PAGE_SIZE);
  });

  it("clampListSearchQuery truncates", () => {
    const huge = "a".repeat(LIST_SEARCH_Q_MAX + 10);
    expect(clampListSearchQuery(huge).length).toBe(LIST_SEARCH_Q_MAX);
  });
});
