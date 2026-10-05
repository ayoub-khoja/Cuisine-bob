import { NextRequest, NextResponse } from "next/server";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { docToSheet, goodsAcceptanceCollection, toObjectId } from "@/lib/goods-acceptance/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const objectId = toObjectId((await context.params).id);
  if (!objectId) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const row = await (await goodsAcceptanceCollection()).findOne({ _id: objectId });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(docToSheet(row));
}
