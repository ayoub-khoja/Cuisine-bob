/**
 * REQ-0236 — Canonical order fee policy (UI + server).
 * Client must not supply tax/shipping/discount; both OrderDialog and createOrder
 * call computeOrderFeesFromSubtotal after subtotal is known.
 */

/** Tax: 7% of subtotal */
export const ORDER_TAX_RATE = 0.07;

/** Shipping: fixed $4.99 except free on the 10% (&lt; $100) discount tier */
export const ORDER_SHIPPING_FIXED = 4.99;

/**
 * Discount percent by subtotal tiers:
 * &lt; $100 → 10%, $100–$300 → 20%, $300–$500 → 30%, $500+ → 50%
 */
export function getOrderDiscountPercent(subtotal: number): number {
  if (subtotal < 100) return 10;
  if (subtotal < 300) return 20;
  if (subtotal < 500) return 30;
  return 50;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export type OrderFeesFromSubtotal = {
  taxAmount: number;
  shippingAmount: number;
  discountPercent: number;
  discountAmount: number;
  /** subtotal + tax + shipping − discount */
  total: number;
};

/**
 * Compute tax, shipping, and discount from server/UI subtotal.
 * Cent-safe rounding; total &gt; 0 whenever subtotal &gt; 0 under these tiers.
 */
export function computeOrderFeesFromSubtotal(
  subtotal: number,
): OrderFeesFromSubtotal {
  const safeSubtotal = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  const discountPercent = getOrderDiscountPercent(safeSubtotal);
  const taxAmount = roundMoney(safeSubtotal * ORDER_TAX_RATE);
  const discountAmount = roundMoney(safeSubtotal * (discountPercent / 100));
  const shippingAmount =
    discountPercent === 10 ? 0 : roundMoney(ORDER_SHIPPING_FIXED);
  const total = roundMoney(
    safeSubtotal + taxAmount + shippingAmount - discountAmount,
  );
  return {
    taxAmount,
    shippingAmount,
    discountPercent,
    discountAmount,
    total,
  };
}
