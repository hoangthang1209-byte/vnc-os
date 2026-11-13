# VietnamClothing website — staging QA & release gates

**Recorded:** 2026-10-27 (Asia/Ho_Chi_Minh). This is a verification checklist, not proof of QA completion.

## Evidence snapshot
- [PR #245](https://github.com/hoangthang1209-byte/vnc-os/pull/245) at `aa7664e298412d576fde76f1b9052f8785eb2fcc`: GitHub CI SUCCESS.
- Vercel project `prj_TJrHBZDRFxkzvBcT3vfmeaOrT4ME` rootDirectory corrected to `sites/vietnamclothing`; independent staging deployment `dpl_GitQNMNNatEMQF3y3Sj1Dpfit8Qo` READY.
- Earlier failing deployment `dpl_9EZRQpudadPk1eR8JP1zxDxwPcDH`: incorrect monorepo-root Next.js build tried to collect Prisma category page data without DATABASE_URL.
- READY != publicly accessible or browser QA. Preview has Vercel deployment protection; independent unauthenticated browser requests may fail.

## Mandatory checklist before website launch
- [ ] Authorized browser loads homepage, Solutions, Entertainment, Apparel OEM, About and Contact, without console/network errors
- [ ] `catalog.html` loads static JSON and correctly displays empty state with zero approved products
- [ ] Category links, search and filters work without XSS or unapproved content disclosure
- [ ] `product.html` gracefully rejects nonexistent slug and renders only a published, rights-cleared record
- [ ] Media usage provenance and rights confirmed on server side (client-side guard alone is not sufficient)
- [ ] Contact/RFQ POST: spam defenses, consent, idempotency and real CRM lead end-to-end validated after CRM incident #250 is resolved
- [ ] Legacy `/product`, `/search`, `/en`, `/support` and relevant assets crawled and backed up; URL-level SEO mapping reviewed against live website
- [ ] Mobile responsive, accessibility, indexability and analytics reviewed
- [ ] Named owner approves launch, rollback prepared, new domain cutover explicitly authorized

## No-go conditions
Never replace live VietnamClothing catalog with empty JSON inventory; never bypass rights approvals; never treat Vercel READY as functional smoke; never alter production DNS automatically.
