import { NextRequest, NextResponse } from "next/server";
import { requireKitchenUser } from "@/lib/daily-consumption/access";
import { loadProductCatalog } from "@/lib/kitchen-suppliers/catalog-data";

export async function GET(request: NextRequest) {
  const auth = await requireKitchenUser(request);
  if ("error" in auth && auth.error) return auth.error;
  const products = await loadProductCatalog();
  return NextResponse.json({ products });
}
