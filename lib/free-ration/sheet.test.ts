import { describe, expect, it } from "vitest";
import { parsePermit, peopleTotal } from "@/lib/free-ration/sheet";

describe("free ration permit", () => {
  it("keeps filled rows and sums the headcount", () => {
    const parsed = parsePermit({
      serial: "12",
      dateKey: "2026-01-15",
      time: "12:30",
      lines: [
        { id: "a", count: 4, followers: "أعوان", meal: "غداء", mission: "حراسة" },
        { id: "b", count: 0, followers: "", meal: "", mission: "" },
      ],
    });
    expect(typeof parsed).not.toBe("string");
    if (typeof parsed === "string") return;
    expect(parsed.lines).toHaveLength(1);
    expect(peopleTotal(parsed.lines)).toBe(4);
  });

  it("rejects a permit without any row", () => {
    expect(
      parsePermit({
        serial: "1",
        dateKey: "2026-01-15",
        time: "08:00",
        lines: [{ id: "a", count: 0, followers: "", meal: "", mission: "" }],
      }),
    ).toBe("أضف سطراً واحداً على الأقل");
  });
});
