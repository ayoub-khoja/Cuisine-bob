import { describe, expect, it } from "vitest";
import {
  ORDER_SHIPPING_FIXED,
  ORDER_TAX_RATE,
  computeOrderFeesFromSubtotal,
  getOrderDiscountPercent,
} from "./order-fees";

describe("getOrderDiscountPercent", () => {
  it("returns 10% below $100", () => {
    expect(getOrderDiscountPercent(50)).toBe(10);
    expect(getOrderDiscountPercent(99.99)).toBe(10);
  });

  it("returns 20% from $100 inclusive to under $300", () => {
    expect(getOrderDiscountPercent(100)).toBe(20);
    expect(getOrderDiscountPercent(299.99)).toBe(20);
  });

  it("returns 30% from $300 inclusive to under $500", () => {
    expect(getOrderDiscountPercent(300)).toBe(30);
    expect(getOrderDiscountPercent(499.99)).toBe(30);
  });

  it("returns 50% at $500+", () => {
    expect(getOrderDiscountPercent(500)).toBe(50);
    expect(getOrderDiscountPercent(1000)).toBe(50);
  });
});

describe("computeOrderFeesFromSubtotal", () => {
  it("applies 10% tier with free shipping under $100", () => {
    const fees = computeOrderFeesFromSubtotal(50);
    expect(fees.discountPercent).toBe(10);
    expect(fees.shippingAmount).toBe(0);
    expect(fees.taxAmount).toBe(3.5);
    expect(fees.discountAmount).toBe(5);
    expect(fees.total).toBe(48.5);
    expect(fees.total).toBeGreaterThan(0);
  });

  it("applies 20% tier with fixed shipping at $100", () => {
    const fees = computeOrderFeesFromSubtotal(100);
    expect(fees.discountPercent).toBe(20);
    expect(fees.shippingAmount).toBe(ORDER_SHIPPING_FIXED);
    expect(fees.taxAmount).toBe(7);
    expect(fees.discountAmount).toBe(20);
    expect(fees.total).toBe(91.99);
  });

  it("applies 30% tier at $300", () => {
    const fees = computeOrderFeesFromSubtotal(300);
    expect(fees.discountPercent).toBe(30);
    expect(fees.shippingAmount).toBe(ORDER_SHIPPING_FIXED);
    expect(fees.taxAmount).toBe(21);
    expect(fees.discountAmount).toBe(90);
    expect(fees.total).toBe(235.99);
  });

  it("applies 50% tier at $500 with total still positive", () => {
    const fees = computeOrderFeesFromSubtotal(500);
    expect(fees.discountPercent).toBe(50);
    expect(fees.shippingAmount).toBe(ORDER_SHIPPING_FIXED);
    expect(fees.taxAmount).toBe(35);
    expect(fees.discountAmount).toBe(250);
    expect(fees.total).toBe(289.99);
    expect(fees.total).toBeGreaterThan(0);
  });

  it("uses ORDER_TAX_RATE constant", () => {
    expect(ORDER_TAX_RATE).toBe(0.07);
  });

  it("returns zeroed fees for non-positive subtotal", () => {
    const fees = computeOrderFeesFromSubtotal(0);
    expect(fees.taxAmount).toBe(0);
    expect(fees.discountAmount).toBe(0);
    expect(fees.total).toBe(0);
  });
});
