import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";

type CookieRequest = {
  cookies: { get: (name: string) => { value: string } | undefined };
};

export async function requireKitchenUser(request: CookieRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }),
    };
  }
  if (user.role === "client" || user.role === "supplier") {
    return {
      error: NextResponse.json({ error: "غير مسموح" }, { status: 403 }),
    };
  }
  return { user };
}
