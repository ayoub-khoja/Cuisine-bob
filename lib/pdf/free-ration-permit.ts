import { readFileSync } from "node:fs";
import path from "node:path";
import { jsPDF } from "jspdf";
import { toPdfArabic } from "@/lib/pdf/arabic-text";
import { peopleTotal, type PermitInput } from "@/lib/free-ration/sheet";

let amiriBase64: string | null = null;

function loadAmiri(): string {
  if (!amiriBase64) {
    amiriBase64 = readFileSync(
      path.join(process.cwd(), "lib/pdf/fonts/Amiri-Regular.ttf"),
    ).toString("base64");
  }
  return amiriBase64;
}

function useAmiri(doc: jsPDF) {
  doc.addFileToVFS("Amiri-Regular.ttf", loadAmiri());
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");
}

export function generateFreeRationPdf(permit: PermitInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  useAmiri(doc);
  const right = 195;
  let y = 18;

  const write = (text: string, size = 12, color: [number, number, number] = [15, 23, 42]) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(toPdfArabic(text), right, y, { align: "right" });
    y += size * 0.55 + 3;
  };

  write("الإدارة العامة لوحدات التدخل", 11, [71, 85, 105]);
  write("إدارة حفظ النظام الجهوي بالشمال", 11, [71, 85, 105]);
  write("الفوج الجهوي لحفظ النظام بالمنستير", 11, [71, 85, 105]);
  write("قسم المطعم", 12, [30, 64, 175]);
  y += 2;
  write("إذن بإعاشة مجانية", 20, [30, 64, 175]);
  write(`عدد : ${permit.serial}`, 14, [190, 18, 60]);
  y += 1;
  write(`ليوم : ${permit.dateKey}          الساعة : ${permit.time}`, 12);
  y += 2;
  write("يأذن آمر الفوج الجهوي لحفظ النظام بالمنستير بإعاشة", 12);
  y += 2;

  permit.lines.forEach((line, index) => {
    if (y > 250) {
      doc.addPage();
      useAmiri(doc);
      y = 18;
    }
    write(
      `${index + 1}. عدد ( ${line.count} ) تابعين : ${line.followers || "—"} بوجبة : ${line.meal || "—"} المهمة : ${line.mission || "—"}`,
      12,
    );
  });

  y += 2;
  write(`المجموع : ${peopleTotal(permit.lines)}`, 13, [30, 64, 175]);

  y = Math.max(y + 16, 250);
  write("تأشيرة مقتصد المطعم", 11, [71, 85, 105]);
  write("النقيب / البشير عمامة", 11, [71, 85, 105]);
  write("آمر الفوج الجهوي لحفظ النظام بالمنستير", 11, [71, 85, 105]);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
