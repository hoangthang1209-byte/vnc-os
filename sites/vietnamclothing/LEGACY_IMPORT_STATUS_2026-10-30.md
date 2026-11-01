# VietnamClothing legacy import — verified offline extraction (2026-10-30)

Source: owner-designated Google Drive legacy SQL dump (dated 2026-07-11). This is a *migration baseline*, not evidence of a live SATEK snapshot.

## Extracted offline, not published
- 9 `qsv_product` records; only **1** with `Active=1` in this dump.
- 9 products have legacy `/files/...` image references, **39** total references in `Anh` + `Slide`.
- 376 `qsv_files` registry rows with storage path and public display filename.
- 8 `qsv_article` rows; 285 URL rewrites and 345 redirect rows.
- Source product language values: `vn`; do not invent EN translations.

## Media constraints
A folder listing confirmed `source/upload/data` has date-organized child folders and `source/upload/thumb` contains cached image sizes. **This does not prove the 39 original image bytes exist**, or that their rights permit public use. The public `/files/...` route is resolved dynamically by legacy PHP; matching a URL to a stored object requires reading `qsv_files` and the legacy `file.php` / storage logic. Do not point Vercel to Drive links or mark media approved based on folder presence alone.

## Next integration gates
1. Complete per-image resolution and byte match; record checksum, mime, storage and rights approval.
2. Reconcile legacy types/category IDs with the canonical VNC OS CMS schema. Existing public feed expects `site=vietnamclothing.vn`, `status=PUBLISHED`, `publicApproved=true`, `mediaRightsApproved=true`, approved public HTTPS media objects and category from `entertainment|promotional|corporate|sourcing|apparel`. Legacy `Active=1` does not confer publication or rights approval.
3. Import approved records into canonical CMS, then export feed / verify EN+VI Catalog and PDP; no separate CMS/database.
4. Secure server-side RFQ to existing CRM intake, with rate limits and source attribution. Current contact form uses `mailto:`, not CRM.
5. Map 285 rewrite + 345 redirect rows against URLs and content, verify 301/200 and image paths, canonical, hreflang, sitemap and Search Console baseline before domain cutover.

Privacy: do not commit raw SQL, CRM/legacy customer tables, full media dumps, or credentials. Original site / DNS unaffected.
