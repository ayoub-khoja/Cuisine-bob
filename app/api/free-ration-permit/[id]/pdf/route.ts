import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { generateFreeRationPdf } from "@/lib/pdf/free-ration-permit";
import { freeRationCollection, toObjectId } from "@/lib/free-ration/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const objectId = toObjectId((await context.params).id);
    if (!objectId) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    const row = await (await freeRationCollection()).findOne({ _id: objectId });
    if (!row) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    const pdf = generateFreeRationPdf({
      serial: row.serial,
      dateKey: row.dateKey,
      time: row.time,
      lines: row.lines,
    });
    const download = request.nextUrl.searchParams.get("download") === "1";
    const filename = `free-ration-${row.serial}-${row.dateKey}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (error) {
    logger.error("Free ration PDF:", error);
    return NextResponse.json({ error: "تعذر إنشاء الملف" }, { status: 500 });
  }
}
