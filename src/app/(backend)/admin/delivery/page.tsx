import ProductionModuleNav from "@/components/admin/operations-v9/ProductionModuleNav";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import DeliveryBoardManager from "@/components/admin/operations/DeliveryBoardManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Giao hàng");

export default function DeliveryBoardPage() {
  return (
    <>
      <ProductionModuleNav />
      <AdminPageTitle title={"Vận hành giao hàng"} />
      <DeliveryBoardManager />
    </>
  );
}
