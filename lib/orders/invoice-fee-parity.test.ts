import { describe, expect, it } from "vitest";
import { computeOrderFeesFromSubtotal } from "@/lib/orders/order-fees";

/**
 * Invoice create must use order money (same fee policy as REQ-0236).
 * This documents the expected amounts that createInvoice copies from the order row.
 */
describe("invoice fee parity with order fees", () => {
  it("matches computeOrderFeesFromSubtotal for a mid-tier subtotal", () => {
    const subtotal = 200;
    const fees = computeOrderFeesFromSubtotal(subtotal);
    expect(fees.taxAmount).toBe(14);
    expect(fees.shippingAmount).toBe(4.99);
    expect(fees.discountPercent).toBe(20);
    expect(fees.discountAmount).toBe(40);
    expect(fees.total).toBe(178.99);
  });

  it("free shipping on 10% discount tier", () => {
    const fees = computeOrderFeesFromSubtotal(50);
    expect(fees.discountPercent).toBe(10);
    expect(fees.shippingAmount).toBe(0);
  });
});
