import ProductionModuleNav from "@/components/admin/operations-v9/ProductionModuleNav";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import TechPackListManager from "@/components/admin/tech-pack/TechPackListManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Tech Pack");

export default function TechPackListPage() {
  return (
    <>
      <ProductionModuleNav />
      <AdminPageTitle title="Tech Pack" />
      <TechPackListManager />
    </>
  );
}
