# VNC OS — Multi-Site Content Studio rollout

## Scope and current delivery

Implemented in isolated PR: additive Site/Page/PageRevision Prisma models, migration, site allowlist, safe content-block vocabulary, admin-only draft list/create endpoint, tests and publication guard contracts.

- Site keys: `vietnamclothing.vn` (English global B2B) and `attd.vn` (Vietnamese domestic B2B).
- `aothunthongdiep.com` is NOT automatically treated as ATTD and needs separate ownership/site approval.
- Existing ATTD homepage/CMS/navigation/SEO and VNC staging HTML remain live sources until cutover; this work does not replace them.
- Revision content is versioned JSON with allowlisted blocks. Never render raw HTML unsanitized.

## Required next phases before enabling content editing in production

1. DBA review and apply migration against **staging**; verify additive-only with backups. No implicit prod `prisma migrate deploy`.
2. Build revision save/submit/review/approval UI with stronger server-side editor identities, audit log, role separation and revision concurrency controls.
3. Implement an atomic publish transaction that checks site/page/revision IDs and approval, then updates publishedRevisionId; revalidation should be site-specific.
4. Implement read-only published page resolver and front-end blocks, with strict image rights gate and per-domain asset routing.
5. Move VNC's 9 static staging routes to Content Studio with a content audit and URL/SEO migration map; keep staging noindex until approved.
6. Gradually opt ATTD pages into Studio; use fallback to legacy CMS and verify legacy URL and forms remain intact.
7. Add MediaUsage provenance/rights checks, SEO metadata preview, navigation per site, scheduled publish, version diff/rollback and analytics.
8. Cross-domain isolation tests (write, publish, image reuse, redirects) and editor acceptance tests.
9. Verify deployment and production publishing using smoke tests, approvals and a documented rollback plan.

**Status:** Foundation only. Publication is NOT enabled; two-website CMS is NOT production-ready.
