/**
 * REQ-0233 — Server-side order money guards (do not trust client discount).
 */

export const DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE =
  "Discount cannot exceed order subtotal" as const;

/**
 * Reject client-supplied discount greater than computed line subtotal.
 * Uses cents to avoid float edge cases on currency math.
 */
export function assertDiscountWithinSubtotal(
  discount: number,
  subtotal: number,
): void {
  const discountCents = Math.round(Number(discount) * 100);
  const subtotalCents = Math.round(Number(subtotal) * 100);
  if (
    !Number.isFinite(discountCents) ||
    !Number.isFinite(subtotalCents) ||
    discountCents < 0
  ) {
    throw new Error("Invalid discount amount");
  }
  if (discountCents > subtotalCents) {
    throw new Error(DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE);
  }
}

export function isDiscountValidationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === DISCOUNT_EXCEEDS_SUBTOTAL_MESSAGE ||
      error.message === "Invalid discount amount")
  );
}
