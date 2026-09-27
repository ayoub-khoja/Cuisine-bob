import { describe, expect, it } from "vitest";
import {
  isNonRetryableCheckoutConfirmError,
  shouldThrowOnConfirmFailure,
} from "./webhook-confirm-policy";

describe("isNonRetryableCheckoutConfirmError", () => {
  it("treats Unknown checkout type as non-retryable", () => {
    expect(isNonRetryableCheckoutConfirmError("Unknown checkout type")).toBe(
      true,
    );
  });

  it("treats Session not paid as non-retryable", () => {
    expect(
      isNonRetryableCheckoutConfirmError("Session not paid (unpaid)"),
    ).toBe(true);
  });

  it("returns false for empty", () => {
    expect(isNonRetryableCheckoutConfirmError(undefined)).toBe(false);
  });
});

describe("shouldThrowOnConfirmFailure", () => {
  it("does not throw when ok", () => {
    expect(shouldThrowOnConfirmFailure({ ok: true })).toBe(false);
  });

  it("does not throw on Unknown checkout type", () => {
    expect(
      shouldThrowOnConfirmFailure({
        ok: false,
        error: "Unknown checkout type",
      }),
    ).toBe(false);
  });

  it("does not throw on Order not found", () => {
    expect(
      shouldThrowOnConfirmFailure({ ok: false, error: "Order not found" }),
    ).toBe(false);
  });
});
