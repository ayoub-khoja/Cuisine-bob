import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { aggregateStock } from "@/lib/admin-log/stock";
import { materialRequestCollection } from "@/lib/material-request/store";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireKitchenUser(request);
    if ("error" in auth && auth.error) return auth.error;
    const rows = await (await materialRequestCollection())
      .find({}, { projection: { lines: 1, dateKey: 1 } })
      .toArray();
    const lines = rows.flatMap((row) =>
      (row.lines ?? []).map((line) => ({ ...line, dateKey: row.dateKey ?? "" })),
    );
    return NextResponse.json({ items: aggregateStock(lines) });
  } catch (error) {
    logger.error("Admin log stock:", error);
    return NextResponse.json({ error: "تعذر تحميل المخزون" }, { status: 500 });
  }
}
