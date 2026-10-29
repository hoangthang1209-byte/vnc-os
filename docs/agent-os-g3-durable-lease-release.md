# G3 durable lease CAS — release and safety gate (#311)

Status: **DRAFT / NOT ENABLED / NOT PRODUCTION VERIFIED**. This is a
reviewable implementation slice on the **existing** Agent OS, not a new system.
Do not use the presence of this code or a Vercel READY badge as evidence that
an autonomous executor has run.

## Scope

- Additive `G3TaskLease` model and PostgreSQL migration; one lease row per
  G2 `TaskRun` via a unique index and cascading FK.
- Atomic conditional `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE` claim
  using the **database clock**; at most one concurrent claimant succeeds.
- Renew/release require exact task ID, executor identity, SHA, hashed token,
  nonterminal task (renew), active lease and unexpired TTL. Reclaim requires a
  fresh token and increments attempt; old tokens cannot renew or release.
- Store SHA-256 of lease token only. Caller owns secret generation/storage.
  No token should appear in logs, events, API responses or PR comments.
- No runner launch, no background worker, no API exposure, no new secrets, no
  production database change. There is intentionally **no dispatch wiring**.

## Review gates before any merge or migration

1. Exact-head lint/typecheck/security/tests/build + independent security/code
   review, P0=0, P1=0, no blocking P2. Review SQL under concurrent claims,
   PostgreSQL clock behavior, Prisma schema/migration parity and token fencing.
2. Confirm the additive migration is non-destructive, check migration history,
   lock scope, rollback/forward-fix, and Neon branch compatibility. Do not
   apply it to Neon Production without a separate approved release gate.
3. Apply migration **only to an isolated PostgreSQL test database** named
   `*_test` or `*_ci`, never the production database. The GitHub CI job uses
   local `attd_ci` PostgreSQL with `prisma db push` and runs the concurrency
   test automatically. For manual execution, set a separate
   `G3_LEASE_TEST_DATABASE_URL`, distinct from `DATABASE_URL`.
4. Run or inspect the concurrency test:
   `NODE_OPTIONS=--conditions=react-server npx tsx --test src/features/agent-os/g3-durable-lease.integration.test.ts`.
   Collect two-claimer winner evidence, expired takeover, stale-token
   rejection, terminal TaskRun fence and crash/restart recovery evidence.
5. Demonstrate transactionally correlated `AgentEvent` / `AgentDecision`
   audit records, watchdog and shared-resource locking before wiring a real
   executor. The CAS lease **alone** does not meet those gates.
6. Only after executor authentication/heartbeat is independently verified,
   run a low-risk two-task E2E pilot: issue -> claim -> executor -> code/PR ->
   exact-head CI -> independent review -> merge -> exact-SHA PRODUCTION READY ->
   authenticated smoke. Record links in #311.

## Known limitations / follow-ups

- This slice does not yet create transactional `AgentEvent` records or
  coordinate shared-file locks across distinct TaskRuns.
- Lease token hashing is not an authentication mechanism. Provider-neutral
  executor identity must be authenticated by an approved adapter before use.
- A runner must fail closed if claim/renew returns `not_claimed`, if the
  database is unreachable, if the task becomes terminal, or if its PR head
  changes. No synthetic BUILDING state is permitted.
- The integration test runs against the local ephemeral `attd_ci` database
  in GitHub CI (`CI=true`, localhost only), after CI schema preparation. For
  manual runs it is opt-in with an explicitly separate isolated test DB.
  A passing test is necessary but not proof of live executor dispatch.
- Production migration rollback must be reviewed separately because removing
  a live lease table would be destructive. Prefer forward-fix and disabling
  dispatch rather than dropping production data.

Canonical: #197, #237, #310, #311. Related merged guard PRs: #312, #313.
