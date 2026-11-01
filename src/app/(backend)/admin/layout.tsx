// Force every admin page to render on every request so that new DB records
// always appear without a redeploy.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AdminProviders from "@/components/admin/AdminProviders";
import AdminShell from "@/components/admin/AdminShell";
import {
  ADMIN_DOCUMENT_TITLE,
  ADMIN_TITLE_TEMPLATE,
} from "@/lib/admin/admin-metadata";
import { buildPrivateNoindexMetadata } from "@/lib/seo/indexation-policy";

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl:string|null=null;
  try{
    const branding=await prisma.vncOsCompanyBranding.findUnique({where:{id:"default"},select:{faviconUrl:true}});
    faviconUrl=branding?.faviconUrl??null;
  }catch{
    // The fallback must remain VNC-branded even before the new migration is applied.
  }
  const icon=faviconUrl||"/vnc-os-icon";
  return {
    ...buildPrivateNoindexMetadata(),
    title:{default:ADMIN_DOCUMENT_TITLE,template:ADMIN_TITLE_TEMPLATE},
    manifest:null,
    icons:{icon:[{url:icon,sizes:"any"}],shortcut:icon,apple:icon},
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}