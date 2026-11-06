# Orders V9 — Full Replacement Sprint: implementation and acceptance

**Source of visual truth:** `VNC_OS_Admin_UX_V9_FINAL (1).html` (previously approved V9 Final; SHA-256 `8d3722dd2b2a8684a73d110a2c194e5972a8d5f2744e3cb1de1271dda7322e4c`), renderers `renderOrders`, `v8OrdersDetail` / `renderOrderDetail`, `renderQuickOrder`, `renderProjects`. All mock numbers in HTML are placeholders and **must not** be shipped.

**Current PR:** #346 — `integration/admin-v9-20261103`. Draft; no production merge until approved.

| View | Existing source | V9 conversion in PR | Incomplete / acceptance gate |
|---|---|---|---|
| Order List | `/api/orders/dashboard` | Order Portfolio V9 dedicated responsive table/mobile cards, server-filtered KPI, search, status, payments, user filters, chart/kanban modes, order/CRM deep links | Verify row counts, pagination, status labels, production/QC data, list vs global scopes, screenshot desktop 1440 and mobile 390. Project/Batch per-row and currency total are **not** available in the current dashboard DTO; do not invent or mix currency. |
| Order Detail | `/api/orders/:id`, Order Workspace APIs | V9 Order Overview with real Customer/Quote links, production/fulfillment milestones and available actions; dedicated products, QC, documents, delivery, payment, info, activity, notes tabs | Verify role redaction, real production/QC completion vs order-level timestamps, documents/contract links must be verified before claimed as attached; screenshot and create/update transitions. |
| Quick Order | `/api/orders`, existing Excel importer and local draft | Four semantic steps organized like HTML: customer/commercial information and totals side-by-side; full width Size×Color matrix; existing Excel import, local draft, calculations and create action kept. Route now checks `orders.create` server-side. | Test Excel paste/import, size columns, all totals, VAT, draft restore, unsaved changes, 390px horizontal matrix, unauthorized user denial. |
| Project/Batch | `/api/orders/projects`, `/api/orders/projects/:id/batches`, `/api/crm/customers` | Rebuilt Project Portfolio responsive table/card switch, search, KPI from fetched projects, in-context batch creation, **CRM customer chooser** rather than typing internal IDs. Owner-only route retained. | Verify actual new Project and Batch via owner session, meaningful relation deep-links, PO/Shipment isolation, error state, all existing data. Portfolio financial KPIs are not present and are **not fabricated**. |

## Connected-record truth contract
- Customer direct detail link only when `permissions.canViewCrm` and `customerId` exists.
- Quote detail link only if quote ID exists and user has financial access in current UI; server destination still enforces permissions.
- Project/Batch is owner-only. From Order Detail, existing `OrderBatchAssignment` provides per-order relationship.
- Production/QC is a real OrderItemProductionPanel, visible only to roles with Production access.
- Delivery is the existing OrderWorkspaceDeliveryTab with its own authorization and server mutations.
- Document Center is a navigation link, **not** proof that a contract, packing list or invoice exists or belongs to this order.
- Do not expose financial amounts for roles without authorization or combine multi-currency order amounts without an explicit conversion rule.

## Mandatory manual acceptance steps
- [ ] Authenticated Owner 1440x900: Order List, Order Detail (real order), Quick Order and Project/Batch compared against approved HTML reference side-by-side.
- [ ] Authenticated Owner 390x844: each view, including project table horizontal overflow, order cards, full-width quick order size matrix, tap-targets, dialogs, selection and scrolling.
- [ ] Sales: scoped/assigned customer/order visibility and permitted create/modify flows. Deny Owner-only Project and any unauthorized finance, payment or document actions.
- [ ] Production: item/QC visibility with no financial leak; correct workflow navigation and status changes.
- [ ] Delivery: delivery data only and no unapproved order mutations.
- [ ] CRUD smoke: create draft/order, import Excel, apply filters, back to list preserves query, create Batch in existing Project, and project create with real CRM Customer.
- [ ] Network failure/empty response/loading behavior, repeated reload, cross-screen links and browser back.
- [ ] Exact HEAD CI success (lint, typecheck, tests, production build), Vercel Preview READY, independent security review and rollback readiness.
- [ ] Screenshots and test outcomes attached to PR #346. **Do not mark Orders Full Replacement accepted before the above complete**.

**Status:** Implemented code for all four core screens; exact visual parity, authenticated E2E, permissions review and production deployment remain outstanding.
