# BIGBANG Batch 2 — VNC OS V9 Operator Readiness Audit
**Baseline:** GitHub `main` inspected 2026-11-20 (commit `72311f7`). **Scope:** repository/static review, NOT a verified authenticated production acceptance or a production database reconciliation.

## Operating outcome / source of truth
Staff must operate **one canonical order**: Customer → Project → Batch → PO/Order → Style / Market SKU / Size → Tech Pack / Pattern → BOM / Procurement → Production Plan / factory stages → QC → Packing / Cartons → Shipment / Delivery → Actual P&L. Preserve existing OrderItem, ProductionPlan, item tracking and delivery models; do not create duplicates.

Owner-specific: BIGBANG Batch 2; Price_ver1 of latest **[YGP-AXXEL] BIGBANG Production List (3).xlsx** must be reconciled against DB in a signed, read-only dry run (#403). Exclude **Eco Bag from every market**. Physical 'tag' means **woven label, size/care label, hangtag, patch and packaging accessory**, never a UI metadata tag (#404). Four market selectors: KUL/JKT/MNL/KHH; quantities aggregate only as a read-only pivot across selected markets.

## Module acceptance inventory
| Workstream | Existing code / workflow discovered | Operator must be able to do | Open critical gate |
| --- | --- | --- | --- |
| Customer, Project, Batch | Orders page + `/admin/orders/projects` and Order batch route | find AXXEL and approved BIGBANG Batch; assign owner, deadlines, PO; no raw IDs | Validate staff role, customer selection, actual Batch links |
| Order & SKU | `/admin/orders/[id]`, item edit API; PR #400 merged | edit safe product/thumbnail/technical metadata, size matrix and market totals | Diff Price_ver1 vs real DB; product edit stage restrictions; #402 |
| Tech Pack & Artwork | `/admin/tech-packs`, release/version/assets routes | see approved art, garment specification, print/embroider options, versions | Release/readiness role gates; right artwork for each market |
| Pattern/Cutting | `/admin/patterns`, file/version/measurement routes | download pattern/marker quickly, per-size cutting plans and revisions | Validate CAD/marker actual files and cutting qty |
| BOM / Materials | `/admin/materials`, `/admin/production-materials`, order material requirement routes | auto-count woven/size/care/hangtags from approved production size breakdown, show shortage | #404/#411; no speculative BOM |
| Purchase / Receive | `/admin/purchase-requests`, receive route | supplier selection, PO qty, incoming receipt, price snapshot and shortage | #411; role/identity and received ledger |
| Production Job Plan | `/admin/production/jobs/[orderItemId]`, ProductionPlanEditor | amend dates, PIC, workshop, lead time, notes and save | #406/#407; actual status + permission smoke |
| Factory / Stage | `/admin/operations-v9`, `/admin/manufacturing/production-timeline`, stage APIs | edit selected stage/factory, dispatch/receipt/actual progress without changing customer qty | #409; Gantt currently not a direct editor |
| QC | `/api/orders/[id]/qc` and evidence routes; item QC tab | accept/reject/rework by SKU/size and factory, evidence, accountable inspector | #408 security authorization review |
| Packing / Cartons | Existing delivery execution and order variants; no packing-named frontend source identified in inspected tree | label cartons, pack by SKU/size, enforce packed <= QC accepted, manifest | #410; inspect services before new schema |
| Shipment / Delivery | `/admin/delivery`, delivery-executions and proof routes | market split, multiple shipments, actual dispatched/received/proof quantities | #410 + #408 role checks |
| Finance & Actual Cost | Order actual-cost routes, `/admin/pricing`, contracts/invoices | committed vs actual costs, margin, vendor bills; finance-only access | #402 must preserve cost panel; negative permissions |
| Operations / Staff | `/admin/operations-v9`, Order Detail, action queue | owner/PIC/due/exception next action, one-click navigation, mobile | #405 + role smoke |

## Source-verified findings (code observations, not proof of exploitation)
1. `src/lib/permissions/require-admin-permission.ts` currently has `TODO(CTO-5)` for platform/action and allows every authenticated non-owner caller from this helper alone; some API routes add their own `can()` and scoped checks, but several inspected ones rely on helper only. Inventory and close #408 before staff rollout. Do not infer actual public exposure from static code.
2. `src/app/api/orders/[id]/qc/route.ts` GET does not explicitly use requireAdminPermission or an order scope; POST/PATCH call the generic helper. Confirm service/middleware behavior, add route-level authorization and denied-role/foreign-order HTTP tests (#408).
3. `src/app/api/orders/[id]/delivery-executions/route.ts` GET lacks explicit route auth; POST and dispatch use generic platform/action. Audit full service enforcement, logistics grants and cross-order boundaries (#408).
4. `src/app/api/orders/[id]/production-stages/route.ts` GET calls `ensureProductionStagesInitialized`: assess side effects, convert to read-only GET with explicit authenticated initialization elsewhere and regression tests (#408).
5. `src/features/production-planning/production-plan-scope.ts` `productionOrderStatusesWhere` includes only CONFIRMED/IN_PRODUCTION/READY_TO_SHIP; DRAFT or NEW BIGBANG orders may not be reachable/editable in canonical Production Job workspace, notwithstanding visibility in Gantt. Verify actual order state; fix correct eligibility, not RBAC bypass (#406/#409).
6. `src/components/admin/operations-v9/IntegratedProductionWorkspace.tsx` Gantt bar opens a read-only selected-stage drawer; action opens SKU-level job page, not selected tracking/stage editor (#409). PR #407 addresses stale plan form hydration and link labeling only.
7. `src/components/admin/production-planning/ProductionPlanEditor.tsx` main version could overwrite typed edits when async plan fetch resolves; draft PR #407 adds request/dirty guard. Confirm CI, role tests and save.
8. Audit tree identifies production, materials, QC and delivery API building blocks, but no module can be signed off end-to-end merely from file existence. No packing-named frontend file observed; inspect embedded packing components/services before adding new ones.
9. `OrderCommercialCostStrip` is mounted in PR #402 Payment tab at current inspected PR head, addressing earlier reviewer concern; latest CI and preview still govern release.

## Quantity source of truth and invariants
Track separately: customer ordered; contractual FOC; approved production buffer; planned cut; sent to workshop; workshop received; completed; QC inspected; QC accepted; packed; shipped; delivered. Every quantity is attributable to Style, SKU, size, market, record version and actor. Do not replace accepted quantities with stage percentage or mark demo tracking complete. Reject overpacking/duplicate allocations and unapproved supplier purchasing.

## Staff operating matrix (TARGET, not verified grants)
| Role | View | Edit | Restricted |
| --- | --- | --- | --- |
| Owner / CEO | full project oversight | approve plan/exception and commercial | no silent override or backdated quantities |
| Operations Lead | all assigned orders, factories, milestones | order plan, job, purchase requests, factory dispatch, shipment preparation | margin access only with explicit role grant |
| Technical / Office | spec, pattern, samples, job detail | approved revisions, document attachments, logistics preparation as assigned | no unapproved commercial price edits |
| Cutting / Packing | assigned jobs and packing work queue | cut actual, carton counts, photo/proof entries | no finance or other client records |
| Sales / Client Services | assigned customer/order status and delivery promise | approved sales fields, notes, client documents | no QC acceptance/production actual by default |
| QC | authorized inspection jobs | accept/reject/rework and evidence within assignment | no broad order mutation |
| Delivery | assigned shipment | dispatch, proof, received qty | no vendor costing |
| Accounting | approved financial/doc records | bills, payments, cost review under explicit grant | no production-stage actual by default |

## Release sequence / verifiable acceptance
- **R0 Security** (#408): inventory route GET/POST/PATCH permissions, enforce real order scoping, 401/403/404 and negative role tests. Security gate for production staff access.
- **R1 Order & Job** (#402/#406/#407/#409): product/market matrix, readable lean detail, editable plan + selected stage, factory assignment, saved + refresh state; signed workbook reconciliation (#403).
- **R2 Technical & procurement** (#404/#411): actual approved tech files, patterns, fabric/trim BOM, purchasing and supplier received quantities.
- **R3 Shop floor** (#409/#405): stage actual ledger, dispatch/receipt, QC accepted and defect/rework, no demo-to-actual inference.
- **R4 Packing & delivery** (#410): carton manifest, market split dispatch and delivery proof with quantity invariant.
- **R5 Closeout** (#405): actual costs/documents, controlled sign-off and operator mobile training.

Every release requires exact HEAD lint/typecheck/tests/build, independent code/security review, authorized staff desktop/mobile workflow, Vercel Preview or documented equivalent, verified Production SHA and rollback. Do **not** claim “production-ready” based on PR body, source presence or demo Gantt.

## Gold-case operator walkthrough / exit criteria
1. Operations lead opens Batch 2, sees four markets and correct Price_ver1 quantities with Eco Bag absent.
2. Technical employee downloads correct approved artwork, size spec and pattern/marker for one style.
3. Materials employee sees computed woven/size labels and stock vs ordered vs received, correct shortage.
4. Operations lead edits a Job + stage factory and dates, reloads to verify persistence.
5. Authorized factory/internal operator records dispatch, actual completed and return; quantities reconcile.
6. QC operator inspects and accepts a partial quantity; unapproved packing excess is blocked.
7. Packing operator generates carton manifest by SKU/size; delivery operator dispatches split markets and attaches proof.
8. Finance user sees restricted actual cost and commercial margin; unauthorized roles see neither data nor API success.
9. Audit history shows who changed what and when. Repeat key steps at 1440 desktop and 390 mobile.
