/** Free ration permit (إذن بإعاشة مجانية) — fields match the paper form. */

export const MEAL_SUGGESTIONS = [
  "عودة",
  "لمجة ليلية",
  "لمجة عشاء",
  "لمجة غداء",
  "عشاء",
  "غداء",
  "فطور",
] as const;

export type PermitLine = {
  id: string;
  count: number;
  followers: string;
  meal: string;
  mission: string;
};

export type PermitInput = {
  serial: string;
  dateKey: string;
  time: string;
  lines: PermitLine[];
};

export type PermitRecord = PermitInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PermitListItem = {
  id: string;
  serial: string;
  dateKey: string;
  time: string;
  peopleTotal: number;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
};

export function todayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function emptyLine(): PermitLine {
  return { id: crypto.randomUUID(), count: 0, followers: "", meal: "", mission: "" };
}

export function emptyPermit(): PermitInput {
  return {
    serial: "",
    dateKey: todayDateKey(),
    time: nowTime(),
    lines: [emptyLine(), emptyLine(), emptyLine()],
  };
}

export function peopleTotal(lines: PermitLine[]): number {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.count) ? line.count : 0), 0);
}

export function parsePermit(body: unknown): PermitInput | string {
  if (!body || typeof body !== "object") return "بيانات غير صالحة";
  const raw = body as Record<string, unknown>;
  const serial = typeof raw.serial === "string" ? raw.serial.trim() : "";
  const dateKey = typeof raw.dateKey === "string" ? raw.dateKey.trim() : "";
  const time = typeof raw.time === "string" ? raw.time.trim() : "";
  if (!serial || serial.length > 20) return "عدد الإذن غير صالح";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "التاريخ غير صالح";
  if (!/^\d{2}:\d{2}$/.test(time)) return "الساعة غير صالحة";
  if (!Array.isArray(raw.lines)) return "الأسطر غير صالحة";

  const lines: PermitLine[] = [];
  for (const entry of raw.lines) {
    if (!entry || typeof entry !== "object") return "سطر غير صالح";
    const row = entry as Record<string, unknown>;
    const followers = typeof row.followers === "string" ? row.followers.trim() : "";
    const meal = typeof row.meal === "string" ? row.meal.trim() : "";
    const mission = typeof row.mission === "string" ? row.mission.trim() : "";
    const countRaw = row.count;
    const count =
      countRaw == null || countRaw === ""
        ? 0
        : typeof countRaw === "number"
          ? countRaw
          : Number(countRaw);
    if (!Number.isInteger(count) || count < 0 || count > 9999) return "العدد غير صالح";
    if (!followers && !meal && !mission && count === 0) continue;
    if (followers.length > 80 || meal.length > 40 || mission.length > 80) {
      return "نص السطر طويل جداً";
    }
    const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : crypto.randomUUID();
    lines.push({ id, count, followers, meal, mission });
  }
  if (lines.length === 0) return "أضف سطراً واحداً على الأقل";
  if (lines.length > 40) return "عدد الأسطر كبير جداً";
  return { serial, dateKey, time, lines };
}
