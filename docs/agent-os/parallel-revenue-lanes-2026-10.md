# Parallel VNC OS execution lanes — October 2026

| Issue | Workstream | Primary acceptance gate |
|---|---|---|
| #250 / #252 | CRM production | Read-only schema inventory → reviewed additive migration → live Lead smoke |
| #244 / #245 | VietnamClothing | Full global B2B merchandise pages, IP permissions, SEO mapping, staging RFQ |
| #246 / #247 | ATTD | Existing V7 CMS/routes intact, five engines, mobile and RFQ QA |
| #124 / #248 / #249 | Unified intake | Auth, dedupe, source attribution, event replay |
| #251 / #254 | Gmail | OAuth, subscriber, History reconciliation, CRM single-lead evidence |
| #244 / #253 | Media | Immutable archive, derivatives, manifest, VNC OS ingest |
| #240 / #242 | Agent OS | Verified runner heartbeat, CI and review accuracy |
| #243 | Revenue | Verifiable ICP, marketing claims, RFQ and quote operations |

## Dispatch rules

- Single builder/lease per overlapping mutable file set; parallelize only independent scopes.
- Issue labels, CI runs and GitHub comments do NOT prove an agent is executing. Require real Cursor runner ID and fresh RUNNING heartbeat.
- CRM incident #250 is P0 for release; unrelated code work may continue independently.
- Database writes, credentials, DNS, campaigns, bulk messages, merges and Production deployment require explicit owner approval and rollback plan.
- Log per-task issue, branch, runner/run ID, exact SHA, CI result, review and acceptance evidence.
- Never present PR opening as completion or assert 24/7 Agent OS operation without live dispatch/heartbeat verification.
