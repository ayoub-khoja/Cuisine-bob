import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { parsePermit } from "@/lib/free-ration/sheet";
import { freeRationCollection, toObjectId } from "@/lib/free-ration/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const objectId = toObjectId((await context.params).id);
  if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const row = await (await freeRationCollection()).findOne({ _id: objectId });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({
    id: row._id.toHexString(),
    serial: row.serial,
    dateKey: row.dateKey,
    time: row.time,
    lines: row.lines,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const objectId = toObjectId((await context.params).id);
    if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    const parsed = parsePermit(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }
    const updated = await (await freeRationCollection()).updateOne(
      { _id: objectId },
      {
        $set: {
          ...parsed,
          updatedAt: new Date(),
          updatedBy: auth.user.id,
        },
      },
    );
    if (updated.matchedCount === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ id: objectId.toHexString() });
  } catch (error) {
    logger.error("Free ration update:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const objectId = toObjectId((await context.params).id);
    if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    await (await freeRationCollection()).deleteOne({ _id: objectId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Free ration delete:", error);
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  }
}
