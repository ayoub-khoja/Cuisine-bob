import { PageSectionHeader } from "@/components/shared/PageSectionHeader";

/** Empty shell for the new Arabic admin menus until each screen is built. */
export default function AdminMenuPlaceholder({ title }: { title: string }) {
  return (
    <div dir="rtl" lang="ar" className="p-4 sm:p-6">
      <PageSectionHeader title={title} className="text-right" />
    </div>
  );
}
