# AI Leadership & Governance — VNC OS
Decision: approved 2026-10-26. Implementation status: staged proposal, not production enabled.

## Goal
Extend the existing Agent OS with bounded, auditable executive coordination. Do not create a competing scheduler or parallel source of truth.

## MVP roles
1. Chief Orchestrator: translate owner objectives into prioritized plans, dependency graphs, acceptance criteria and draft tasks.
2. Technology Lead: architecture, code/release risks, CI and technical feasibility.
3. Operations Lead: schedule, capacity, SLA, cross-workstream blockers.
4. Risk/QA Lead: independent verification, policy gates, data protection and rollback readiness.
These are logical roles, not a requirement to run four independent models.

## Roadmap
- Phase 0: verify authenticated Agent OS Production operation, AgentRun evidence, CRM #250 safety and role permissions.
- Phase 1: human-approved task plans, source-backed executive briefs, decision trail, status/risk dashboard. Read-only until authorized.
- Phase 2: CRO/CMO leadership using verified CRM, GA4 and Search Console evidence.
- Phase 3: controlled low-risk automation with budgets, leases, retries and human escalation.
- Phase 4: optimize measurable outcomes, failure rates, latency and costs.

## Governance contract
- Default: analysis, summaries, planning drafts. No unapproved external actions.
- Task creation/dispatch: authenticated, scoped permissions, human approval for MVP, unique builder lease, verified Cursor run ID, fresh heartbeat, audit event.
- Separate human approval: Production merge/deploy, migrations, domain/DNS, sensitive CRM edits, customer communications, payments, public media and SEO publication.
- Never self-approve. No fabricated business metrics, customer references, proof of delivery or Production success.
- Strict ATTD/VNC isolation and PII/secret handling.
- All recommendations specify data source, uncertainty, risk, dependencies, measurable acceptance gate and rollback.
- Fail closed on missing telemetry, invalid role, policy conflict or review failure.

## Proposed surfaces
- Admin-only /admin/leadership: executive brief, objectives, priority queue, dependencies, risk register, proposed decisions, approval history.
- Typed policy and role contracts shared with existing Agent OS; no new database migration in initial contract phase.
- Existing AgentRun and automation task lifecycle remain authoritative.

## Phase 1 acceptance
- An authorized user can inspect a source-backed plan and its dependencies.
- All suggested dispatches remain human-gated; no implicit job execution.
- An end-to-end pilot demonstrates task → authorized builder → AgentRun telemetry → PR → CI → review → deployment QA.
- Failures, stale evidence and missing data are shown as unknown; duplicate work is blocked.
- Audits, budget/permission limits and manual stop tested before Production enablement.

Dependencies: Agent OS #240/#242 Production pilot, CRM #250, intake #248, Content Studio #255, SEO #256.
