# Legacy VietnamClothing — initial verified URL inventory (2026-10-26)

> Initial discovery only. **Not** a complete crawl or backup. No domain cutover is authorized.

| Existing URL | Observed role | Migration requirement |
| --- | --- | --- |
| https://www.vietnamclothing.vn/product | Legacy product listing with search, fabric, printing, service and size filters; pagination | Preserve route and equivalent category/filter functionality or plan per-URL mappings |
| https://www.vietnamclothing.vn/search | Vietnamese product search | Preserve search utility or map to equivalent, never homepage |
| https://www.vietnamclothing.vn/en | English home with products, services and printing techniques | Preserve language intent and localized canonical |
| https://www.vietnamclothing.vn/en/search | English search | Preserve language-specific route |
| https://www.vietnamclothing.vn/support | Support article index | Inventory every child article |
| https://www.vietnamclothing.vn/support/huong-dan-thanh-toan | Legacy help article | Preserve existing content URL if possible; carefully assess sensitive payment details before publication |

Sources: public pages indexed and retrieved 2026-10-26. Existing product list includes multiple products and multiple pagination pages. Do not equate staging `catalog.html` with full legacy catalog migration.

## Next crawl/backup gates
1. Resolve canonical host and record HTTP responses, canonical tags, robots and actual sitemap(s); raw sitemap/robots fetch was unavailable during this initial inspection.
2. Crawl complete existing website including pagination, query handling, article detail, product detail, images, PDFs, localized pages and JS-rendered links. Store full URL manifest with status, canonical, title, meta description, headings, schema, media URLs and internal links.
3. Archive HTML/media snapshots, checksums and immutable restore-tested backup. Export CMS data/database with secured access if available.
4. Gather GA4/GSC baselines and top landing pages before approving redirects. Preserve old URLs where possible. Produce explicit 301/308 map only for genuine equivalents.
5. Block launch unless redirect coverage, 404, sitemaps, noindex, RFQ, CRM, performance and mobile QA pass.

Do not publish any unverified legacy-product claims or client imagery into the new site without rights review.
