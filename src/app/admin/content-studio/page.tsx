import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import MultisiteStudio from "./MultisiteStudio";

export const metadata = { title: "Multisite Content Studio | VNC OS", robots: { index: false, follow: false } };

export default async function ContentStudioPage() {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated || !can(session, "cms.manage")) redirect("/admin");
  return <MultisiteStudio />;
}
