import Link from "next/link";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { ProductionMasterListClient } from "@/components/admin/production-master/ProductionMasterClientManagers";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Nhà cung cấp");

export default function ProductionSuppliersPage() {
  return (
    <>
      <AdminPageTitle title="Nhà cung cấp" />
      <div className="mb-4"><Link href="/admin/supplier-srm" className="inline-block rounded border px-4 py-2 text-sm font-medium">Quản lý RFQ & Supplier Scorecard</Link></div>
      <ProductionMasterListClient kind="supplier" />
    </>
  );
}
