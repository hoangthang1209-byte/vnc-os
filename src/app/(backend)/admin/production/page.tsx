import ProductionDashboardManager from "@/components/admin/production-planning/ProductionDashboardManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Điều hành sản xuất");

export default function ProductionDashboardPage() {
  return <ProductionDashboardManager />;
}
