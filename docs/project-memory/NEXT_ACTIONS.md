# Next actions (prioritized)
**Recorded:** 2026-10-26. Re-evaluate against live GitHub/Vercel before execution.

1. **Production safety:** inspect current `os.vietnamclothing.vn` and `attd.vn` deployment/alias SHA after Agent OS #242 merge, smoke essential routes, confirm rollback to healthy ATTD V9. No unreviewed deploy.
2. **CRM incident #250:** inspect Production schema/migration read-only, backup, prepare reviewed additive repair or correct query, staging test, authorized Production fix and true Lead count smoke.
3. **Agent OS acceptance:** authenticated lane board and real AgentRun heartbeat; pilot dispatch with Cursor run-id, scoped lease, CI/review and stop/retry gate.
4. **AI Leadership #257/#258:** CI and review of governance policy, then read-only dashboard, human-approved planning workflow and audited pilot.
5. **Project Memory #259:** merge reviewed documentation and add regular evidence-based update procedure to release/handover checklists.
6. **CMS #255:** verify exact-head CI and address remaining failures; staging migration and editor/publish gates.
7. **Catalog #245, SEO #256, intake #248:** preserve existing URLs/media, connect approved product export, RFQ-to-CRM E2E before cutover.

Never state completion without relevant source evidence.

## Immediate operating pilot — 2026-10-28 (owner intent recorded 2026-10-27)
**P0 #262:** Operational readiness gate for Linh/Chi 3–5 orders in outsourced-workshop production. Refer to `OPERATIONS_ADOPTION_PILOT_2026-10-28.md`. Verify authenticated Production Order/Production UI, role-limited team logins, DB migrations, safe record editing, mobile UX, Vercel SHA/aliases and Zalo/Drive fallback; choose GO / LIMITED GO / NO-GO explicitly. Do not count schema-only evidence as a pass; do not let CRM #250 issue leak into live operations. No new feature or deploy unless reviewed and approved.

## Scope override — 2026-10-27
Deliver the two active sites **ATTD.vn** and **VietnamClothing.vn** first. **Do not execute aothunthongdiep.com work:** external development team owns it for now. Keep strategic positioning documented; resume only after explicit owner instruction. This scope overrides any earlier three-site implementation suggestion.

## Active two-site redesign progress — 2026-10-27
- **ATTD:** [issue #268](https://github.com/hoangthang1209-byte/vnc-os/issues/268), [draft PR #269](https://github.com/hoangthang1209-byte/vnc-os/pull/269), branch `feature/attd-b2b-supply-redesign`: homepage re-positioned to blanks/B2B/uniforms, added responsive `/nguon-hang-ao-tron` acquisition page. No production release. Full site redesign, bilingual EN and existing route/content migration remain **PENDING**.
- **VietnamClothing:** [draft PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245), branch `issue-244-vietnamclothing-website-mvp`: introduced `/vi/index.html` Vietnamese homepage and language switch on English landing page. Other pages not yet fully localized, no approved product feed and no RFQ→CRM end-to-end confirmation. **Do not label site fully bilingual yet.**
- **Release gates:** exact-head CI, independent responsive/a11y QA, authenticated staging and CRM, legacy SEO URL inventory, approved content and media rights, safe rollout. Preserve existing Production domains.

## Multisite CMS implementation update — 2026-10-27
- [PR #255](https://github.com/hoangthang1209-byte/vnc-os/pull/255) now includes permission-gated `/admin/content-studio` for both ATTD.vn and VietnamClothing.vn; site-scoped page listing, demo page forms and DRAFT-only page creation, plus documented `vi/en` site-locales configuration. Release/migration gates: [runbook](https://github.com/hoangthang1209-byte/vnc-os/blob/feature/multisite-content-studio-foundation/docs/content-studio/MULTISITE_ADMIN_ROLLOUT.md).
- **Not yet delivered:** reviewed staging DB migration, per-site user RBAC beyond `cms.manage`, fully localized revision schema, editing of saved draft revisions, publication/media server gates, actual front-end live sync, Production QA. Do not call CMS launched.

## Production release checkpoint — 2026-10-27
- **ATTD redesign** [PR #269](https://github.com/hoangthang1209-byte/vnc-os/pull/269): preview deployment `dpl_9VaoBhbSCPPL6vDCuk9vtPWqXRMb` READY at `cff75020`, CI PASS; **not approved or deployed to Production**. Full site redesign, bilingual pages, legacy SEO and end-to-end RFQ not complete.
- **VietnamClothing** [PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245): staging deployment `dpl_CGnHxKMPtvmyfscWbQjWsVtN5Phx` READY at `a8538c0`, current PR `2467d7f` has CI PASS; later commit is documentation only. Production legacy inventory must not be replaced with demo concepts; bilingual remaining pages, URL migration and CRM RFQ pending.
- **Multisite CMS** [PR #255](https://github.com/hoangthang1209-byte/vnc-os/pull/255): patched React effect lint in commits `a83788d` and `748146b`, latest-head CI **IN_PROGRESS** as of checkpoint. Schema migration, shared draft editing, per-site RBAC and frontend publication are **unverified/unimplemented**, therefore no Production DB migration.
- **Production caution**: Vercel attd-vn deployments `dpl_95nQziJeteqVKn7FjVfCg1jXgXee` BUILDING and `dpl_13bjf7Cdh5Nyrx7Rqyx1bFbfWeFp` QUEUED at checkpoint. Inspect actual domain/aliases and regression before any release.
- **Release gate**: require actual authenticated smoke/mobile + forms, URL crawl/backups, approved products/media, reviewed DB migration, rollback and owner approval; never confuse Preview READY with Production acceptance.

## Production eligibility audit — 2026-10-27 evening
Owner requests fast Production testing with minimum review, retaining CI/rollback/DB/SEO safeguards. Open PR inventory has 50+ entries, many historical/superseded; **do not mass-merge**.

**Eligible for small controlled main release once exact-sha smoke and revert are confirmed:** PR #264 Admin operations-first navigation (non-draft, CI PASS, no schema); PR #270 Customer↔Orders navigation (CI PASS, RBAC smoke needed); PR #247 ATTD duplicate mobile CTA fix (CI PASS, site smoke); PR #267 missing-customer snapshot order safety fix (CI PASS, focused route behavior smoke); PR #260 Project Memory docs (CI PASS, no runtime). Consider #265 Admin user editor only after account permission and OWNER safety smoke.

**Code-safe foundations but NOT equivalent to active integration:** #258 AI Leadership policy only; #249 external channel contracts only; #254 Gmail payload validator only; #252 CRM read-only drift diagnostic only; #253 offline image optimization CLI only. CI PASS not proof of operational go-live.

**Do NOT launch as finished products:** #269 ATTD full redesign only first slice; #245 VietnamClothing new website still missing full bilingual/legacy SEO migration/RFQ—*separate Vercel project Production deployment READY at SHA 2467d7fa, **not** custom domain cutover*; #255 multisite CMS CI PASS but schema migration, per-site permissions, editing/publishing integration not production approved; #248 multisite lead intake depends on CRM incident #250 and backend adapters and production secret; #274 supplier duplicate checks and #265 user management alter critical operations and warrant focused authenticated tests.

**Live Vercel observation:** attd-vn production deployment from main `22ee7745` BUILDING at this snapshot; VietnamClothing preview project Production READY SHA `2467d7fa`. Preserve currently aliased Production until release verification. No bulk Production deployment was executed by this audit.

## Execution checkpoint — 2026-10-28
- **VietnamClothing deployment:** production-target deployment of *independent Vercel project* `vnc-merchandise-preview` now READY, deployment `dpl_DdoRPtcFwSKRzKQjowEiJBqX5FxA`, exact website SHA `4e33422fee492e4674e77a4012e9c820f954c17b`. Includes DEMO concepts/articles and EN/VN switch UI; this **does not transfer vietnamclothing.vn custom domain**, and owner testing still needed.
- **Multisite CMS #255:** added site-scoped page revision GET/PUT API with append-only DRAFT revisions and version-conflict guard at `2fd7c3198357a9479ebf8b87ccadcc5863bac05c`; exact-head CI initially IN_PROGRESS. Database staging migration, UI edit wiring and publishing still pending. Do not claim full CMS rollout.
- **All other workstreams:** no bulk PR merges or production migration attempted. Keep ATTD redesign PR #269, CRM incident #250 and dependencies, RBAC/Admin, Agent OS and Supplier issues in prioritized queue. `aothunthongdiep.com` remains explicitly PAUSED (external team).


## CMS implementation checkpoint — 2026-10-29 (verified by GitHub/Vercel connector)
- CMS PR #255 remains OPEN/DRAFT, base `main`, and was 23 commits behind `main` before the next implementation commit. Latest CMS head after the change: `09a5de452fe7f53b9e51b1d8e74298b9472ae7c6`; **not merged**.
- Implemented in `src/app/admin/content-studio/MultisiteStudio.tsx`: select an existing page from the active site, read the newest site-scoped revision, edit supported hero/richText/cta blocks, and append a DRAFT with expectedVersion optimistic locking. Switching sites clears the editor. Unknown advanced blocks disable this limited editor to avoid lossy roundtrips. This is a code commit, **not** a tested Production feature.
- Vercel check observed `pending` immediately after commit; no successful exact-head CI, browser QA or authenticated Admin smoke yet. No CMS DB migration, data import, publish or Production deployment performed.
- Shared `attd-vn` Production deployment `dpl_Dbb2ifxEWkHPxRm6XimrxTnac5uK` READY at `f4571dc835e7eed706200b08a744a91257d6a102`. VietnamClothing standalone project deployment `dpl_DdoRPtcFwSKRzKQjowEiJBqX5FxA` READY at `4e33422fee492e4674e77a4012e9c820f954c17b`; these states do not prove authenticated smoke or domain cutover.
- Next technical dependencies: confirm exact-head CI and reconcile `main`; fix concurrency test and stale editor flows; design site-scoped permissions and scoped Product/Article/Media schema with additive migration; test on staging with DB backup; only then demo import and standalone VNC published-content resolver. Preserve legacy Product/CRM; never import DEMO as sellable.
