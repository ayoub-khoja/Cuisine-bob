import DailyConsumptionForm from "@/components/admin/daily-consumption/DailyConsumptionForm";

export const dynamic = "force-dynamic";

export default async function EditDailyConsumptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DailyConsumptionForm sheetId={id} />;
}
