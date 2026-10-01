import { describe, expect, it } from "vitest";
import { toPdfArabic } from "@/lib/pdf/arabic-text";

describe("pdf arabic text", () => {
  it("reshapes Arabic into presentation forms", () => {
    const visual = toPdfArabic("إذن");
    expect(visual).not.toBe("إذن");
    expect(visual.length).toBeGreaterThan(0);
  });
});
