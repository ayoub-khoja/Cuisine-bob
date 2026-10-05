import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { goodsAcceptanceCollection } from "@/lib/goods-acceptance/store";

type AcceptanceListRow = {
  _id: ObjectId;
  requestId: string;
  serial: string;
  dateKey: string;
  supplierName: string;
  lineCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(params.get("pageSize")) || 10));
  const dateKey = params.get("date")?.trim();
  const filter = dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? { dateKey } : {};

  const collection = await goodsAcceptanceCollection();
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .aggregate<AcceptanceListRow>([
        { $match: filter },
        { $sort: { dateKey: -1, createdAt: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
          $project: {
            requestId: 1,
            serial: 1,
            dateKey: 1,
            supplierName: 1,
            lineCount: { $size: { $ifNull: ["$lines", []] } },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray(),
  ]);

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row._id.toHexString(),
      requestId: row.requestId,
      serial: row.serial,
      dateKey: row.dateKey,
      supplierName: row.supplierName,
      lineCount: row.lineCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  });
}
