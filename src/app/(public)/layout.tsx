import "@/styles/public-v7.css";
import "@/styles/attd-v3.css";
import ATTDV3Header from "@/components/public/v3/ATTDV3Header";
import ATTDV3Footer from "@/components/public/v3/ATTDV3Footer";
import NavigationProgress from "@/components/public/NavigationProgress";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

export const revalidate = 3600;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationSchema />
      <NavigationProgress />
      <ATTDV3Header />
      <div className="public-main public-main--v7">{children}</div>
      <ATTDV3Footer />
    </>
  );
}
