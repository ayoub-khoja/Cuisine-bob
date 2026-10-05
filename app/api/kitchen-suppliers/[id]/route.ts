import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { parseKitchenSupplier } from "@/lib/kitchen-suppliers/supplier";
import { foreignProductOwner } from "@/lib/kitchen-suppliers/catalog";
import { loadProductCatalog } from "@/lib/kitchen-suppliers/catalog-data";
import {
  duplicateKeyField,
  isDuplicateKey,
  kitchenSupplierCollection,
  toObjectId,
} from "@/lib/kitchen-suppliers/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await context.params;
  const objectId = toObjectId(id);
  if (!objectId)
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const collection = await kitchenSupplierCollection();
  const row = await collection.findOne({ _id: objectId });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  return NextResponse.json({
    id: row._id.toHexString(),
    companyName: row.companyName,
    taxId: row.taxId,
    products: row.products,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const { id } = await context.params;
    const objectId = toObjectId(id);
    if (!objectId)
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });

    const parsed = parseKitchenSupplier(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const collection = await kitchenSupplierCollection();
    const catalog = await loadProductCatalog();
    const clash = foreignProductOwner(parsed.products, catalog, id);
    if (clash) return NextResponse.json({ error: clash }, { status: 409 });

    const updated = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          companyName: parsed.companyName,
          taxId: parsed.taxId,
          products: parsed.products,
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
    if (isDuplicateKey(error)) {
      const field = duplicateKeyField(error);
      const message = field?.includes("nameKey")
        ? "هذا المنتج مسجّل لدى مزود آخر"
        : "هذا المعرف الجبائي مسجّل لمزود آخر";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    logger.error("Kitchen supplier update:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const { id } = await context.params;
    const objectId = toObjectId(id);
    if (!objectId)
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });

    const collection = await kitchenSupplierCollection();
    const removed = await collection.deleteOne({ _id: objectId });
    if (removed.deletedCount === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ id });
  } catch (error) {
    logger.error("Kitchen supplier delete:", error);
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  }
}
