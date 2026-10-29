# VNC Strategy — Project Memory & Continuity
Owner-approved 2026-10-26. Related issue: #259.

This repository stores **institutional memory**, not private chat transcripts. Read `HANDOVER.md` first, then verify claims against live GitHub, Vercel and VNC OS systems before acting.

## Canonical records
- `PROJECT_CONTEXT.md` — mission, brands, scope and permanent policies
- `STRATEGIC_DECISIONS.md` — durable decisions with dates and links
- `SYSTEM_ARCHITECTURE.md` — boundaries, dependencies and non-goals
- `CURRENT_STATUS.md` — verified status *as of a point in time*
- `TASK_REGISTRY.md` — issues, PRs and ownership
- `PRODUCTION_DEPLOYMENTS.md` — deployment snapshots; NOT live truth
- `INCIDENTS_AND_BLOCKERS.md` — release gates and unresolved risks
- `NEXT_ACTIONS.md` — prioritized next tasks
- `HANDOVER.md` — short entrypoint for a new conversation/agent
- `MASTER_DECISION_COMMITMENT_LEDGER.md` — approved decisions, outstanding commitments, evidence and acceptance
- `HISTORICAL_RECONCILIATION.md` — source inventory, verification procedure and historical coverage limits
- `RECONCILIATION_LOG.md` — observed conflicts and corrective actions

## Update protocol
1. Record exact UTC timestamp and source URL for every **mutable** status.
2. Distinguish `VERIFIED`, `PENDING`, `UNKNOWN`, and `HISTORICAL`. Never turn estimates into facts.
3. Link PR/issue, commit SHA, CI and deployment ID where known. CI green != Production verified.
4. Update status + handover in the **same PR** when meaningful changes are released.
5. Never store API keys, session cookies, credentials, customer PII, commercial secrets or copied private chat logs here.
6. Use a PR with review/checks; do not bypass protected `main`.
7. New chat procedure: read `HANDOVER.md`, `CURRENT_STATUS.md`, `NEXT_ACTIONS.md`; query live GitHub/Vercel; reconcile discrepancies; only then operate.

## Authority
GitHub: code, issues, PRs and documented technical decisions.
Vercel: deployment status, project aliases and production SHA.
VNC OS: operational CRM, task and AgentRun data (subject to authorization).
ChatGPT memory/history: convenience, never sole evidence.

Human owner retains authority over production migrations, DNS, live customer messages and high-risk actions.

## Memory-first continuity objective (owner-confirmed 2026-10-26)
**Goal:** No individual ChatGPT conversation limit should cause VNC Strategy to lose its recorded knowledge, approved decisions, commitments, work status, or next steps. This is an operational objective, not a claim of perfect memory or access to all past chats.

**Required workflow for every VNC Strategy execution session:** Read Project Memory → verify live GitHub/Vercel/VNC OS evidence → reconcile decisions/commitments and unknowns → execute authorized work → test → update Project Memory and handover through reviewed PR. If repository access or historical coverage is missing, disclose the gap rather than invent continuity.
