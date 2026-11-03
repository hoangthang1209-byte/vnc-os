import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countMediaAssets } from "@/features/media/services/media.service";
import { countClientLogos } from "@/features/client-logos/services/client-logo.service";
import { countCaseStudies } from "@/features/case-studies/services/case-study.service";
import { getCmsHealth } from "@/features/admin/services/cms-health.service";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import CmsHealthCard from "@/components/admin/CmsHealthCard";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";
import V9ExecutiveCharts from "@/components/admin/V9ExecutiveCharts";

export const metadata = adminPageMetadata("Tổng quan");

export default async function DashboardPage() {
  const session = await getAdminSessionFromCookies();
  // The cross-organization aggregates are owner-only. Do not expose staff-wide
  // counts until every dashboard query has a validated server-side scope.
  const showExecutiveAnalytics = isOwnerLikeSession(session);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { start, end, label: `T${start.getUTCMonth() + 1}` };
  });
  const analytics = showExecutiveAnalytics
    ? await Promise.all([
        Promise.all(months.map(async ({ start, end, label }) => ({
          label,
          count: await prisma.order.count({ where: { orderDate: { gte: start, lt: end } } }),
        }))),
        prisma.lead.groupBy({ by: ["source"], _count: { _all: true }, orderBy: { _count: { source: "desc" } } }),
      ])
    : null;
  const [
    health,
    totalProducts,
    totalMedia,
    totalClientLogos,
    totalCaseStudies,
    activeProducts,
  ] = await Promise.all([
    getCmsHealth(),
    prisma.product.count(),
    countMediaAssets(),
    countClientLogos(),
    countCaseStudies(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
  ]);

  const executiveKpis = showExecutiveAnalytics
    ? await Promise.all([
        prisma.order.count({ where: { status: { in: ["NEW", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED"] } } }),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.customer.count(),
        prisma.order.count({ where: { status: "IN_PRODUCTION" } }),
      ])
    : null;

  const cmsCards = [
    {
      label: "Sản phẩm",
      value: totalProducts,
      sub: `${activeProducts} đang publish`,
      href: "/admin/products",
      action: "Quản lý sản phẩm",
    },
    {
      label: "Thư viện ảnh",
      value: totalMedia,
      sub: "Media assets",
      href: "/admin/media",
      action: "Mở thư viện",
    },
    {
      label: "Logo khách hàng",
      value: totalClientLogos,
      sub: "Client logos",
      href: "/admin/client-logos",
      action: "Quản lý logo",
    },
    {
      label: "Dự án tiêu biểu",
      value: totalCaseStudies,
      sub: "Case studies",
      href: "/admin/case-studies",
      action: "Quản lý dự án",
    },
  ];

  return (
    <>
      <AdminPageTitle title={"Tổng quan"} />
      {executiveKpis && (
        <div className="admin-crm-kpi-grid" aria-label="Chỉ số điều hành V9" style={{ marginBottom: 16 }}>
          {[
            { label: "Đơn hàng đang mở", value: executiveKpis[0], href: "/admin/orders" },
            { label: "Lead mới", value: executiveKpis[1], href: "/admin/crm/leads" },
            { label: "Khách hàng", value: executiveKpis[2], href: "/admin/crm/customers" },
            { label: "Đơn trong sản xuất", value: executiveKpis[3], href: "/admin/orders" },
          ].map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="admin-dashboard-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <span className="admin-dashboard-label">{kpi.label}</span>
              <strong className="admin-dashboard-value" style={{ display: "block", marginTop: 9 }}>{kpi.value.toLocaleString("vi-VN")}</strong>
              <span className="admin-dashboard-sub" style={{ display: "block", marginTop: 6 }}>Xem dữ liệu liên quan →</span>
            </Link>
          ))}
        </div>
      )}
      {analytics && <V9ExecutiveCharts
        months={analytics[0]}
        sources={analytics[1].map((source) => ({ label: source.source, count: source._count._all }))}
      />}
      <h2 className="admin-subtitle">Website & CMS Operations</h2>
      <div className="admin-dashboard-grid">
        <CmsHealthCard health={health} />
        {cmsCards.map((card) => (
          <div key={card.href} className="admin-dashboard-card">
            <p className="admin-dashboard-label">{card.label}</p>
            <p className="admin-dashboard-value">{card.value}</p>
            <p className="admin-dashboard-sub">{card.sub}</p>
            <Link href={card.href} className="admin-dashboard-link">
              {card.action} →
            </Link>
          </div>
        ))}
      </div>

      <div className="admin-quick-actions">
        <h2 className="admin-subtitle">Thiết lập nhanh</h2>
        <p className="admin-muted" style={{ marginTop: 0 }}>
          Liên kết nhanh tới cấu hình CMS và CRM
        </p>
        <div className="admin-quick-grid">
          <Link href="/admin/settings/company">Thông tin công ty</Link>
          <Link href="/admin/settings/trust">Chỉ số tin cậy</Link>
          <Link href="/admin/media">Tải ảnh lên</Link>
          <Link href="/admin/crm">CRM leads</Link>
        </div>
      </div>
    </>
  );
}
