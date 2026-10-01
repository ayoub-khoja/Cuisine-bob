import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { parseDailySheet, sheetTotals, type HeadcountRow } from "@/lib/daily-consumption/sheet";
import { ObjectId } from "mongodb";
import {
  dailyConsumptionCollection,
  sheetFields,
} from "@/lib/daily-consumption/store";

export async function GET(request: NextRequest) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(params.get("pageSize")) || 10));
  const dateKey = params.get("date")?.trim();
  const filter =
    dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? { dateKey } : {};

  const collection = await dailyConsumptionCollection();
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter)
      .sort({ dateKey: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ]);

  return NextResponse.json({
    items: rows.map((row) => {
      const totals = sheetTotals(
        Array.isArray(row.headcounts) ? (row.headcounts as HeadcountRow[]) : [],
      );
      return {
        id: row._id.toHexString(),
        dateKey: row.dateKey,
        paidTotal: totals.paid,
        freeTotal: totals.free,
        lineCount: Array.isArray(row.lines) ? row.lines.length : 0,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),
    total,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;

    const parsed = parseDailySheet(await request.json());
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const collection = await dailyConsumptionCollection();
    const existing = await collection.findOne(
      { dateKey: parsed.dateKey },
      { projection: { _id: 1 } },
    );
    if (existing) {
      return NextResponse.json(
        { error: "يوجد استهلاك يومي لهذا التاريخ" },
        { status: 409 },
      );
    }

    const now = new Date();
    const created = await collection.insertOne({
      _id: new ObjectId(),
      ...sheetFields(parsed),
      createdAt: now,
      updatedAt: now,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ id: created.insertedId.toHexString() }, { status: 201 });
  } catch (error) {
    logger.error("Daily consumption create:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}
