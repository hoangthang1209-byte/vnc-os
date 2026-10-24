# VNC Agent OS — Cursor retirement and Plus/Codex migration

Status: **migration pilot**, NOT production ready. Owner decision: 2026-10-24. Tracking: #237.

## Immutable boundaries
- Keep GitHub as code/task source of truth, Vercel for deployment, Neon for data.
- Keep existing production serving until a replacement has passed exact-SHA deployment verification and authenticated smoke tests.
- Do not assume ChatGPT Plus credits pay for unattended API inference, external CI minutes, or a 24/7 Codex worker.
- No webhook/secret/database migrations without a separate plan. Do not store secrets in issues, PRs or source.
- Do not treat a GitHub comment as proof that a coding agent started.
- Pricing, finance, auth, production data migrations require explicit owner approval.

## Current system inventory
The existing PR #219 is a Cursor-specific implementation for #218 and currently overlaps with #211 (already merged). It includes:
- `.github/scripts/cursor-cloud-api-bridge.py` and its tests
- `.github/workflows/cursor-cloud-api-bridge.yml`
- `.github/workflows/continuous-orchestrator-watchdog.yml`
- `.github/workflows/continuous-orchestrator-pr-merged.yml`
- `.github/scripts/continuous-orchestrator-common.sh`
- `.github/scripts/review-orchestrator-common.sh`
- `.github/workflows/build-orchestrator-pr-review.yml`
Do not merge the Cursor-specific orchestration without redesign; these paths and their callers must be reviewed against the CURRENT main branch prior to any removal.

## Immediate MVP execution path
1. In ChatGPT Work, connect the existing GitHub repository and verify Codex task execution on a dedicated branch; record actual tool/run/commit evidence in #237.
2. Codex reads `AGENTS.md`, the linked issue, and existing code. It produces a scoped patch, tests and an ordinary PR; never writes directly to main.
3. GitHub CI validates lint, typecheck, public token security, tests and build. A genuinely independent code review examines the exact PR head.
4. Only after required approvals and checks: merge with exact head SHA; verify Vercel production READY references the resulting merge SHA, then smoke test `/admin/login` and authenticated `/admin/automation`.
5. If a task cannot be dispatched using the actual available Plus/Codex capabilities, record WAIT_HUMAN and the missing connector/entitlement. Never claim autonomous execution or synthesize BUILDING.
6. Only after one real successful path: retire the old Cursor triggers and API secret, maintaining history/rollback.

## Provider-neutral state contract (design, not yet wired)
| Stage | Required evidence |
| --- | --- |
| QUEUED | GitHub issue with scope and risk |
| CLAIMED | Durable assignee/lease and idempotency key |
| BUILDING | Real runner job ID + start time, not comment |
| CI_REVIEW | PR number + exact head SHA + CI checks |
| REPAIR | Concrete review/CI failures linked to head |
| MERGING | Approved review, safe risk policy, exact head |
| VERIFYING | Production READY commit matches merge SHA |
| COMPLETED | Production smoke pass and linked issue closure |
| WAIT_HUMAN | Specific blocker, retries exhausted or elevated risk |

## Acceptance evidence before removing Cursor
- [ ] Real Codex run, with runner/job evidence
- [ ] PR + exact-head green CI
- [ ] Independent review
- [ ] Safe merge and production deployment matching exact SHA
- [ ] Authenticated VNC OS smoke plus mobile 393x852
- [ ] Rollback tested and Cursor triggers disabled only after cutover

## Costs
ChatGPT Plus is the sole targeted personal AI subscription. Actual available Codex/Work quotas must be checked in the product. Usage-based OpenAI APIs, Vercel, GitHub Actions and Neon are separate; set budget alerts before enabling any external API runner.

## Pilot implementation on PR #238

- `execution-lifecycle.ts` implements a pure provider-neutral evidence contract and maps its stages onto the existing AgentRun persistence statuses. No Prisma changes.
- A claim is QUEUED in the existing run model. BUILDING needs a provider, execution reference, matching lease and start time. Expired leases stop at WAIT_HUMAN. GitHub comments cannot call this contract by themselves.
- A new PR head invalidates CI/review. Stale evidence cannot merge, repairs are bounded, and completion requires both production READY and smoke evidence for the exact merge SHA.
- `/api/health` reports only service, environment and deployment commit with no caching or database access. This supports exact-SHA release verification without exposing credentials.
- The reducer is a tested domain contract, **not yet wired to a durable executor adapter or a scheduled worker**. Callers must verify external identities before applying events. No public endpoint accepts arbitrary lifecycle events.
- Interactive Work source execution and GitHub writes are available in this pilot. Codex Cloud task dispatch and independent GitHub review remain unverified until real service responses exist. No API runner or added subscription is configured.
- Cursor retirement is deferred until this pilot passes review, deployment and authenticated smoke. No legacy Cursor dispatch is invoked by the pilot.
