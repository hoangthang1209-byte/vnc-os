# VietnamClothing.vn — single delivery program

Owner: VNC website workstream. Canonical tracking: GitHub issue #244. This file coordinates work across the **existing** VNC OS Multi-Site CMS and CRM, not new systems.

## Verified baseline (2026-10-30)
- Website staging branch: `issue-244-vietnamclothing-website-mvp`, PR #245 open.
- Vercel project `vnc-merchandise-preview`; latest confirmed READY deployment uses commit `93d69e1862e2dd6223ab809b2777295716baca13`. Later GitHub commits are **not** automatically proven deployed.
- CMS foundation PR #255 open, not enabled in production. Do not assume editor, publish API, media resolver or production migrations exist.
- Legacy SQL: 9 products, 39 image references (34 registry matches and 5 unresolved); 8 articles; 285 rewrites and 345 redirect records. Registry matching is not file-byte/rights verification.
- Public `catalog-data.json` has zero approved products. Demo concepts are preview-only.
- Website RFQ uses mailto, not CRM intake. Public cutover is blocked.

## Workstream and release gates (order matters)
### 1. Legacy product/media evidence
- Resolve every `/files/...` reference through legacy `file.php`, `qsv_files` and storage path.
- Compare source blob existence, MIME, checksum and dimensions; record provenance.
- Explicitly approve each asset's website-use rights; **never infer approval from old Active=1**.
- Keep review manifests private; only approved, sanitised media may enter the public CDN and CMS.

### 2. CMS canonical data model and preview publication
- Reuse existing VNC OS Multi-Site CMS models, APIs and permissions; inspect PR #255/current production architecture before editing.
- Map legacy products, categories, articles, pages and media to site-scoped draft records. Preserve legacy source URL and source language.
- Implement authorized atomic publish/revision state and read-only public resolver. Version public feed schema.
- Confirm one approved real product and image displays on EN/VI Catalog/PDP, while unapproved records remain excluded. Verify web response and CMS audit trail.

### 3. CRM enquiry contract
- Reuse canonical CRM intake from #124. Server-to-server authentication, schema validation, origin restrictions, spam/rate limiting, idempotency, consent handling, safe logging, no tokens in browser.
- RFQ fields: name, email, company, country, category, product slug, quantity, brief, UTM, sourceSite.
- Test creation/dedupe/assignment on a real authorized staging account before replacing mailto.

### 4. SEO migration and release QA
- Inventory 285 rewrites + 345 redirects against live crawl and GSC/GA4; keep 200 legacy URLs where possible; relevant 301 only.
- Preserve dynamic `/files/...` paths or exact asset redirects; test image responses.
- Canonical/hreflang/sitemap/robots and mobile, security, accessibility, RFQ E2E tests; rollback rehearsal.
- Public domain change requires owner's explicit cutover approval. Never modify PA Vietnam DNS, SATEK hosting or production data merely to satisfy a preview gate.

## Definition of done
Production: genuine approved content published through existing CMS, secure CRM RFQ verified, legacy SEO redirects and image URLs validated, monitoring/rollback functional, DNS approved and switched safely.
Preview: separately track code committed, Vercel READY, browser/HTTP tests and CMS/RFQ E2E evidence.
