import "@/styles/public-v7.css";
import "@/styles/attd-vnc-catalog.css";
import { ATTDVncHeader, ATTDVncFooter, ATTDVncPageFrame } from "@/components/public/vnc/ATTDVncShell";
import NavigationProgress from "@/components/public/NavigationProgress";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
export const revalidate = 3600;
export default function PublicLayout({children}:{children:React.ReactNode}){
 return <ATTDVncPageFrame><OrganizationSchema/><NavigationProgress/><ATTDVncHeader/><div className="public-main public-main--v7">{children}</div><ATTDVncFooter/></ATTDVncPageFrame>;
}
