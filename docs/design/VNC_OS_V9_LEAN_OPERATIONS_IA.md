# VNC OS V9 — Lean Operations Information Architecture

**Status:** design and phased implementation directive, 19 Nov 2026. Not a claim that all modules have been refactored.

## Product principle

Every screen must answer **what is this record, what is its operational state, what is the next useful action** without requiring the user to scan repeated cards and nested accordions. Do not achieve simplicity by deleting functions or stored data. Keep infrequently used information reachable in a secondary tab, detail drawer, or intentional overflow action.

### Layout rules (desktop and mobile)

1. One primary page header: record identity, lifecycle status, primary action, optional overflow. Do not repeat the order number and status in successive cards.
2. Maximum **four essential KPIs** by default; show a fifth only when it flags an actionable exception. No vanity counts or placeholder zeros.
3. A list page has one search/filter bar, one data grid, one clear create CTA. Row click opens a drawer or record, with no parallel edit form always visible.
4. Field form has a **core set of 4–6 fields**: name/reference, key selection, quantity or size grid, price where relevant, and small thumbnail. Delivery, technical, source classification, BOM and costing belong to secondary sections.
5. Tables use stable widths: first 1–2 identity columns sticky when scrolling horizontally; quantity values right-aligned in tabular numerals. Aim 12–13px data text, 11–12px labels, not 9px body text.
6. Card and table paddings: desktop 12–16px; mobile 8–12px; between major content areas 10–16px. Avoid 24–32px nested vertical stacks.
7. One master place owns every mutable field; other modules show a read-only summary + deep link. Never create a second disconnected quantity, status or supplier assignment.
8. Favor tabs (workflows) over accordion stacks. **Default tab should be the job-to-be-done**, not Overview.
9. Vietnamese-safe system/Geist/Inter font stack. Do not mix unrelated body fonts. Tabular numerals for SKU quantity and costs. WCAG contrast and focus states.
10. Hide technical advanced fields by default **without hiding required approvals or the size matrix**. Error state must reveal the relevant section, rather than silently failing.
11. Preserve permissions and financial redaction (Owner/Sales/Production/Delivery). Hidden sections do not authorize API mutations. All writes remain permission-checked.
12. Real workflow status is separate from demo or draft estimates; no inferred completion or invented factory capacity.

## Module IA: primary / secondary

| Module | Show immediately | Secondary / drawer |
|---|---|---|
| Customer 360 | Identity, contacts, active orders, owner, next activity | Accounting, addresses, documents, history |
| Orders / Detail | Order header, selected-market totals, size-matrix, Edit SKU, production action | Connected records, QC, documents, payment, milestones, audit |
| Order create/edit | Customer, order date, item identity, color, quantity/size, price, thumbnail | Lead times, classifications, internal notes, revenue category, MOQs |
| Projects / Batches | Project / batch ID, styles, quantity, due dates, assigned owner | Risk logs, attachments, assumptions |
| Production Jobs | SKU, size allocation, factory, stage dates, planned vs actual, blockers | QC attachments, detail routing, history |
| Factory / Supplier SRM | Name, category, status, contact, active jobs | Capacity, rates, bank details, certifications, scorecards |
| Materials / BOM | Material, specification, consumption, waste, required / available / to buy | Supplier quotes, vendor catalogs, alternatives, history |
| Purchase / Sourcing | PO/ref, supplier, SKU/material, ordered & received, ETA | Payment, import/export details, attachments |
| Pattern / Marker | Style, pattern version, sizes, CAD file, fabric width, marker efficiency | Detailed annotations, grading, nested history |
| Quality Control | Job, sample, defect, pass/fail, next action | Photos, tolerances, inspector notes, audits |
| Delivery / Packing | Market, product/size, packed vs dispatched, due date | Carrier details, documents, customs fields |
| Finance / Costing | Quoted vs actual cost, margin, payment status | Itemized fees, FX, accounting evidence |
| Document / Contracts | Document type, number, customer, status, actions | Version comparison, template settings, legal signers |
| CMS / Marketing | Product/list, publication status, channel/locale, action | SEO, metadata, variants, media controls |
| Agent OS | Run state, owner, blockers, last action | Raw logs, leases, diagnostics |

## P0 Order implementation in PR #401

- Order Detail displays one compact header, a small essential KPI strip, tab navigation, and the full-width item size matrix. Extra project/timeline information is retained within the **Info** tab.
- The Order form shows catalog/product name, color, quantity (or size matrix), price and an optional compact thumbnail first. Unit, lead time, notes, categorization, gender, MOQ etc. remain editable within the existing advanced section.
- No migrations, no quantity edits, no change to commercial or production status; no deletion of linked documents or records.
- PR #400 separately adds inline Style/SKU editing and multi-market selection; do not remove or override that feature in this lean pass.

## P1–P3 acceptance and rollout

1. **P1**: Customer 360, Factory/SRM, Production Job, Orders List — remove repeated KPIs and oversized record cards, keep key operations visible.
2. **P2**: Technical/Pattern/Marker, BOM/Sourcing, QC/Delivery — line-level editable data grids and drilldown forms, availability / planned / actual differentiated.
3. **P3**: Finance/Docs/CMS/Marketing/Agent OS — consistent record navigation and information hierarchy while preserving specialist workflows.
4. Validate each rewritten screen across desktop 1440/1280, mobile 390, long Vietnamese strings, 48-SKU BigBang example, empty/new data, and Owner/Sales/Production/Delivery authorization.
5. Measure task success: edit one SKU's thumbnail without leaving Order Detail; display selected KUL+JKT totals; open/update a production stage; find and attach a style's CAD; create procurement BOM without guessing material consumption.
6. Compare before/after screenshots and clickable functionality. Do not release merely on screenshot resemblance; verify persistence and cross-module consistency.

**Release rule:** At most one read/write ownership model per entity. Do not rewrite or clear customer/order/production data to simplify UI. Document, invoice and contract workflows continue independently.
