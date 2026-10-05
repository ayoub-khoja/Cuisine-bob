"use client";

import localFont from "next/font/local";
import type { ReactNode } from "react";
import { paperDate } from "@/lib/material-request/sheet";
import {
  ACCEPTANCE_BENEFICIARY,
  ACCEPTANCE_BODY_ROWS,
  ACCEPTANCE_COMMAND,
  ACCEPTANCE_NOTE_COMMITTEE,
  ACCEPTANCE_NOTE_TOP,
  ACCEPTANCE_SIGNATORY,
  ACCEPTANCE_UNIT_LINES,
  ACCEPTANCE_VET_NOTE,
  quantityLabel,
  type AcceptanceNoteSection,
  type GoodsAcceptanceSheet,
} from "@/lib/goods-acceptance/sheet";

const amiri = localFont({
  src: "../../../lib/pdf/fonts/Amiri-Regular.ttf",
  display: "swap",
});

const PAPER_WIDTH = 794;
const border = "1px solid #111111";

const HEADERS = ["نوع البضاعة", "الكمية / الوزن بالكلغ", "الملاحظات", "الامضاء"] as const;

function PaperSides({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        direction: "ltr",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 24,
        fontSize: 16,
      }}
    >
      <div style={{ direction: "rtl", textAlign: "left" }}>{left}</div>
      <div style={{ direction: "rtl", textAlign: "right" }}>{right}</div>
    </div>
  );
}

function NoteBlock({ section }: { section: AcceptanceNoteSection }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          textDecoration: section.underline ? "underline" : undefined,
          textUnderlineOffset: 3,
        }}
      >
        * {section.label} :{section.value ? ` ${section.value}` : ""}
      </div>
      {section.items.map((item) => (
        <div key={item}>
          {item.includes("نعم") ? (
            <>
              - {item.replace("نعم", "")}
              <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>نعم</span>
            </>
          ) : (
            <>- {item}</>
          )}
        </div>
      ))}
    </div>
  );
}

function NotesCell() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontSize: 13,
        lineHeight: 1.85,
      }}
    >
      <div>
        {ACCEPTANCE_NOTE_TOP.map((section) => (
          <NoteBlock key={section.label} section={section} />
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} style={{ borderBottom: "1px dotted #222", marginInline: 10 }} />
        ))}
      </div>
      <div>
        <NoteBlock section={ACCEPTANCE_NOTE_COMMITTEE} />
        <div style={{ borderBottom: "1px dotted #222", margin: "6px 10px 0" }} />
      </div>
    </div>
  );
}

export default function GoodsAcceptanceDocument({ sheet }: { sheet: GoodsAcceptanceSheet }) {
  const rowCount = Math.max(ACCEPTANCE_BODY_ROWS, sheet.lines.length);
  const rows = Array.from({ length: rowCount }, (_, index) => sheet.lines[index] ?? null);

  return (
    <article
      dir="rtl"
      lang="ar"
      className={amiri.className}
      style={{
        width: PAPER_WIDTH,
        minHeight: 1120,
        boxSizing: "border-box",
        background: "#ffffff",
        color: "#111111",
        padding: "28px 32px 36px",
        lineHeight: 1.55,
      }}
    >
      <PaperSides
        left={<span>المنستير في: {paperDate(sheet.dateKey)}</span>}
        right={
          <div
            style={{
              display: "inline-block",
              textAlign: "center",
              borderBottom: "1px solid #111",
              paddingBottom: 2,
              lineHeight: 1.35,
            }}
          >
            {ACCEPTANCE_UNIT_LINES.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        }
      />

      <h1
        style={{
          margin: "26px 0 20px",
          textAlign: "center",
          fontSize: 32,
          fontWeight: 700,
          textDecoration: "underline",
          textUnderlineOffset: 6,
        }}
      >
        محضر قبول السلع
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        <PaperSides
          left={
            <span>
              وصل التسليم رقم:{" "}
              <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{sheet.serial}</span>
            </span>
          }
          right={<span>المنتفع: {ACCEPTANCE_BENEFICIARY}.</span>}
        />
        <PaperSides
          left={<span>بتاريخ: {paperDate(sheet.dateKey)}</span>}
          right={<span>المزود: {sheet.supplierName}</span>}
        />
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 15,
        }}
      >
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "42%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            {HEADERS.map((label) => (
              <th
                key={label}
                style={{
                  border,
                  padding: "8px 4px",
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: label === "الامضاء" ? undefined : "0.08em",
                  lineHeight: 1.35,
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((line, index) => (
            <tr key={line?.id ?? `empty-${index}`} style={{ height: 30 }}>
              <td style={{ border, padding: "2px 8px", textAlign: "right", verticalAlign: "middle" }}>
                {line?.name ?? ""}
              </td>
              <td style={{ border, padding: "2px 6px", textAlign: "center", verticalAlign: "middle" }}>
                {line ? quantityLabel(line) : ""}
              </td>
              {index === 0 ? (
                <td rowSpan={rowCount} style={{ border, padding: "8px 12px", verticalAlign: "top" }}>
                  <NotesCell />
                </td>
              ) : null}
              <td style={{ border }} />
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 13 }}>{ACCEPTANCE_VET_NOTE}</p>
      <div style={{ marginTop: 22, textAlign: "center", fontSize: 16, lineHeight: 1.85 }}>
        <div>{ACCEPTANCE_COMMAND}</div>
        <div>{ACCEPTANCE_SIGNATORY}</div>
      </div>
    </article>
  );
}
