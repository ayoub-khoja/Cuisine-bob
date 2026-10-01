"use client";

import localFont from "next/font/local";
import type { PermitInput, PermitLine } from "@/lib/free-ration/sheet";
import { peopleTotal } from "@/lib/free-ration/sheet";

const amiri = localFont({
  src: "../../../lib/pdf/fonts/Amiri-Regular.ttf",
  display: "swap",
});

const PAPER_WIDTH = 794;

function rowsFor(lines: PermitLine[]): Array<PermitLine | null> {
  const blanks = Math.max(0, 8 - lines.length);
  return [...lines, ...Array.from({ length: blanks }, () => null)];
}

function FieldLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span style={{ display: "flex", alignItems: "flex-end", gap: 6, minWidth: 0 }}>
      <span style={{ flex: "0 0 auto" }}>{label}</span>
      <span
        style={{
          flex: "1 1 auto",
          minHeight: 22,
          borderBottom: "1px dotted #64748b",
          padding: "0 6px",
        }}
      >
        {value}
      </span>
    </span>
  );
}

export default function FreeRationPermitDocument({ permit }: { permit: PermitInput }) {
  const total = peopleTotal(permit.lines);

  return (
    <article
      dir="rtl"
      lang="ar"
      className={amiri.className}
      style={{
        width: PAPER_WIDTH,
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "#ffffff",
        color: "#0f172a",
        padding: "28px 36px 40px",
        lineHeight: 1.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            border: "1px solid #cbd5e1",
            padding: "6px 22px",
            fontSize: 18,
          }}
        >
          قسم المطعم
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 18, textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            color: "#1d4ed8",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          إذن بإعاشة مجانية
        </h1>
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 8,
            color: "#dc2626",
            textAlign: "center",
            minWidth: 72,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>عدد</div>
          <div
            style={{
              marginTop: 2,
              borderBottom: "1px solid #dc2626",
              color: "#b91c1c",
              fontSize: 18,
              minHeight: 26,
            }}
          >
            {permit.serial}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          marginTop: 28,
          fontSize: 18,
        }}
      >
        <span>
          ليوم :
          <span
            style={{
              display: "inline-block",
              minWidth: 140,
              marginInlineStart: 8,
              borderBottom: "1px solid #94a3b8",
              textAlign: "center",
            }}
          >
            {permit.dateKey}
          </span>
        </span>
        <span>
          الساعة :
          <span
            style={{
              display: "inline-block",
              minWidth: 90,
              marginInlineStart: 8,
              borderBottom: "1px solid #94a3b8",
              textAlign: "center",
            }}
          >
            {permit.time}
          </span>
        </span>
      </div>

      <p style={{ margin: "28px 0 8px", textAlign: "center", fontSize: 18 }}>
        يأذن آمر الفوج الجهوي لحفظ النظام بالمنستير بإعاشة
      </p>

      <div style={{ marginTop: 18 }}>
        {rowsFor(permit.lines).map((line, index) => (
          <div
            key={line?.id ?? `blank-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "132px 1fr 1fr 1.15fr",
              alignItems: "end",
              gap: 10,
              borderBottom: "1px dotted #94a3b8",
              padding: "7px 0",
              fontSize: 16,
            }}
          >
            <span>
              عدد ({" "}
              <span style={{ display: "inline-block", minWidth: 28, textAlign: "center" }}>
                {line && line.count > 0 ? line.count : ""}
              </span>
              )
            </span>
            <FieldLine label="تابعين :" value={line?.followers ?? ""} />
            <FieldLine label="بوجبة :" value={line?.meal ?? ""} />
            <FieldLine label="المهمة :" value={line?.mission ?? ""} />
          </div>
        ))}
      </div>

      <p style={{ margin: "18px 0 0", color: "#1d4ed8", fontSize: 18, fontWeight: 700 }}>
        المجموع : {total}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 48,
          fontSize: 16,
        }}
      >
        <div>
          <p style={{ margin: 0 }}>تأشيرة مقتصد المطعم</p>
          <p style={{ margin: "28px 0 0" }}>النقيب / البشير عمامة</p>
        </div>
        <p style={{ margin: 0 }}>آمر الفوج الجهوي لحفظ النظام بالمنستير</p>
      </div>
    </article>
  );
}
