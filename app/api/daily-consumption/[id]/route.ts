import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { parseDailySheet } from "@/lib/daily-consumption/sheet";
import {
  dailyConsumptionCollection,
  docToSheet,
  sheetFields,
  toObjectId,
} from "@/lib/daily-consumption/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await context.params;
  const objectId = toObjectId(id);
  if (!objectId) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
  const collection = await dailyConsumptionCollection();
  const row = await collection.findOne({ _id: objectId });
  if (!row) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
  return NextResponse.json(docToSheet(row));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const { id } = await context.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    const parsed = parseDailySheet(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const collection = await dailyConsumptionCollection();
    const clash = await collection.findOne(
      { dateKey: parsed.dateKey },
      { projection: { _id: 1 } },
    );
    if (clash && !clash._id.equals(objectId)) {
      return NextResponse.json(
        { error: "يوجد استهلاك يومي لهذا التاريخ" },
        { status: 409 },
      );
    }

    const updated = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          ...sheetFields(parsed),
          updatedAt: new Date(),
          updatedBy: auth.user.id,
        },
      },
    );
    if (updated.matchedCount === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ id });
  } catch (error) {
    logger.error("Daily consumption update:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const { id } = await context.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    const collection = await dailyConsumptionCollection();
    await collection.deleteOne({ _id: objectId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Daily consumption delete:", error);
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  }
}
