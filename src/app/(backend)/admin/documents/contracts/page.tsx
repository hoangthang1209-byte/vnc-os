import AdminPageTitle from "@/components/admin/AdminPageTitle";
import ContractManager from "@/components/admin/documents/ContractManager";
import {adminPageMetadata} from "@/lib/admin/admin-metadata";
export const metadata=adminPageMetadata("Contracts — Hợp đồng thương mại");
export default function ContractsPage(){
 return <><AdminPageTitle title="Contracts — Hợp đồng thương mại"/><ContractManager/></>;
}
