# VNC Operations Adoption — Team Pilot

**Decision recorded:** 2026-10-27 (Asia/Ho_Chi_Minh)
**Planned first team use:** 2026-10-28
**Status:** OWNER-APPROVED DIRECTION / OPERATIONAL GO-LIVE NOT VERIFIED
**Live tracker:** https://github.com/hoangthang1209-byte/vnc-os/issues/262

## Operating model
VNC runs approximately 10–15 orders concurrently, mostly outsourced to partner sewing workshops. VNC manages customer commitments, vendors and delivery; the internal workshop handles selected cutting, ironing and packaging. Information is fragmented across Zalo, Gmail, Drive, Excel, Word and Illustrator. Keep those specialist tools while treating existing VNC OS orders and batch tracking as the coordination record.

## Roles (owner-provided, role descriptions not access grants)
- Thắng — CEO: strategy, marketing, technical/product R&D, partnerships, critical escalation and systems.
- Linh — operations lead: customer commitments, order ownership, outsourcing, suppliers, major customers and production coordination.
- Chi — sampling, documents, designs for selected customers, vehicle booking, office and order coordination.
- Đạt — internal cutting/ironing/packing, part-time workers, photography/marketing and production support.
- Lộc — same broad operational responsibilities as Đạt, with PIC split per work item.
- Kiều — Zalo-based customer consultation and order follow-up.
- Dung — remote outsourced accounting with least-privilege document access.

## Approved phase-1 operating flow
Customer request / order confirmation → sample and approved tech documents → Linh assigns outsourced batch and workshop → workshops update by Zalo, authorized PIC records milestone in VNC OS → internal VNC stages / QC → delivery execution → accounting documents.
Order, item, outsourced batch, stage, QC and delivery must be tracked separately; do not conflate stage quantity, accepted quantity and delivered quantity.

## Reuse before build
Verified in main repository's Prisma schema (not runtime):
`Order`, `OrderItem`, `ProductionPlan`, `ItemProductionTracking`, `ItemProductionBatch`, `ItemProductionStage`, `ProductionSupplier`, `TechPack`, `OrderProductionFile`, `OrderQcInspection`, `OrderDeliveryExecution`.
No second order database, no duplicate production scheduler. Validate UI/API, migrations, tenant-safe RBAC and responsive mobile workflow before determining gaps.

## 28 Oct launch gates and fallback
1. Verify current Vercel Production SHA and aliases; authenticated order/production pages, healthy DB and exact schema, authorization by role and mobile smoke. Record evidence and rollback candidate.
2. Test synthetic sample first; use only existing healthy authorized functionality for real orders. CRM incident #250 remains an independent blocker for affected flows.
3. Start with 3–5 orders managed by Linh/Chi. Extend to Đạt/Lộc and Kiều after proven task-specific UX and permissions; Dung later.
4. Track per order: owner, customer deadline, workshop/batch quantity, latest trusted progress, next action/due date, issue/risk and approved Drive file link. Keep original Zalo/Drive workflows as fallback.
5. No blind migration, production cutover, external automated communication, credential sharing, customer data in GitHub, or assertions of production readiness without verified smoke.
6. Decide GO / LIMITED GO / NO-GO, recording unresolved risks explicitly.

## Measurable acceptance
Five pilot-order fields complete; correct user-role access; no duplicate production records; Linh sees at-risk deliveries, overdue follow-ups and uncertain/stale updates; compare time spent chasing status before/after pilot. Adoption means real users completed real work, not only code delivered.

See [pilot issue #262](https://github.com/hoangthang1209-byte/vnc-os/issues/262) for launch checklist and ownership. Update handover/status via reviewed PR, retaining source-backed evidence.
