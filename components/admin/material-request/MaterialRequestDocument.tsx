"use client";

import localFont from "next/font/local";
import { DEFAULT_SIGNATORY, paperDate, type RequestInput } from "@/lib/material-request/sheet";

const amiri = localFont({
  src: "../../../lib/pdf/fonts/Amiri-Regular.ttf",
  display: "swap",
});

const PAPER_WIDTH = 794;

export default function MaterialRequestDocument({ request }: { request: RequestInput }) {
  const lines = request.lines.length > 0 ? request.lines : [];

  return (
    <article
      dir="rtl"
      lang="ar"
      className={amiri.className}
      style={{
        width: PAPER_WIDTH,
        minHeight: 1040,
        boxSizing: "border-box",
        background: "#ffffff",
        color: "#111111",
        padding: "36px 48px 48px",
        lineHeight: 1.8,
      }}
    >
      <div style={{ textAlign: "right", fontSize: 18 }}>
        <div>الجمهورية التونسية</div>
        <div>وزارة الداخلية</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          marginTop: 36,
        }}
      >
        <div />
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          طــــلــــب مــــــواد
        </h1>
        <div style={{ justifySelf: "start", fontSize: 26, fontWeight: 700 }}>
          رقم {request.serial}
        </div>
      </div>

      <div style={{ marginTop: 28, textAlign: "right", fontSize: 18, lineHeight: 2 }}>
        <div>من طرف السيد : آمر الفوج الجهوي لحفظ النظام بالمنستير</div>
        <div>قسم الإعاشة : بفوج المنستير</div>
      </div>

      <div style={{ marginTop: 56, minHeight: 220 }}>
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 72,
              marginTop: 16,
              fontSize: 22,
            }}
          >
            <span>- {line.name}</span>
            <span>
              {line.quantity > 0 ? line.quantity : ""}
              {line.unit ? ` ${line.unit}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, textAlign: "right", fontSize: 18 }}>
        المنستير في : {paperDate(request.dateKey)}
      </div>

      <div style={{ marginTop: 64, textAlign: "left", fontSize: 18, lineHeight: 2 }}>
        <div>آمر الفوج الجهوي لحفظ النظام بالمنستير</div>
        <div>{request.signatory || DEFAULT_SIGNATORY}</div>
      </div>
    </article>
  );
}
