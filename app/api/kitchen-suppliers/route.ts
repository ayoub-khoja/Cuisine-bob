import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import {
  parseKitchenSupplier,
  toListItem,
} from "@/lib/kitchen-suppliers/supplier";
import {
  isDuplicateKey,
  kitchenSupplierCollection,
  supplierSearchFilter,
  duplicateKeyField,
} from "@/lib/kitchen-suppliers/store";
import {
  foreignProductOwner,
} from "@/lib/kitchen-suppliers/catalog";
import { loadProductCatalog } from "@/lib/kitchen-suppliers/catalog-data";

export async function GET(request: NextRequest) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(
    50,
    Math.max(5, Number(params.get("pageSize")) || 10),
  );
  const filter = supplierSearchFilter(params.get("q") ?? "");

  const collection = await kitchenSupplierCollection();
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter, {
        projection: {
          companyName: 1,
          taxId: 1,
          products: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ]);

  return NextResponse.json({
    items: rows.map((row) =>
      toListItem({
        id: row._id.toHexString(),
        companyName: row.companyName,
        taxId: row.taxId,
        products: Array.isArray(row.products) ? row.products : [],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    ),
    total,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;

    const parsed = parseKitchenSupplier(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const collection = await kitchenSupplierCollection();
    const catalog = await loadProductCatalog();
    const clash = foreignProductOwner(parsed.products, catalog);
    if (clash) return NextResponse.json({ error: clash }, { status: 409 });

    const now = new Date();
    const created = await collection.insertOne({
      _id: new ObjectId(),
      companyName: parsed.companyName,
      taxId: parsed.taxId,
      products: parsed.products,
      createdAt: now,
      updatedAt: now,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });

    return NextResponse.json(
      { id: created.insertedId.toHexString() },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKey(error)) {
      const field = duplicateKeyField(error);
      const message = field?.includes("nameKey")
        ? "هذا المنتج مسجّل لدى مزود آخر"
        : "هذا المعرف الجبائي مسجّل لمزود آخر";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    logger.error("Kitchen supplier create:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}
