/** Approved V9 Final scope: 44 views across 8 domains.
 * A candidateRoute is a discovery hint only, NOT an attestation that a view
 * exists, has working APIs, or has passed role/visual acceptance.
 * Do not auto-render sidebar links from this backlog registry.
 */
export type AdminV9View = Readonly<{
  id: string;
  title: string;
  domain: string;
  candidateRoute: string | null;
  acceptance: "not-verified";
}>;

export const ADMIN_V9_VIEW_INVENTORY: readonly AdminV9View[] = [
  // WORKSPACE (4)
  { id: "overview", title: "Tổng quan", domain: "WORKSPACE", candidateRoute: "/admin/dashboard", acceptance: "not-verified" },
  { id: "approvals", title: "Công việc & phê duyệt", domain: "WORKSPACE", candidateRoute: null, acceptance: "not-verified" },
  { id: "activity-log", title: "Nhật ký hoạt động", domain: "WORKSPACE", candidateRoute: null, acceptance: "not-verified" },
  { id: "status-conventions", title: "Quy ước trạng thái", domain: "WORKSPACE", candidateRoute: null, acceptance: "not-verified" },
  // SALES & CRM (5)
  { id: "leads", title: "Lead & Inbox", domain: "SALES & CRM", candidateRoute: "/admin/crm/leads", acceptance: "not-verified" },
  { id: "customers", title: "Khách hàng", domain: "SALES & CRM", candidateRoute: "/admin/crm/customers", acceptance: "not-verified" },
  { id: "customer-360", title: "Customer 360°", domain: "SALES & CRM", candidateRoute: null, acceptance: "not-verified" },
  { id: "quotes", title: "Báo giá", domain: "SALES & CRM", candidateRoute: "/admin/quotes", acceptance: "not-verified" },
  { id: "costing", title: "Tính giá", domain: "SALES & CRM", candidateRoute: "/admin/pricing/costing", acceptance: "not-verified" },
  // ORDERS & OPERATIONS (7)
  { id: "orders", title: "Đơn hàng", domain: "ORDERS & OPERATIONS", candidateRoute: "/admin/orders", acceptance: "not-verified" },
  { id: "order-detail", title: "Chi tiết đơn hàng", domain: "ORDERS & OPERATIONS", candidateRoute: null, acceptance: "not-verified" },
  { id: "quick-order", title: "Tạo đơn nhanh", domain: "ORDERS & OPERATIONS", candidateRoute: "/admin/orders/new/quick", acceptance: "not-verified" },
  { id: "projects", title: "Dự án & Batch", domain: "ORDERS & OPERATIONS", candidateRoute: "/admin/orders/projects", acceptance: "not-verified" },
  { id: "production", title: "Sản xuất", domain: "ORDERS & OPERATIONS", candidateRoute: "/admin/production", acceptance: "not-verified" },
  { id: "qc", title: "QC & kiểm hàng", domain: "ORDERS & OPERATIONS", candidateRoute: null, acceptance: "not-verified" },
  { id: "delivery", title: "Giao hàng", domain: "ORDERS & OPERATIONS", candidateRoute: "/admin/delivery", acceptance: "not-verified" },
  // TECHNICAL & SOURCING (6)
  { id: "tech-pack", title: "Tech Pack", domain: "TECHNICAL & SOURCING", candidateRoute: "/admin/tech-pack", acceptance: "not-verified" },
  { id: "pattern", title: "Rập & bảng thông số", domain: "TECHNICAL & SOURCING", candidateRoute: "/admin/pattern", acceptance: "not-verified" },
  { id: "materials", title: "Nguyên vật liệu", domain: "TECHNICAL & SOURCING", candidateRoute: "/admin/production-materials", acceptance: "not-verified" },
  { id: "srm", title: "Nhà cung cấp (SRM)", domain: "TECHNICAL & SOURCING", candidateRoute: "/admin/production-suppliers", acceptance: "not-verified" },
  { id: "sourcing-rfq", title: "Sourcing RFQ", domain: "TECHNICAL & SOURCING", candidateRoute: null, acceptance: "not-verified" },
  { id: "purchase-orders", title: "Mua hàng / PO", domain: "TECHNICAL & SOURCING", candidateRoute: null, acceptance: "not-verified" },
  // FINANCE & DOCUMENTS (3)
  { id: "finance", title: "Tài chính & công nợ", domain: "FINANCE & DOCUMENTS", candidateRoute: null, acceptance: "not-verified" },
  { id: "invoice", title: "Invoice", domain: "FINANCE & DOCUMENTS", candidateRoute: "/admin/documents/invoices", acceptance: "not-verified" },
  { id: "documents", title: "Chứng từ", domain: "FINANCE & DOCUMENTS", candidateRoute: null, acceptance: "not-verified" },
  // PRODUCTS & MULTI-SITE (4)
  { id: "catalog", title: "Product Catalog", domain: "PRODUCTS & MULTI-SITE", candidateRoute: "/admin/products", acceptance: "not-verified" },
  { id: "cms", title: "Multi-Site CMS", domain: "PRODUCTS & MULTI-SITE", candidateRoute: null, acceptance: "not-verified" },
  { id: "websites", title: "Quản lý website", domain: "PRODUCTS & MULTI-SITE", candidateRoute: null, acceptance: "not-verified" },
  { id: "publishing", title: "SEO & Publishing", domain: "PRODUCTS & MULTI-SITE", candidateRoute: "/admin/content/seo", acceptance: "not-verified" },
  // CONTENT & MARKETING (11)
  { id: "marketing-overview", title: "Marketing Overview", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "campaigns", title: "Chiến dịch marketing", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "editorial-calendar", title: "Lịch nội dung đa kênh", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "paid-media", title: "Paid Media & Ads", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "attribution", title: "Nguồn lead & Attribution", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "outreach", title: "Email / Zalo Outreach", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "assets", title: "Creative & Asset Library", domain: "CONTENT & MARKETING", candidateRoute: "/admin/media", acceptance: "not-verified" },
  { id: "marketing-report", title: "Marketing Report", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  { id: "articles", title: "Bài viết & Case Study", domain: "CONTENT & MARKETING", candidateRoute: "/admin/blog", acceptance: "not-verified" },
  { id: "category-nav", title: "Danh mục & điều hướng", domain: "CONTENT & MARKETING", candidateRoute: "/admin/danh-muc", acceptance: "not-verified" },
  { id: "product-publishing", title: "Product Publishing", domain: "CONTENT & MARKETING", candidateRoute: null, acceptance: "not-verified" },
  // ADMINISTRATION (4)
  { id: "users", title: "Nhân sự & tài khoản", domain: "ADMINISTRATION", candidateRoute: "/admin/settings/users", acceptance: "not-verified" },
  { id: "rbac", title: "Vai trò & phân quyền", domain: "ADMINISTRATION", candidateRoute: "/admin/settings/roles", acceptance: "not-verified" },
  { id: "settings", title: "Cấu hình chung", domain: "ADMINISTRATION", candidateRoute: null, acceptance: "not-verified" },
  { id: "agents", title: "Agent OS & Automation", domain: "ADMINISTRATION", candidateRoute: null, acceptance: "not-verified" },
];

export const ADMIN_V9_ACCEPTANCE_GATE_NAMES = [
  "visual-reference-desktop", "visual-reference-mobile",
  "authenticated-desktop", "authenticated-mobile",
  "backing-api", "rbac-role-matrix", "functional-e2e",
  "exact-head-ci", "independent-review", "verified-production",
] as const;

/** Acceptance is recorded externally, never inferred from a route hint. */
export type AdminV9AcceptanceGate = typeof ADMIN_V9_ACCEPTANCE_GATE_NAMES[number];
