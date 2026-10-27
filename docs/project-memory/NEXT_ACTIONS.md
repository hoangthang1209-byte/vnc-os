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
