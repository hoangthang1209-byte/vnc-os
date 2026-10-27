# Multisite Content Studio — release and operations runbook

Recorded 2026-10-27; branch `feature/multisite-content-studio-foundation`, PR #255.

## Implemented, pending merge and QA
- Admin route `/admin/content-studio`: requires valid authenticated admin session and `cms.manage`.
- Site picker scopes API calls to `attd.vn` or `vietnamclothing.vn`.
- Lists pages by site via `GET /api/admin/content-studio/pages?siteId=...`.
- Creates site-scoped page and immutable first DRAFT revision via existing guarded POST endpoint; no publish action.
- Includes a separate editorial draft example for each site, distinct brand positioning.
- Locales declared: ATTD `vi` then `en`, VietnamClothing `en` then `vi`. Existing `StudioSite.locale` remains a default locale only: fully localized page model, slug mapping and frontend publication are **NOT IMPLEMENTED**.
- Existing `/admin/content-studio/demo-products` is a local browser-only demo editor; NOT a shared product CMS.

## Mandatory gates
1. DBA review Prisma schema and migration history against **actual** target DB using read-only checks; address CRM #250 first.
2. Snapshot/backup with verified restore plan. Prepare reviewed, additive migration for StudioSite, StudioPage, StudioPageRevision, test on staging.
3. Verify `cms.manage` RBAC, blocked 401/403 paths, and no data leak or cross-site writes. UI site selection is not an authorization boundary on its own; current API grants `cms.manage` rights across both registered sites.
4. Create distinct demo drafts for both sites on staging. Check `/nguon-hang` (ATTD) and `/merchandise` (VNC) content without overwriting existing Production routes.
5. Introduce per-site/per-locale revision storage, review workflow with separation of duties, server-side rights approvals for media and safe atomic public export (not in this PR).
6. Run full UI/mobile accessibility and Production regression tests on ATTD V9 and VietnamClothing legacy URLs. Human release approval required.

## No-go
No Product/Lead schema reset, no Production auto-seeding, no direct publishing or DNS changes. CI PASS and editor UI alone do not make this Production-ready.
