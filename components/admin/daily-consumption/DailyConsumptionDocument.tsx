"use client";

import { Fragment, type CSSProperties } from "react";
import localFont from "next/font/local";
import type { ConsumptionLine, DailySheetInput, MealKey, QtyMap } from "@/lib/daily-consumption/sheet";

const amiri = localFont({
  src: "../../../lib/pdf/fonts/Amiri-Regular.ttf",
  display: "swap",
});

const PAPER_WIDTH = 1080;
const ink = "#111111";
const rule = `1px solid ${ink}`;

/** Printed rows. `keys` match names saved from the catalog. */
type PaperItem = { label: string; unit: string; keys: string[] };

const RIGHT_ITEMS: PaperItem[] = [
  { label: "اللحم البقري", unit: "كغ", keys: ["اللحم البقري", "لحم بقري"] },
  { label: "اللحم الغنمي", unit: "كغ", keys: ["اللحم الغنمي", "لحم غنمي"] },
  { label: "الدجاج", unit: "كغ", keys: ["الدجاج", "دجاج"] },
  { label: "اسكالوب", unit: "كغ", keys: ["اسكالوب"] },
  { label: "كاردون بلو", unit: "كغ", keys: ["كاردون بلو"] },
  { label: "البيض", unit: "بيضة", keys: ["البيض", "بيض"] },
  { label: "السمك", unit: "كغ", keys: ["السمك", "سمك"] },
  { label: "الليمون", unit: "وحدة", keys: ["الليمون", "ليمون"] },
  { label: "ماء 1,5", unit: "لتر", keys: ["ماء 1,5", "ماء 1.5 ل", "ماء 1.5"] },
  { label: "ماء 1/2", unit: "لتر", keys: ["ماء 1/2", "ماء 0.5"] },
  { label: "ياغورت عادي", unit: "", keys: ["ياغورت عادي", "ياغورت"] },
  { label: "ياغورت مشروب", unit: "", keys: ["ياغورت مشروب"] },
  { label: "لبن", unit: "", keys: ["لبن"] },
  { label: "جبن طوابع", unit: "", keys: ["جبن طوابع", "جبن"] },
  { label: "شكلاطة 20", unit: "غ", keys: ["شكلاطة"] },
  { label: "معجون 25", unit: "غ", keys: ["معجون"] },
  { label: "زبدة 20", unit: "غ", keys: ["زبدة"] },
  { label: "شامية 20", unit: "غ", keys: ["شامية"] },
  { label: "عصير 1/6", unit: "", keys: ["عصير"] },
  { label: "تن 2", unit: "كغ", keys: ["تن", "تونة"] },
  { label: "زيت نباتي 5", unit: "ل", keys: ["زيت نباتي"] },
  { label: "بسكويت", unit: "وحدة", keys: ["بسكويت"] },
  { label: "كايك", unit: "وحدة", keys: ["كايك", "كيك"] },
  { label: "فرينة", unit: "كغ", keys: ["فرينة"] },
  { label: "كروية", unit: "كغ", keys: ["كروية", "كروفيت"] },
  { label: "تابل", unit: "كغ", keys: ["تابل"] },
  { label: "إكليل", unit: "كغ", keys: ["إكليل", "اكليل"] },
  { label: "أرز", unit: "كغ", keys: ["أرز", "ارز"] },
];

const MIDDLE_ITEMS: PaperItem[] = [
  { label: "مقرونة فل", unit: "كغ", keys: ["مقرونة فل"] },
  { label: "مقرونة سباقي", unit: "", keys: ["مقرونة سباقي"] },
  { label: "ملح", unit: "كغ", keys: ["ملح"] },
  { label: "لوبيا", unit: "كغ", keys: ["لوبيا"] },
  { label: "كسكسي", unit: "كغ", keys: ["كسكسي"] },
  { label: "زيتون", unit: "كغ", keys: ["زيتون"] },
  { label: "هريسة", unit: "كغ", keys: ["هريسة"] },
  { label: "طماطم", unit: "كغ", keys: ["طماطم"] },
  { label: "صحن ألمنيوم", unit: "", keys: ["صحن ألمنيوم", "صحن المنيوم"] },
  { label: "شوكة بلاستيك", unit: "", keys: ["شوكة بلاستيك"] },
  { label: "ملعقة بلاستيك", unit: "", keys: ["ملعقة بلاستيك"] },
  { label: "كيس صغير", unit: "", keys: ["كيس صغير"] },
  { label: "كيس فضلات", unit: "", keys: ["كيس فضلات"] },
  { label: "ورق حراري", unit: "", keys: ["ورق حراري"] },
  { label: "شربة عصفور", unit: "", keys: ["شربة عصفور"] },
  { label: "شربة فريك", unit: "كغ", keys: ["شربة فريك"] },
  { label: "فلفل مسحوق", unit: "كغ", keys: ["فلفل مسحوق", "فلفل أحمر"] },
  { label: "رأس حانوت", unit: "كغ", keys: ["رأس حانوت", "راس حانوت"] },
  { label: "فلفل أكحل", unit: "كغ", keys: ["فلفل أكحل"] },
  { label: "صندوق مرطبات", unit: "", keys: ["صندوق مرطبات"] },
  { label: "مشروبات غازية", unit: "", keys: ["مشروبات غازية"] },
  { label: "كركم", unit: "غ", keys: ["كركم"] },
  { label: "كمون", unit: "غ", keys: ["كمون"] },
  { label: "ملسوقة", unit: "", keys: ["ملسوقة"] },
  { label: "رند جاف", unit: "", keys: ["رند جاف"] },
  { label: "حمص", unit: "", keys: ["حمص"] },
  { label: "خل", unit: "", keys: ["خل"] },
  { label: "خبز باقات", unit: "", keys: ["خبز باقات", "خبز"] },
];

const LEFT_ITEMS: PaperItem[] = [
  { label: "بسباس", unit: "", keys: ["بسباس"] },
  { label: "زعتر", unit: "", keys: ["زعتر"] },
  { label: "قرفة", unit: "", keys: ["قرفة"] },
  { label: "زبيب", unit: "", keys: ["زبيب"] },
  { label: "فلفلة", unit: "كغ", keys: ["فلفلة"] },
  { label: "غلة طمسن", unit: "كغ", keys: ["غلة طمسن", "طمسن"] },
  { label: "غلة تفاح", unit: "كغ", keys: ["غلة تفاح", "تفاح"] },
  { label: "جزر", unit: "كغ", keys: ["جزر"] },
  { label: "بصل", unit: "كغ", keys: ["بصل"] },
  { label: "كرنب", unit: "كغ", keys: ["كرنب"] },
  { label: "قارص", unit: "كغ", keys: ["قارص"] },
  { label: "قرع", unit: "كغ", keys: ["قرع"] },
  { label: "معدنوس", unit: "كغ", keys: ["معدنوس"] },
  { label: "صلق", unit: "كغ", keys: ["صلق", "سلق"] },
  { label: "لفت أحمر", unit: "", keys: ["لفت أحمر", "لفت"] },
  { label: "فقوس", unit: "كغ", keys: ["فقوس"] },
  { label: "خيار", unit: "كغ", keys: ["خيار"] },
  { label: "بطاطا", unit: "كغ", keys: ["بطاطا"] },
  { label: "سلطة خضراء", unit: "", keys: ["سلطة خضراء"] },
  { label: "طماطم خضراء", unit: "", keys: ["طماطم خضراء"] },
  { label: "فلفل أخضر", unit: "كغ", keys: ["فلفل أخضر"] },
  { label: "كلافص", unit: "كغ", keys: ["كلافص"] },
  { label: "ثوم جاف", unit: "كغ", keys: ["ثوم جاف", "ثوم"] },
  { label: "نعناع", unit: "كغ", keys: ["نعناع"] },
  { label: "منديل ورق", unit: "", keys: ["منديل ورق"] },
  { label: "ستاك", unit: "", keys: ["ستاك"] },
  { label: "رشتة", unit: "", keys: ["رشتة", "رشة"] },
  { label: "", unit: "", keys: [] },
];

const PAID_MEALS: { key: MealKey; short: string }[] = [
  { key: "ghada", short: "غداء" },
  { key: "asha", short: "عشاء" },
];

const FREE_MEALS: { key: MealKey; short: string }[] = [
  { key: "awda", short: "لم عودة" },
  { key: "laylia", short: "لم ليلية" },
  { key: "ghada", short: "غداء" },
  { key: "lamjaGhada", short: "لم غداء" },
  { key: "asha", short: "عشاء" },
  { key: "lamjaAsha", short: "لم عشاء" },
];

const MATERIAL_MEALS: { key: MealKey; short: string }[] = [
  { key: "awda", short: "لم عودة" },
  { key: "laylia", short: "لم ليلية" },
  { key: "ghada", short: "غداء" },
  { key: "asha", short: "عشاء" },
];

const PAPER_UNIT_LABELS = [
  "وحدات التدخل",
  "الضباط",
  "الأمن العمومي",
  "الحرس الوطني",
  "أعوان الرئاسة",
];

const MENU_MEALS: { key: MealKey; short: string }[] = [
  { key: "awda", short: "لم عودة" },
  { key: "ghada", short: "غداء" },
  { key: "lamjaGhada", short: "لم غداء" },
  { key: "asha", short: "عشاء" },
  { key: "lamjaAsha", short: "لم عشاء" },
  { key: "laylia", short: "لم ليلية" },
];

const cell: CSSProperties = {
  border: rule,
  padding: "1px 3px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: 1.2,
  color: ink,
  background: "#ffffff",
  fontSize: 11,
};

function norm(value: string): string {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FF]/g, "");
}

function showCount(value: number | undefined): string {
  if (value == null || value === 0) return "";
  const text = String(value);
  return text.includes(".") ? text : text.padStart(2, "0");
}

function showQty(value: number | undefined): string {
  if (value == null || value === 0) return "";
  return String(value);
}

function mealTotal(
  rows: DailySheetInput["headcounts"],
  meal: MealKey,
  side: "paid" | "free",
): number {
  return rows.reduce((total, row) => total + (row[side][meal] ?? 0), 0);
}

function assignLines(items: PaperItem[], byNorm: Map<string, ConsumptionLine>, used: Set<string>) {
  return items.map((item) => {
    for (const key of item.keys) {
      const line = byNorm.get(norm(key));
      if (!line || used.has(line.id)) continue;
      used.add(line.id);
      return line.qty;
    }
    return undefined;
  });
}

export default function DailyConsumptionDocument({ sheet }: { sheet: DailySheetInput }) {
  const byNorm = new Map(sheet.lines.map((line) => [norm(line.name), line]));
  const used = new Set<string>();
  const bands = [RIGHT_ITEMS, MIDDLE_ITEMS, LEFT_ITEMS].map((items) =>
    assignLines(items, byNorm, used),
  );
  const extras = sheet.lines.filter((line) => !used.has(line.id));
  const rowCount = RIGHT_ITEMS.length;
  const menuRows = Math.max(4, ...MENU_MEALS.map((meal) => sheet.menu[meal.key]?.length ?? 0));

  const head: CSSProperties = { ...cell, fontWeight: 700, fontSize: 12 };
  const mealHead: CSSProperties = { ...head, fontSize: 10, fontWeight: 700 };
  const nameCell: CSSProperties = {
    ...cell,
    textAlign: "right",
    fontSize: 11,
    paddingInline: 4,
  };

  return (
    <article
      dir="rtl"
      lang="ar"
      className={amiri.className}
      style={{
        width: PAPER_WIDTH,
        boxSizing: "border-box",
        background: "#ffffff",
        color: ink,
        padding: "14px 12px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, lineHeight: 1.45 }}>
        <div>
          <div>الإدارة العامة لوحدات التدخل</div>
          <div>إدارة حفظ النظام الجهوي بالشمال</div>
          <div>الفوج الجهوي لحفظ النظام بالمنستير</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>قائمة في الإستهلاك اليومي للمواد الغذائية</div>
          <div>ليوم {sheet.dateKey}</div>
        </div>
      </div>
      <div style={{ margin: "4px 0 8px", textAlign: "center", fontSize: 18, fontWeight: 700 }}>
        قسم المطعم
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...head, width: 120 }} />
            <th colSpan={PAID_MEALS.length} style={head}>
              عدد الآكلات بمقابل
            </th>
            <th colSpan={FREE_MEALS.length} style={head}>
              عدد الآكلات المجانية
            </th>
          </tr>
          <tr>
            {PAID_MEALS.map((meal) => (
              <th key={`paid-${meal.key}`} style={mealHead}>
                {meal.short}
              </th>
            ))}
            {FREE_MEALS.map((meal) => (
              <th key={`free-${meal.key}`} style={mealHead}>
                {meal.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.headcounts.map((row, index) => (
            <tr key={row.unit}>
              <td style={{ ...nameCell, fontWeight: 700 }}>
                {PAPER_UNIT_LABELS[index] ?? row.unit}
              </td>
              {PAID_MEALS.map((meal) => (
                <td key={`${row.unit}-paid-${meal.key}`} style={cell}>
                  {showCount(row.paid[meal.key])}
                </td>
              ))}
              {FREE_MEALS.map((meal) => (
                <td key={`${row.unit}-free-${meal.key}`} style={cell}>
                  {showCount(row.free[meal.key])}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td style={{ ...nameCell, fontWeight: 700 }}>المجموع</td>
            {PAID_MEALS.map((meal) => (
              <td key={`paid-total-${meal.key}`} style={{ ...cell, fontWeight: 700 }}>
                {showCount(mealTotal(sheet.headcounts, meal.key, "paid"))}
              </td>
            ))}
            {FREE_MEALS.map((meal) => (
              <td key={`free-total-${meal.key}`} style={{ ...cell, fontWeight: 700 }}>
                {showCount(mealTotal(sheet.headcounts, meal.key, "free"))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: 8 }}>
        <thead>
          <tr>
            {bands.map((_, index) => (
              <Fragment key={`band-${index}`}>
                <th rowSpan={2} style={{ ...head, width: 118 }}>
                  المواد
                </th>
                <th colSpan={MATERIAL_MEALS.length} style={head}>
                  الكمية
                </th>
              </Fragment>
            ))}
          </tr>
          <tr>
            {bands.map((_, index) =>
              MATERIAL_MEALS.map((meal) => (
                <th key={`mq-${index}-${meal.key}`} style={mealHead}>
                  {meal.short}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <tr key={`m-${rowIndex}`}>
              {bands.map((band, bandIndex) => {
                const item = [RIGHT_ITEMS, MIDDLE_ITEMS, LEFT_ITEMS][bandIndex]?.[rowIndex];
                const qty = band[rowIndex];
                return (
                  <Fragment key={`c-${bandIndex}-${rowIndex}`}>
                    <td style={nameCell}>
                      {item?.label ? (
                        <>
                          {item.unit ? <span style={{ float: "left" }}>{item.unit}</span> : null}
                          {item.label}
                        </>
                      ) : null}
                    </td>
                    {MATERIAL_MEALS.map((meal) => (
                      <td key={`${bandIndex}-${rowIndex}-${meal.key}`} style={cell}>
                        {showQty(qty?.[meal.key])}
                      </td>
                    ))}
                  </Fragment>
                );
              })}
            </tr>
          ))}
          {extras.map((line) => (
            <tr key={line.id}>
              <td style={nameCell}>
                {line.unit ? <span style={{ float: "left" }}>{line.unit}</span> : null}
                {line.name}
              </td>
              {MATERIAL_MEALS.map((meal) => (
                <td key={`${line.id}-${meal.key}`} style={cell}>
                  {showQty(line.qty[meal.key])}
                </td>
              ))}
              <td colSpan={2 + MATERIAL_MEALS.length * 2} style={cell} />
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: 8 }}>
        <thead>
          <tr>
            {MENU_MEALS.map((meal) => (
              <th key={meal.key} style={head}>
                {meal.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: menuRows }, (_, rowIndex) => (
            <tr key={`menu-${rowIndex}`}>
              {MENU_MEALS.map((meal) => (
                <td key={`${meal.key}-${rowIndex}`} style={{ ...cell, height: 22, fontSize: 12 }}>
                  {sheet.menu[meal.key]?.[rowIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
