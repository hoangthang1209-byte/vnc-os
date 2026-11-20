import ProductionModuleNav from "@/components/admin/operations-v9/ProductionModuleNav";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import ItemProductionTimelineManager from "@/components/admin/item-production/ItemProductionTimelineManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Tiến độ sản xuất");

export default function ItemProductionTimelinePage() {
  return (
    <>
      <ProductionModuleNav />
      <AdminPageTitle title="Tiến độ sản xuất" />
      <ItemProductionTimelineManager />
    </>
  );
}
