import { describe, expect, it } from "vitest";
import { parseRequest } from "@/lib/material-request/sheet";

describe("material request", () => {
  it("keeps filled rows", () => {
    const parsed = parseRequest({
      serial: "165",
      dateKey: "2026-04-10",
      lines: [
        { id: "a", name: "بلاتو ألمنيوم", quantity: 5000, unit: "بلاتو" },
        { id: "b", name: "", quantity: 0, unit: "" },
      ],
    });
    expect(typeof parsed).not.toBe("string");
    if (typeof parsed === "string") return;
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0]?.name).toBe("بلاتو ألمنيوم");
    expect(parsed.signatory).toBe("العميد / وجدي اليعقوبي");
  });

  it("keeps a custom signature", () => {
    const parsed = parseRequest({
      serial: "55",
      dateKey: "2026-10-02",
      signatory: "العقيد / علي بن سالم",
      lines: [{ id: "a", name: "سكر", quantity: 2, unit: "كلغ" }],
    });
    expect(typeof parsed).not.toBe("string");
    if (typeof parsed === "string") return;
    expect(parsed.signatory).toBe("العقيد / علي بن سالم");
  });

  it("rejects a request without any row", () => {
    expect(
      parseRequest({
        serial: "1",
        dateKey: "2026-04-10",
        lines: [{ id: "a", name: "", quantity: 0, unit: "" }],
      }),
    ).toBe("أضف مادة واحدة على الأقل");
  });
});
