# VNC Strategy — Chat/Agent Handover
**Prepared:** 2026-10-26 (Asia/Ho_Chi_Minh)
**Purpose:** start a new ChatGPT conversation without losing durable intent.

## First steps for a new assistant
1. Read `docs/project-memory/README.md`, `MASTER_DECISION_COMMITMENT_LEDGER.md`, `HISTORICAL_RECONCILIATION.md`, `RECONCILIATION_LOG.md`, `CURRENT_STATUS.md`, `NEXT_ACTIONS.md`, `STRATEGIC_DECISIONS.md`.
2. Verify current GitHub issues/PRs, CI runs, exact commit SHAs and Vercel deployments. Do not treat snapshots as live.
3. Reconcile production domain/alias with Vercel, check auth and CRM operational data only when authorized.
4. Continue highest-priority safe task; report committed code vs successful CI vs deployed vs authenticated QA separately.
5. Update this handover and the relevant ledger in a reviewed PR after material state changes.

## Durable strategy
VNC Strategy covers VietnamClothing (global B2B), ATTD (Vietnamese B2B) and VNC OS. Prioritize CRM, Agent OS, Content Studio, RFQ, SEO, data/security and site-isolated media.

**Owner-approved direction:** AI Leadership & Governance **within existing Agent OS**: Chief Orchestrator, Technology, Operations and Risk/QA, proposal-first, human approval for risky actions. Issue #257 / PR #258. Add CRO/CMO only when CRM and analytics are reliable.

**Owner-approved direction:** Project Memory & Continuity in GitHub with source-backed, reviewable documentation and clear current-vs-historical status. Issue #259.

## Important live checks
- PR #242 Agent OS merged; Production READY deploy `db748294` as of 2026-10-26, but dispatch pilot not verified.
- #250 CRM incident open; do not assume leads are zero or schema repaired.
- #255 Content Studio and #245 VNC catalog still open as of snapshot; migrations/SEO cutover blocked.
- Production project shared with ATTD V9; verify no cross-branch regression.

## How user can resume
“Alex, tiếp tục VNC Strategy. Đọc `docs/project-memory/HANDOVER.md` và các file memory, đối chiếu GitHub/Vercel thực tế, rồi làm task P0 tiếp theo.”

This document deliberately excludes secrets and customer data.

## Standing continuity instruction (approved 2026-10-26)
Use a **Memory-First Workflow** in each new VNC Strategy session: load these files, reconcile current live state, follow already approved decisions, execute and verify, then update this memory via PR. The objective is to prevent chat context limits from erasing recorded project decisions, knowledge, commitments and progress. Perfect recall of unrecorded conversations is not guaranteed.

## Operations adoption / 28 Oct 2026 team pilot (recorded 2026-10-27)
- Owner intends to start team usage on **2026-10-28**, initially Linh and Chi with 3–5 of approximately 10–15 concurrent outsourced-production orders.
- Read [OPERATIONS_ADOPTION_PILOT_2026-10-28.md](./OPERATIONS_ADOPTION_PILOT_2026-10-28.md) and [issue #262](https://github.com/hoangthang1209-byte/vnc-os/issues/262) before recommending new Order/Production features.
- Preserve existing Zalo/Gmail/Drive/Excel/Word/Illustrator workflows; reuse production Order/ItemProductionTracking/Batch/Supplier/TechPack/QC/Delivery models.
- Actual access, DB health, live order screens, role authorization and mobile experience are **UNVERIFIED**. Pilot GO/LIMITED GO/NO-GO must be based on authenticated smoke and safety gates, not schema presence. Do not expose customer data or merge/deploy just to meet target date.

## Critical approved business positioning — 2026-10-27
Three brands are differentiated by **product / buyer intent, NOT domestic vs overseas markets**. **ATTD.vn:** bilingual VN/EN; blank apparel, wholesale B2B supply, corporate uniforms for businesses of any size (including major enterprises) and any nationality. **VietnamClothing.vn:** bilingual VN/EN; branded/entertainment merchandise, custom product development, OEM/ODM, project sourcing for domestic and international buyers. **aothunthongdiep.com:** personalized garment printing and small runs; online self-service ecommerce remains a proposal, not an approval. Corporate uniforms → ATTD, regardless of client's size; branded merchandise → VietnamClothing. Route ambiguities through one CRM owner. Preserve SEO before redesign, and do not claim bilingual implementations are already live. See `STRATEGIC_DECISIONS.md` and `MASTER_DECISION_COMMITMENT_LEDGER.md`.
