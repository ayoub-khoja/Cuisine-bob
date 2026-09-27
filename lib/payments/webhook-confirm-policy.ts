/**
 * REQ-0232 — Stripe webhook should not 500/retry on non-retryable confirm failures
 * (e.g. Dashboard/CLI sessions missing app `metadata.type` → "Unknown checkout type").
 */

/** Business-logic confirm failures that will not succeed on Stripe retry. */
export function isNonRetryableCheckoutConfirmError(
  error: string | undefined,
): boolean {
  if (!error) return false;
  if (error === "Unknown checkout type") return true;
  if (error === "Invalid session id") return true;
  if (error.startsWith("Session not paid")) return true;
  if (error === "Order not found" || error === "Invoice not found") return true;
  // Default: ack other `!ok` strings too — avoid retry storms; only thrown exceptions retry.
  return true;
}

/**
 * Whether the webhook handler should throw (→ 500 → Stripe retry).
 * `!ok` business results → false (ack). Unexpected missing error with !ok → still ack.
 */
export function shouldThrowOnConfirmFailure(
  result: { ok: boolean; error?: string },
): boolean {
  if (result.ok) return false;
  return !isNonRetryableCheckoutConfirmError(result.error);
}
