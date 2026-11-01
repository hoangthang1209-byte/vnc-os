import AdminPageTitle from "@/components/admin/AdminPageTitle";
import VncCompanySettingsWorkspace from "@/components/admin/settings/VncCompanySettingsWorkspace";
import { prisma } from "@/lib/prisma";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
export const dynamic="force-dynamic";
export const metadata=adminPageMetadata("Cấu hình công ty VNC");
export default async function VncCompanySettingsPage() {
 let initial:{logoUrl:string|null;faviconUrl:string|null}={logoUrl:null,faviconUrl:null};
 let ready=true;
 try {
  const record=await prisma.vncOsCompanyBranding.findUnique({where:{id:"default"}});
  if(record)initial={logoUrl:record.logoUrl,faviconUrl:record.faviconUrl};
 }catch{ready=false;}
 return <>
  <AdminPageTitle title="Cấu hình chung — Công ty VNC"/>
  {!ready&&<p className="admin-message admin-message--error">Chưa có migration VNC OS Branding. Cần chạy Prisma migrate deploy sau khi kiểm tra Production database.</p>}
  {ready&&<VncCompanySettingsWorkspace initial={initial}/> }
 </>;
}
