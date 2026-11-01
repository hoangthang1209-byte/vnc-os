# VietnamClothing legacy source discovery — SEO preservation gate

Date: 2026-10-25. Source: owner-provided archive `vietnamclothing.zip` **locally inspected**, not committed. This document includes no credentials or private content.

## Verified archive structure
- Outer ZIP contains `database.sql` and nested `source.zip`.
- Nested ZIP contains approximately 3,193 archive entries (including directories), of which 832 filenames end in `.php`; total extracted source ~102 MB. This is **not proof** that the full 3.2 GB media set was transferred.
- Legacy root includes `.htaccess`, `robots.txt`, `index.php`, `sitemap.php`, and PHP app/config code. Configuration files may contain secrets: DO NOT commit or paste.
- Legacy `.htaccess` rewrites `/sitemap.xml` and `/sitemap.txt` to `sitemap.php`.
- Images and `/files/...` URLs are dynamically routed through `file.php`; resizing variants also use rewritten `/files` paths. **A static rebuild that copies only physical image paths would break legacy image URLs.**
- All non-file/non-directory routes fall back to `index.php`, so dynamic route derivation needs inspection of PHP routing logic **plus** `qsv_seo_rewrite` and `qsv_seo_redirect` SQL records.
- SQL contains URL rewrite, redirects, products, articles, services, multilingual content, metadata and media references; database content is private and MUST NOT be committed wholesale.

## Mandatory migration approach
1. Build an offline inventory from the legacy PHP route resolver + SQL active records and URLs. Include exact per-language and image rendition path; decode text carefully and sanitize private records.
2. Compare inventory to live crawl, Search Console and available analytics before identifying indexed/high-value URLs. Archive DB entries are *not* proof of indexation.
3. Retain legacy URLs with 200 on new frontend where possible. Only explicit 1:1 relevant 301 mapping for unavoidable URL changes. Preserve /files rewritten URLs or provide equivalent server-side image resolver/redirect to immutable hosted assets.
4. Preserve page intent, article/product/service content, titles/descriptions, OG/schema, internal links, canonical, hreflang, robots and sitemap coverage, including compatibility `sitemap.xml` (and `sitemap.txt` if needed).
5. Centralize approved, sanitized migrated content and images under **VNC OS as SSOT**; no independent live PHP operational DB, CRM or CMS.
6. Stage and run old-vs-new URL matrix and asset checks (status, redirect hops, content parity, 404/410, canonical, hreflang, robots, mobile performance), with GSC baseline and rollback. No domain cutover until SEO/owner signoff.

## Important restrictions
- Current #245 `sites/vietnamclothing/index.html` is design-only; NOT deployed under the production domain, NOT a migration target yet, and NOT connected to canonical CRM.
- Never expose legacy `config/config.php` secrets, member/customer/request rows, or the complete dump on public GitHub.
- Owner's 3.2 GB handover may contain additional media required by the production website; compare file-manifest and SHA before claiming source completeness.

Tracked by #244 and #245.
