import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Multi-Site Content Studio | VNC OS", robots: { index: false, follow: false } };

type Site = "attd.vn" | "vietnamclothing.vn";
const siteData: Record<Site, { label: string; focus: string; tone: string }> = {
  "attd.vn": { label: "ATTD.vn", focus: "Blank Apparel · Uniforms · B2B Supply", tone: "#bd2739" },
  "vietnamclothing.vn": { label: "VietnamClothing.vn", focus: "Merchandise · OEM/ODM · Sourcing", tone: "#155e51" },
};
const modules = [
  { title: "Pages & Landing", detail: "Homepage, hero, CTA, landing pages and revisions", stage: "Draft API on #255" },
  { title: "Products & Catalog", detail: "Categories, product variants, MOQ and bilingual descriptions", stage: "Database integration pending" },
  { title: "Blog & Articles", detail: "Editorial content, categories, translations and SEO", stage: "Database integration pending" },
  { title: "Media Library", detail: "Image upload, usage rights, alt text and galleries", stage: "Storage/RBAC pending" },
  { title: "SEO & Navigation", detail: "Canonical, redirect, sitemap, menu and footer", stage: "Integration pending" },
  { title: "Publishing", detail: "Draft → Review → Preview → Publish and rollback", stage: "Locked until safety tests" },
];
export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) redirect("/admin/login");
  if (!can(session, "cms.manage")) redirect("/admin");
  const params = await searchParams;
  const selected: Site = params.site === "attd.vn" ? "attd.vn" : "vietnamclothing.vn";
  const current = siteData[selected];
  return (
    <main style={{ padding: "24px clamp(16px,3vw,40px)", background: "#f7f9fb", color: "#142b35", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: ".12em", fontWeight: 750, color: "#697780" }}>VNC OS / CONTENT STUDIO</p>
        <h1 style={{ fontSize: "clamp(26px,3vw,36px)", margin: "10px 0 6px" }}>Multi-Site Content Studio</h1>
        <p style={{ margin: "0 0 20px", color: "#61717a", maxWidth: 760 }}>One Admin for two independent brands. This is an access-controlled module overview; editing and publishing are not enabled until database and site-scoped permission gates pass.</p>
        <section aria-label="Select website" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
          {(Object.keys(siteData) as Site[]).map(site => (
            <Link key={site} href={"/admin/content-studio?site=" + encodeURIComponent(site)} style={{ display: "block", textDecoration: "none", fontWeight: 750, padding: "13px 18px", borderRadius: 12, border: site === selected ? "2px solid " + siteData[site].tone : "1px solid #d8e0e5", background: site === selected ? "#fff" : "#eff2f5", color: "#21333e" }} aria-current={site === selected ? "page" : undefined}>{siteData[site].label}</Link>
          ))}
        </section>
        <section style={{ background: "#fff", border: "1px solid #dde5e9", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <p style={{ color: current.tone, margin: "0 0 5px", fontSize: 13, fontWeight: 800 }}>ACTIVE WEBSITE</p>
          <h2 style={{ margin: "0 0 6px", fontSize: 24 }}>{current.label}</h2>
          <p style={{ margin: 0, color: "#61717a" }}>{current.focus} · Vietnamese / English</p>
          <p style={{ fontSize: 13, color: "#7a4c13", background: "#fff8e8", padding: "11px 14px", borderRadius: 9, marginBottom: 0 }}>Safe rollout mode: no database writes, imports, customer data changes, or public publishing from this page.</p>
        </section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
          {modules.map(module => (
            <section key={module.title} style={{ background: "#fff", border: "1px solid #dce5e9", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>{module.title}</h3>
              <p style={{ fontSize: 13, color: "#637681", minHeight: 44 }}>{module.detail}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#835c20", marginBottom: 0 }}>● {module.stage}</p>
            </section>
          ))}
        </div>
        <p style={{ marginTop: 22, color: "#75838c", fontSize: 12 }}>Website boundaries are determined by server-side authorization. The site selector here does not grant access to underlying records.</p>
      </div>
    </main>
  );
}
