import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { parseRequest } from "@/lib/material-request/sheet";
import { materialRequestCollection } from "@/lib/material-request/store";
import { resolveRequestSuppliers } from "@/lib/kitchen-suppliers/catalog";
import { loadProductCatalog } from "@/lib/kitchen-suppliers/catalog-data";
import { syncGoodsAcceptances } from "@/lib/goods-acceptance/store";

export async function GET(request: NextRequest) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(params.get("pageSize")) || 10));
  const dateKey = params.get("date")?.trim();
  const filter = dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? { dateKey } : {};

  const collection = await materialRequestCollection();
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter)
      .sort({ dateKey: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ]);

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row._id.toHexString(),
      serial: row.serial,
      dateKey: row.dateKey,
      lineCount: row.lines?.length ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
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
    const collection = await materialRequestCollection();
    const now = new Date();
    const created = await collection.insertOne({
      _id: new ObjectId(),
      ...parsed,
      lines: withSuppliers,
      createdAt: now,
      updatedAt: now,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });
    await syncGoodsAcceptances({
      requestId: created.insertedId.toHexString(),
      serial: parsed.serial,
      dateKey: parsed.dateKey,
      lines: withSuppliers,
      userId: auth.user.id,
    });
    return NextResponse.json({ id: created.insertedId.toHexString() }, { status: 201 });
  } catch (error) {
    logger.error("Material request create:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}
