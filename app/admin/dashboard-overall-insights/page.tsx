import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import KitchenOverview from "@/components/admin/kitchen-overview/KitchenOverview";

/** Restaurant overview under the banner (REQ-0242). */
export const dynamic = "force-dynamic";

export default async function StoreDashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const initialStats = await getDashboardForAdmin(user.id);

  return <KitchenOverview initialStats={initialStats} />;
}
