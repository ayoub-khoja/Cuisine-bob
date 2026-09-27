import { describe, expect, it } from "vitest";
import {
  DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE,
  assertDiscountWithinSubtotal,
  isDiscountValidationError,
} from "./order-money-validation";

describe("assertDiscountWithinSubtotal", () => {
  it("allows discount equal to subtotal", () => {
    expect(() => assertDiscountWithinSubtotal(100, 100)).not.toThrow();
  });

  it("allows discount below subtotal", () => {
    expect(() => assertDiscountWithinSubtotal(10, 99.99)).not.toThrow();
  });

  it("rejects discount above subtotal", () => {
    expect(() => assertDiscountWithinSubtotal(101, 100)).toThrow(
      DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE,
    );
  });

  it("rejects oversize discount that would zero total (PoC)", () => {
    expect(() => assertDiscountWithinSubtotal(99999, 50)).toThrow(
      DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE,
    );
  });

  it("allows zero discount", () => {
    expect(() => assertDiscountWithinSubtotal(0, 50)).not.toThrow();
  });
});

describe("isDiscountValidationError", () => {
  it("detects discount cap errors", () => {
    expect(
      isDiscountValidationError(new Error(DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE)),
    ).toBe(true);
  });

  it("rejects unrelated errors", () => {
    expect(isDiscountValidationError(new Error("Insufficient stock"))).toBe(
      false,
    );
  });
});
