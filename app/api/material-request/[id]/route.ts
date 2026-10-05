import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { DEFAULT_SIGNATORY, parseRequest } from "@/lib/material-request/sheet";
import { materialRequestCollection, toObjectId } from "@/lib/material-request/store";
import { resolveRequestSuppliers } from "@/lib/kitchen-suppliers/catalog";
import { loadProductCatalog } from "@/lib/kitchen-suppliers/catalog-data";
import {
  deleteGoodsAcceptances,
  syncGoodsAcceptances,
} from "@/lib/goods-acceptance/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const objectId = toObjectId((await context.params).id);
  if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const row = await (await materialRequestCollection()).findOne({ _id: objectId });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({
    id: row._id.toHexString(),
    serial: row.serial,
    dateKey: row.dateKey,
    lines: row.lines,
    signatory: row.signatory || DEFAULT_SIGNATORY,
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
    const parsed = parseRequest(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }
    const withSuppliers = resolveRequestSuppliers(
      parsed.lines,
      await loadProductCatalog(),
    );
    if (typeof withSuppliers === "string") {
      return NextResponse.json({ error: withSuppliers }, { status: 400 });
    }
    const updated = await (await materialRequestCollection()).updateOne(
      { _id: objectId },
      {
        $set: {
          ...parsed,
          lines: withSuppliers,
          updatedAt: new Date(),
          updatedBy: auth.user.id,
        },
      },
    );
    if (updated.matchedCount === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    await syncGoodsAcceptances({
      requestId: objectId.toHexString(),
      serial: parsed.serial,
      dateKey: parsed.dateKey,
      lines: withSuppliers,
      userId: auth.user.id,
    });
    return NextResponse.json({ id: objectId.toHexString() });
  } catch (error) {
    logger.error("Material request update:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const objectId = toObjectId((await context.params).id);
    if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    await (await materialRequestCollection()).deleteOne({ _id: objectId });
    await deleteGoodsAcceptances(objectId.toHexString());
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Material request delete:", error);
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  }
}
