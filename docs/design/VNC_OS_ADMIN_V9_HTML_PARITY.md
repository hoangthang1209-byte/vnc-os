# VNC OS Admin V9 — Exact HTML Parity Contract

**Status:** Approved design / implementation in progress. Master: #294. Connected Operations: #341, #342.

## Canonical approved visual reference

- File name: `VNC_OS_Admin_UX_V9_FINAL.html` (user-approved 2026-11-02)
- SHA-256: `8d3722dd2b2a8684a73d110a2c194e5972a8d5f2744e3cb1de1271dda7322e4c`
- Do **not** claim it is deployed simply because static CSS resembles it. Each screen must reach comparable composition and working interactions.

### Design tokens

| Token | Value | Usage |
| --- | --- | --- |
| Navy | `#142236` | Sidebar |
| Navy 2 | `#1f344f` | Active nav |
| Red | `#d92f3a` | VNC accent |
| Ink | `#202d3d` | Main text |
| Muted | `#748397` | Secondary text |
| Border | `#e1e7ee` | Dividers |
| Canvas | `#f5f7fa` | Workspace |
| White | `#ffffff` | Cards |
| Typography | DM Sans / Manrope | Content / headings |

## Canonical information architecture

1. Workspace — Dashboard, Action Center, Activity Log, Status System
2. Sales & CRM — Leads, Customer List / 360, Quotes, Costing
3. Orders & Operations — Orders, Order Detail, Quick Order, Project/Batch, Production, QC, Delivery
4. Technical & Sourcing — Tech Pack, Pattern, Materials, SRM, RFQ, Purchasing
5. Finance & Documents — Finance, Invoice, Document Center
6. Products & Multi-Site — Product Catalog, Categories, Website Content, SEO
7. Content & Marketing — Campaigns, Calendar, Ads, Attribution, Outreach, Asset Library, Reports, Articles
8. Administration — Users, Roles, Settings, Agent OS

**Routing rule:** On mainline, expose only implemented, authorized routes; do not invent links or mount static demo into production. Missing sections must be implemented as real features and marked pending in #294.

## Screen-by-screen replacement gates

- Comparison screenshots for reference HTML and authenticated app at 1440px and 390px.
- Field-by-field parity with approved business rules; API and DB retained unless independently reviewed migration.
- Actions are real (not demo alerts), permissions fail closed, no mock data on live pages.
- Customer → Quote → Order → Project → Supplier → Invoice navigation and document workflows tested.
- Action Center / approvals use real permissioned backend state; workflow and AI writes require explicit review.
- CI Verify, Next.js production build, preview screenshot review and production READY + authenticated smoke.
- Roll back to preceding deployment on P0 regression.

## Release slices

- **V9-A (this PR):** live Admin shell foundation + top-level navigation IA and visual tokens. Not full V9.
- **V9-B:** Customer List & Customer 360; Sales/Quotes/Costing.
- **V9-C:** Orders List/Detail/Quick Order; Project/Production/QC/Delivery.
- **V9-D:** SRM, Technical, Finance, Documents.
- **V9-E:** Products/Multi-Site CMS, Content and Marketing.
- **V9-F:** Administration, AI Operations, Mobile, full visual parity + E2E.

Any PR that only changes CSS or shell must be labeled partial.
