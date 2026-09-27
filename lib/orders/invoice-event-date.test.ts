import { describe, expect, it } from "vitest";
import { resolveInvoiceSecondaryEvent } from "./invoice-event-date";

describe("resolveInvoiceSecondaryEvent", () => {
  it("prefers paidAt when paid", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "paid",
        paidAt: "2026-06-15T00:00:00.000Z",
        dueDate: "2026-07-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-15T00:00:00.000Z", kind: "paid" });
  });

  it("uses cancelledAt when cancelled", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "cancelled",
        cancelledAt: "2026-06-01T00:00:00.000Z",
        dueDate: "2026-07-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-01T00:00:00.000Z", kind: "cancelled" });
  });

  it("uses refunded kind with paidAt", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "refunded",
        paidAt: "2026-06-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-15T00:00:00.000Z", kind: "refunded" });
  });

  it("falls back to due date for sent", () => {
    const futureDue = new Date();
    futureDue.setUTCDate(futureDue.getUTCDate() + 30);
    const dueDate = futureDue.toISOString();
    expect(
      resolveInvoiceSecondaryEvent({
        status: "sent",
        sentAt: "2026-07-15T00:00:00.000Z",
        dueDate,
      }),
    ).toMatchObject({ kind: "due", date: dueDate });
  });
});
