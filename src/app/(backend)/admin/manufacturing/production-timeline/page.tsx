import AdminPageTitle from "@/components/admin/AdminPageTitle";
import ItemProductionTimelineManager from "@/components/admin/item-production/ItemProductionTimelineManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Lịch & tiến độ");

export default function ItemProductionTimelinePage() {
  return (
    <>
      <AdminPageTitle title="Lịch & tiến độ" />
      <ItemProductionTimelineManager />
    </>
  );
}
