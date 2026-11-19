# VNC OS English Business Codes — V1

Effective: November 19, 2026. The first live operating order is BIGBANG Batch 2.

This is the canonical reference-code convention for new business records. The underlying database IDs are opaque and immutable. Display/reference codes are uppercase ASCII, stable, and never reused. Never renumber issued invoices or contracts.

| Entity | Pattern | First example |
|---|---|---|
| Customer | CUS-NNNNNN | CUS-000001 |
| Project | PRJ-YYYY-NNNNNN | PRJ-2026-000001 |
| Order | ORD-YYYY-NNNNNN | ORD-2026-000001 |
| Batch | BAT-YYYY-NNNNNN | BAT-2026-000001 |
| Quotation | QTN-YYYY-NNNNNN | QTN-2026-000001 |
| Purchase order | PO-YYYY-NNNNNN | PO-2026-000001 |
| Factory | FAC-NNNNNN | FAC-000001 |
| Supplier | SUP-NNNNNN | SUP-000001 |
| Production job | JOB-YYYY-NNNNNN | JOB-2026-000001 |
| Quality inspection | QC-YYYY-NNNNNN | QC-2026-000001 |

### Rules

- Year-scoped codes use the Vietnam-local calendar year; Customer, Factory and Supplier sequences are global.
- A voided/canceled record retains its code. Never use total row count to assign the next reference after deleting demo data.
- Allocate from the greatest existing number, enforce unique database constraints and retry any collision. Upgrade to a dedicated database sequence where required by throughput.
- Business code is distinct from internal UUID/CUID primary key; do not rewrite foreign keys.
- Order NEW is a non-confirmed commercial record. No production or invoice is implicitly authorized.
- Preserve the historical, issued CI-YYYY-MM-NNNN invoice numbering; any document numbering change needs separate legal/document review.

### SKU convention

Project-specific SKU format is SKU-{PROJECT}-{STYLE:03}-{MARKET}, with size suffix when applicable. BIGBANG Batch 2 examples: SKU-BB2-001-KUL, SKU-BB2-001-KUL-M and SKU-BB2-003-JKT-UNALLOCATED. Market suffixes KUL, JKT, MNL and KHH refer to Kuala Lumpur, Jakarta, Manila and Kaohsiung. Product catalog SKUs require separate catalog-level governance.

### First live production records (2026-11-19)

- CUS-000001: AXXEL VN
- PRJ-2026-000001: BIGBANG Batch 2 (COSMOS)
- ORD-2026-000001: first live commercial order, status NEW
- BAT-2026-000001: first linked delivery batch; 4 city markets in 52 item SKU codes
- 13 styles / 52 market-specific item SKUs / 53,710 pieces
- 450 ZIP-UP HOODIE pieces are not allocated to size in source; three UNALLOCATED variant rows.
- Exclude Seoul, Ballcap and Snapback according to VNC production scope.
- Source lacks unit selling prices. Zero numeric amounts are database placeholders, never a confirmed free-of-charge price.

### Implementation coverage

English Order auto-numbering is updated in the scoped code change. The first Customer, Project and Batch codes are issued in the verified BigBang Batch 2 import. Other entity generators must be changed in follow-on scoped PRs after assessing each module and its tests. This document is the standard, not a claim of universal completed migration.
