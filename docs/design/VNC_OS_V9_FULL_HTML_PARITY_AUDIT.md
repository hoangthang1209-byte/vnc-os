# VNC OS Admin V9 — FULL HTML Design-to-Production Audit

**Owner acceptance condition:** Production must match the **entire** approved V9 HTML, not only screenshot excerpts, not just a new sidebar and tabs. Source: `VNC_OS_Admin_UX_V9_FINAL.html`; SHA256 `8d3722dd2b2a8684a73d110a2c194e5972a8d5f2744e3cb1de1271dda7322e4c`. This design has **44 navigation views across 8 areas**, plus cross-cutting V8/V9 interactions.

**Finding (2026-11-04):** #346 is only a foundation. The former Customer Detail was a legacy form with a tab bar appended; this is not visual or information-architecture parity. Do not mark V9 delivered because CI/Preview is green.

## Screen inventory — all 44 views are in scope

### WORKSPACE (4)
- [ ] 01. Tổng quan
- [ ] 02. Công việc & phê duyệt
- [ ] 03. Nhật ký hoạt động
- [ ] 04. Quy ước trạng thái

### SALES & CRM (5)
- [ ] 01. Lead & Inbox
- [ ] 02. Khách hàng
- [ ] 03. Customer 360°
- [ ] 04. Báo giá
- [ ] 05. Tính giá

### ORDERS & OPERATIONS (7)
- [ ] 01. Đơn hàng
- [ ] 02. Chi tiết đơn hàng
- [ ] 03. Tạo đơn nhanh
- [ ] 04. Dự án & Batch
- [ ] 05. Sản xuất
- [ ] 06. QC & kiểm hàng
- [ ] 07. Giao hàng

### TECHNICAL & SOURCING (6)
- [ ] 01. Tech Pack
- [ ] 02. Rập & bảng thông số
- [ ] 03. Nguyên vật liệu
- [ ] 04. Nhà cung cấp (SRM)
- [ ] 05. Sourcing RFQ
- [ ] 06. Mua hàng / PO

### FINANCE & DOCUMENTS (3)
- [ ] 01. Tài chính & công nợ
- [ ] 02. Invoice
- [ ] 03. Chứng từ

### PRODUCTS & MULTI-SITE (4)
- [ ] 01. Product Catalog
- [ ] 02. Multi-Site CMS
- [ ] 03. Quản lý website
- [ ] 04. SEO & Publishing

### CONTENT & MARKETING (11)
- [ ] 01. Marketing Overview
- [ ] 02. Chiến dịch marketing
- [ ] 03. Lịch nội dung đa kênh
- [ ] 04. Paid Media & Ads
- [ ] 05. Nguồn lead & Attribution
- [ ] 06. Email / Zalo Outreach
- [ ] 07. Creative & Asset Library
- [ ] 08. Marketing Report
- [ ] 09. Bài viết & Case Study
- [ ] 10. Danh mục & điều hướng
- [ ] 11. Product Publishing

### ADMINISTRATION (4)
- [ ] 01. Nhân sự & tài khoản
- [ ] 02. Vai trò & phân quyền
- [ ] 03. Cấu hình chung
- [ ] 04. Agent OS & Automation

## Global V9 patterns requiring code parity

- [ ] Collapsible navy left rail, active state, full menu grouping, page toolbar, breadcrumb, quick create, global command palette.
- [ ] Page density modes and table/list variants, sorting/filtering/search, keyboard navigation, batch actions, pagination, empty/error/loading states.
- [ ] KPI panels, graphs, status chips, timeline, cross-module record inspector; **all values from real authorized APIs**.
- [ ] Connected Records: relationships between **individual** Customer / Quote / Order / Project / Supplier / Invoice / Tech Pack records, not only list route shortcuts.
- [ ] Approval Control Tower: workflow decisions in persistent authorized state; immutable audit log, no client-only success.
- [ ] Workflow Automation Builder: reuse existing Agent OS runtime; authenticated approvals and safety checks for state-changing tasks.
- [ ] Context Side Panel: real selected record, role-based visible fields and valid deep links.
- [ ] AI Ops Copilot: read-only first, no production mutations without explicit review and human approval.
- [ ] Mobile Operations: responsive tablet/mobile workspaces for operational production, QC and delivery.
- [ ] Multi-site CMS + full Marketing workspaces: connected to actual website/product/lead data.

## Customer 360 exact visual contract

- [ ] Top: 2-column layout: `Hồ sơ khách hàng` (profile identity, key/value details, edit & create quote); `Customer health & liên hệ` (authorized KPIs, recent activities, communication).
- [ ] Under it: `Hoạt động thương mại & tài liệu` with functioning contextual tabs: Orders, Quotes, Contacts, Documents, History.
- [ ] Bottom/secondary: the edit/contact/CRM-workflow forms available without altering approved save behavior or dropping unsaved changes.
- [ ] No demo entity AXXEL or BIGBANG hard-coded as customer records or fabricated metrics; render actual per-customer data.
- [ ] Accounts without financial access cannot see value/margin fields; quote/order permission gates server-side remain authoritative.

## Release and screenshot acceptance protocol

1. Build exact design reference HTML screenshots of **all 44 views** at 1440×900 desktop and representative 390×844 mobile; preserve nav + dialogs + action-state snapshots.
2. Record a per-view route/component/API/permission matrix, and classify missing backend features without inventing working screens.
3. For each route, compare layout structure, information hierarchy, typography, spacing, colors, component sizes and interactions with the HTML screenshots; capture the real **authenticated** app.
4. Verify create/update/delete, relationships, Finance/Document flows, production/QC, draft/revisions, pagination, role-level 401/403, and error/empty/loading states.
5. Release only when CI, independent review, Preview READY, signed-off real account QA and production rollback plan are complete.
6. Do **not** merge this partial V9 PR claiming 100% parity. May ship slices only if explicitly relabeled partial and accepted by owner, otherwise keep production unchanged.

**Source demo behavior is not backend truth:** the HTML has mock records, fake events and no Neon persistence; mirror its interaction model with verified real data and approved business logic.
