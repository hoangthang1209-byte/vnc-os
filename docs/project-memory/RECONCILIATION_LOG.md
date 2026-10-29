# Reconciliation log
Initial review: 2026-10-26. Evidence is time-bounded.

| ID | Claim | Observation | Classification | Action |
|---|---|---|---|---|
| REC-2026-001 | Chat history fully covered | Available project summaries and GitHub records do not establish access to all past chats | INACCESSIBLE_HISTORY | Request/export history only when necessary, record confidence |
| REC-2026-002 | Agent OS PR merged means live dispatch proven | [PR #242](https://github.com/hoangthang1209-byte/vnc-os/pull/242) merged, but no authenticated end-to-end Cursor runner evidence | UNVERIFIED | Run authorized pilot and attach AgentRun ID |
| REC-2026-003 | Project Memory documents available on default branch | [PR #260](https://github.com/hoangthang1209-byte/vnc-os/pull/260) opened as draft; files live on feature branch only until merged | SOURCE_CHANGED | CI, review then merge |
| REC-2026-004 | CRM leads count is zero | [Issue #250](https://github.com/hoangthang1209-byte/vnc-os/issues/250) reports failed query; zero cannot be inferred | CONFLICT | Validate DB and read-only diagnostics |

| REC-2026-005 | VNC staging build failed | Original deploy `dpl_9EZRQpudadPk1eR8JP1zxDxwPcDH` ERROR due to root Next.js/Prisma DATABASE_URL; isolated static project root `sites/vietnamclothing` and new deploy `dpl_GitQNMNNatEMQF3y3Sj1Dpfit8Qo` READY on 2026-10-27; authenticated QA still unverified | SOURCE_CHANGED | [PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245), [staging QA gates](https://github.com/hoangthang1209-byte/vnc-os/blob/issue-244-vietnamclothing-website-mvp/sites/vietnamclothing/STAGING_QA_AND_RELEASE_GATES.md) |
| REC-2026-006 | CI results still pending on #245, #255, #258, #260 | Exact-head CI SUCCESS verified for these four PRs on 2026-10-27; all remained OPEN/DRAFT at last check | SOURCE_CHANGED | [PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245), [PR #255](https://github.com/hoangthang1209-byte/vnc-os/pull/255), [PR #258](https://github.com/hoangthang1209-byte/vnc-os/pull/258), [PR #260](https://github.com/hoangthang1209-byte/vnc-os/pull/260) |
