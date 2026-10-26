# Master Decision & Commitment Ledger

**Established:** 2026-10-26. **Coverage:** only project conversation context available to this session plus cited GitHub sources. NOT an exhaustive transcript of all earlier chats.

## Record contract
Each durable entry must provide:
- `id`: stable immutable ID (`VNC-DEC-YYYY-NNN` or `VNC-COM-YYYY-NNN`)
- `kind`: DECISION | COMMITMENT | PROPOSAL
- `recorded_on`: ISO date; `origin`: conversation / GitHub / document
- `statement`: exact actionable meaning (not fabricated verbatim quote)
- `status`: APPROVED | PROPOSED | IN_PROGRESS | BLOCKED | DELIVERED_CODE | VERIFIED_PRODUCTION | SUPERSEDED | UNKNOWN
- `evidence`: issue/PR/commit/document URLs and exact verification time for changing status
- `owner`, `dependencies`, `acceptance`, `next_action`, `supersedes`
- `confidence`: VERIFIED_SOURCE | USER_CONFIRMED | PARTIAL_HISTORY | UNVERIFIED

**Important:** `DELIVERED_CODE` and `VERIFIED_PRODUCTION` are different states. Never promote status without new evidence. A user-approved direction is not equivalent to a shipped capability.

## Initial decision / commitment ledger

| ID | Kind | Decision / commitment | Status | Evidence | Missing acceptance |
|---|---|---|---|---|---|
| VNC-DEC-2026-001 | DECISION | Develop AI Leadership & Governance within existing Agent OS; MVP roles Chief Orchestrator, Technology, Operations, Risk/QA; human gates for high-risk actions | APPROVED | [#257](https://github.com/hoangthang1209-byte/vnc-os/issues/257), [PR #258](https://github.com/hoangthang1209-byte/vnc-os/pull/258) | Governance runtime, pilot and Production verification |
| VNC-DEC-2026-002 | DECISION | Build source-backed Project Memory & Continuity across chat sessions | APPROVED | [#259](https://github.com/hoangthang1209-byte/vnc-os/issues/259), [PR #260](https://github.com/hoangthang1209-byte/vnc-os/pull/260) | Merge, continuity SOP adoption |
| VNC-COM-2026-001 | COMMITMENT | Publish durable context, decisions, architecture, status, issues, deploys and handover docs | DELIVERED_CODE | [PR #260](https://github.com/hoangthang1209-byte/vnc-os/pull/260) | CI, review, merge and onboarding |
| VNC-COM-2026-002 | COMMITMENT | Implement historical reconciliation and a decision/commitment ledger without overstating chat coverage | IN_PROGRESS | [#261](https://github.com/hoangthang1209-byte/vnc-os/issues/261) | Source inventory, validation, review, reconciliation trial |
| VNC-COM-2026-003 | COMMITMENT | Agent OS accurate Builder runtime status; preserve real AgentRun evidence | DELIVERED_CODE | [PR #242](https://github.com/hoangthang1209-byte/vnc-os/pull/242) | Authenticated Production AgentRun pilot |
| VNC-COM-2026-004 | COMMITMENT | Repair CRM Production Lead schema incident without destructive DB operations | BLOCKED | [#250](https://github.com/hoangthang1209-byte/vnc-os/issues/250), [PR #252](https://github.com/hoangthang1209-byte/vnc-os/pull/252) | DB inspection, reviewed repair, real Leads smoke |
| VNC-COM-2026-005 | COMMITMENT | Build multi-site Content Studio with isolated VNC/ATTD sites, drafts and controlled publish | IN_PROGRESS | [PR #255](https://github.com/hoangthang1209-byte/vnc-os/pull/255) | CI, editor/review, migration, site isolation E2E |
| VNC-COM-2026-006 | COMMITMENT | Build VietnamClothing global B2B catalog, approved media and SEO-safe migration | IN_PROGRESS | [PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245), [#256](https://github.com/hoangthang1209-byte/vnc-os/issues/256) | Real approved products, RFQ, URL inventory, staging QA |
| VNC-COM-2026-007 | COMMITMENT | Connect multisite RFQ/Lead intake safely to shared CRM | IN_PROGRESS | [PR #248](https://github.com/hoangthang1209-byte/vnc-os/pull/248) | Deduplication, auth, Production E2E and healthy CRM |
| VNC-COM-2026-008 | COMMITMENT | Protect ATTD V9 pages and conversion while shipping VNC OS features | UNKNOWN | [PR #247](https://github.com/hoangthang1209-byte/vnc-os/pull/247) | Live visual/functional regression evidence after main deploy |

## Change discipline
- Never delete decisions; append supersession and reason.
- If sources disagree, record conflict in reconciliation log, use authoritative live data for **current operational state**, and retain original intent.
- Treat missing transcript as `UNKNOWN`, never invented content.
- Backfill earlier chat discussions only from available transcript exports, user-confirmed summary, or linked issue/PR.
