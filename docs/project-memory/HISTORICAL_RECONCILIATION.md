# Historical Knowledge Reconciliation — SOP

**Objective:** recover known intent and commitments, detect discrepancies, avoid fabricated memory.

## Inputs / authority
1. User-confirmed instructions and accessible conversation summaries (for intent).
2. GitHub issues/PRs/commit diffs and CI checks (for work and code states).
3. Vercel project/deployment/alias state (for delivery, not QA).
4. Authenticated VNC OS CRM / AgentRun (for operations; respect RBAC).
5. Project documentation (historical evidence; must be reverified).

## Per-session algorithm
1. Read `HANDOVER.md`, `MASTER_DECISION_COMMITMENT_LEDGER.md`, `CURRENT_STATUS.md` and `NEXT_ACTIONS.md`.
2. Gather live GitHub PR/issue states and latest check results for all P0 IDs; gather Vercel exact deployment SHA/alias for production-sensitive tasks.
3. For each ledger row assign one of: MATCH, SOURCE_CHANGED, CONFLICT, UNVERIFIED, INACCESSIBLE_HISTORY.
4. Create discrepancy record with ID, observed UTC time, old claim, new claim, source, risk, proposed action and whether human review is required.
5. Resolve only with evidence; update status atomically in reviewed PR. Do not quietly rewrite historical decisions.
6. Rebuild `HANDOVER.md` and `NEXT_ACTIONS.md` to reference the current ledger and evidence.
7. Close the session with explicit DELIVERED_CODE / CI_PASS / DEPLOY_READY / PRODUCTION_VERIFIED breakdown.

## Historical coverage strategy
- Phase A: linked GitHub issues, PR descriptions, past documented handovers and accessible current chat context.
- Phase B: optionally import **user-provided** exports or summaries of earlier chats; redact credentials/customer PII and verify duplicates.
- Phase C: identify orphan commitments without issue tracking; require user confirmation before converting vague historical ideas into approved tasks.
- Phase D: monitor additions and conflicts in GitHub and operations, with human-approved changes.

## Known gaps as of 2026-10-26
No complete programmatic access to every past chat has been established. Therefore historical coverage is **PARTIAL**. CRM Production runtime and authenticated AgentRun pilot remain unverified. Do not claim complete memory or automated continuous synchronization.

## Reconciliation entry template
| Discrepancy ID | Observed UTC | Record ID | Previous | Current evidence | Classification | Owner | Next action |
|---|---|---|---|---|---|---|---|
| REC-YYYY-NNN | timestamp | VNC-COM-YYYY-NNN | prior snapshot | URL + SHA + deployment | MATCH / SOURCE_CHANGED / CONFLICT / UNVERIFIED / INACCESSIBLE_HISTORY | responsible role | action |
