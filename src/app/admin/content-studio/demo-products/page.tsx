import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import DemoCatalogEditor from "./DemoCatalogEditor";

export const metadata = { title: "VNC Demo Product Drafts | Content Studio", robots: { index: false, follow: false } };

export default async function DemoProductsAdminPage() {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated || !can(session, "cms.manage")) redirect("/admin");
  return <DemoCatalogEditor />;
}
