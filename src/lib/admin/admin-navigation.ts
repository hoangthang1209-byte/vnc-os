import type { AdminPermissionFlags } from "@/components/admin/AdminPermissionsContext";

export type AdminNavStatus = "active" | "coming-soon" | "hidden";
export type AdminPermissionKey = keyof AdminPermissionFlags;

export type AdminNavigationItem = {
  label: string;
  href?: string;
  status: AdminNavStatus;
  requiredPermissions?: AdminPermissionKey[];
};

export type AdminNavigationPlatform = {
  /** Internal grouping only — empty label means no visible third-level heading. */
  label: string;
  items: AdminNavigationItem[];
  requiredPermissions?: AdminPermissionKey[];
};

export type AdminNavigationSection = {
  label: string;
  icon: string;
  platforms: AdminNavigationPlatform[];
};

/** One internal platform bucket per domain (no visible subgroup label). */
function domainItems(items: AdminNavigationItem[]): AdminNavigationPlatform[] {
  return [{ label: "", items }];
}

export const adminDashboardNavItem: AdminNavigationItem = {
  label: "Tổng quan",
  href: "/admin/dashboard",
  status: "active",
  requiredPermissions: ["canViewDashboard"],
};

/**
 * VNC OS Admin 2.0 — operations-first navigation for a multi-role production team.
 * Routes not listed remain reachable by URL / contextual links; they are not deleted.
 */
/** V9 FINAL HTML IA; only verified existing application routes are active. */
export const adminNavigationSections: AdminNavigationSection[] = [
  { label:"WORKSPACE", icon:"◫", platforms: domainItems([
    { label:"Tổng quan", href:"/admin/dashboard", status:"active", requiredPermissions:["canViewDashboard"] },
    { label:"Công việc & tự động hóa", href:"/admin/automation", status:"active", requiredPermissions:["canViewDashboard"] },
  ]) },
  { label:"SALES & CRM", icon:"⌁", platforms: domainItems([
    { label:"Lead & Inbox", href:"/admin/crm/leads", status:"active", requiredPermissions:["canViewCrm"] },
    { label:"Khách hàng", href:"/admin/crm/customers", status:"active", requiredPermissions:["canViewCrm"] },
    { label:"Báo giá", href:"/admin/quotes", status:"active", requiredPermissions:["canAccessQuotes"] },
    { label:"Tính giá", href:"/admin/pricing/costing", status:"active", requiredPermissions:["canAccessPricing"] },
  ]) },
  { label:"ORDERS & OPERATIONS", icon:"▤", platforms: domainItems([
    { label:"Đơn hàng", href:"/admin/orders", status:"active", requiredPermissions:["canViewOrders"] },
    { label:"Tạo đơn nhanh", href:"/admin/orders/new/quick", status:"active", requiredPermissions:["canCreateOrders"] },
    { label:"Dự án & Batch", href:"/admin/orders/projects", status:"active", requiredPermissions:["canManageUsers"] },
    { label:"Tiến độ sản xuất", href:"/admin/manufacturing/production-timeline", status:"active", requiredPermissions:["canViewProduction"] },
    { label:"Điều hành sản xuất", href:"/admin/production", status:"active", requiredPermissions:["canViewProduction"] },
    { label:"Giao hàng", href:"/admin/delivery", status:"active", requiredPermissions:["canViewDelivery"] },
  ]) },
  { label:"TECHNICAL & SOURCING", icon:"▧", platforms: domainItems([
    { label:"Tech Pack", href:"/admin/tech-pack", status:"active", requiredPermissions:["canViewProduction"] },
    { label:"Rập & bảng thông số", href:"/admin/pattern", status:"active", requiredPermissions:["canViewProduction"] },
    { label:"Nguyên vật liệu", href:"/admin/production-materials", status:"active", requiredPermissions:["canViewProduction"] },
    { label:"Nhà cung cấp (SRM)", href:"/admin/production-suppliers", status:"active", requiredPermissions:["canViewProduction"] },
  ]) },
  { label:"FINANCE & DOCUMENTS", icon:"◉", platforms: domainItems([
    { label:"Invoice", href:"/admin/documents/invoices", status:"active", requiredPermissions:["canViewFinancials"] },
    { label:"Giao dịch ngân hàng", href:"/admin/bank-transactions", status:"active", requiredPermissions:["canViewFinancials"] },
  ]) },
  { label:"PRODUCTS & MULTI-SITE", icon:"▣", platforms: domainItems([
    { label:"Product Catalog", href:"/admin/products", status:"active", requiredPermissions:["canManageProducts"] },
    { label:"Danh mục sản phẩm", href:"/admin/danh-muc", status:"active", requiredPermissions:["canManageProducts"] },
    { label:"Media Library", href:"/admin/media", status:"active", requiredPermissions:["canManageProducts"] },
    { label:"Trang chủ website", href:"/admin/settings/homepage", status:"active", requiredPermissions:["canManageCms"] },
    { label:"Điều hướng & Footer", href:"/admin/site-navigation", status:"active", requiredPermissions:["canManageCms"] },
    { label:"Logo khách hàng", href:"/admin/client-logos", status:"active", requiredPermissions:["canManageCms"] },
  ]) },
  { label:"CONTENT & MARKETING", icon:"◈", platforms: domainItems([
    { label:"Bài viết", href:"/admin/blog", status:"active", requiredPermissions:["canManageCms"] },
    { label:"Landing Page", href:"/admin/landing-pages", status:"active", requiredPermissions:["canManageCms"] },
    { label:"SEO & Publishing", href:"/admin/content/seo", status:"active", requiredPermissions:["canManageCms"] },
    { label:"Case Study", href:"/admin/case-studies", status:"active", requiredPermissions:["canManageCms"] },
  ]) },
  { label:"ADMINISTRATION", icon:"⚙", platforms: domainItems([
    { label:"Người dùng", href:"/admin/settings/users", status:"active", requiredPermissions:["canManageUsers"] },
    { label:"Vai trò & quyền", href:"/admin/settings/roles", status:"active", requiredPermissions:["canManageRoles"] },
    { label:"Thông tin công ty VNC", href:"/admin/settings/vnc-company", status:"active", requiredPermissions:["canViewFinancials"] },
    { label:"Thông tin website ATTD", href:"/admin/settings/company", status:"active", requiredPermissions:["canViewDashboard"] },
    { label:"Cấu hình giá", href:"/admin/pricing", status:"active", requiredPermissions:["canAccessPricing"] },
  ]) },
];

/**
 * Solo Founder Experience — enterprise Content ops hrefs stay hidden from the
 * main nav when Solo mode is on. Routes remain live by URL / command palette.
 * Lean nav already omits most of these; the filter remains for Team mode
 * compatibility if they are re-added later.
 */
export const SOLO_HIDDEN_CONTENT_HREFS: readonly string[] = [
  "/admin/content/operations",
  "/admin/content/ai",
  "/admin/content/calendar",
  "/admin/content/performance",
  "/admin/content/seo-strategies",
  "/admin/content/launch",
];

/**
 * Pure filter over the static navigation registry — never mutates
 * `adminNavigationSections`. Team mode (or `isSolo=false`) returns the
 * sections unchanged; Solo mode drops enterprise-ops Content hrefs if present.
 */
export function filterNavigationForWorkspaceMode(
  sections: AdminNavigationSection[],
  isSolo: boolean,
): AdminNavigationSection[] {
  if (!isSolo) return sections;
  return sections.map((section) => {
    if (section.label !== "CONTENT & MARKETING" && section.label !== "CONTENT & SEO" && section.label !== "NỘI DUNG") {
      return section;
    }
    return {
      ...section,
      platforms: section.platforms.map((platform) => ({
        ...platform,
        items: platform.items.filter(
          (item) => !item.href || !SOLO_HIDDEN_CONTENT_HREFS.includes(item.href),
        ),
      })),
    };
  });
}
