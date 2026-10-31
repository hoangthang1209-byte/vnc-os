import AdminPageTitle from "@/components/admin/AdminPageTitle";
import CustomInvoiceManager from "@/components/admin/documents/CustomInvoiceManager";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
export const metadata=adminPageMetadata("Custom Invoice — Yêu cầu thanh toán");
export default function CustomInvoicesPage(){
 return <><AdminPageTitle title="Custom Invoice — Yêu cầu thanh toán"/><CustomInvoiceManager/></>;
}
