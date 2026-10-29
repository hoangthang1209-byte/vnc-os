# Incidents and blockers
**Snapshot:** 2026-10-26 — do not treat this as incident resolution.

## P0 CRM #250 — OPEN
Observed error: Prisma `lead.findMany()` refers to missing `Lead.assignedEmployeeId` Production DB column. Real lead count is **UNKNOWN**, not zero. Do read-only schema and migration inspection first. Never blindly reset DB or add column without schema review. [Issue #250](https://github.com/hoangthang1209-byte/vnc-os/issues/250).

## P0 Cross-branch Production release risk
ATTD V9 changes were deployed from branch SHA `e14b03b`; Agent OS merge on main `db748294` subsequently deployed READY. Verify actual pages, route health and ATTD assets before calling this safe. Rollback must be documented.

## P0 Agent OS genuine-run acceptance
PR #242 is merged but real authenticated `/admin/automation` smoke, reliable AgentRun/Cursor runner correlation, concurrency lease and dispatch→review pilot remain unproven. [PR #242](https://github.com/hoangthang1209-byte/vnc-os/pull/242).

## P0 CMS and web release gates
Content Studio #255 requires tests, migration approvals and publishing workflow; VNC website #245 requires approved products and rights; SEO #256 requires full legacy inventory before cutover.

When resolving: add cause, mitigation, reviewed commit, staging/prod verification and owner-approved closure.
