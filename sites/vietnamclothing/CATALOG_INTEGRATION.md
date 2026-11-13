# VNC B2B catalog staging contract (26 October 2026)

## Scope
- `catalog.html`: PLP + five query-linked category views; category and name filtering.
- `product.html?slug=...`: one published product detail at a time.
- `catalog.js`: consumes `catalog-data.json` as a **temporary public read-only export**.
- No genuine product data has been seeded. Empty state is expected until approved export.
- Staging remains `noindex,nofollow`. Do not cut over the production domain.

## Export JSON
```json
{
  "site": "vietnamclothing.vn",
  "schemaVersion": 1,
  "products": [{
    "site": "vietnamclothing.vn",
    "status": "PUBLISHED",
    "publicApproved": true,
    "mediaRightsApproved": true,
    "slug": "approved-product-slug",
    "title": "Verified product name",
    "category": "apparel",
    "summary": "Approved product summary",
    "description": "Approved product description",
    "media": [{
      "url": "https://public-cdn.example.com/approved-image.webp",
      "alt": "Approved descriptive alt text",
      "visibility": "PUBLIC",
      "approved": true,
      "usageRightsApproved": true
    }]
  }]
}
```
Schema sample is illustrative **only**: never publish its fictional entry. Allowed category keys: `entertainment`, `promotional`, `corporate`, `sourcing`, `apparel`. Publish only company-verified records.

## Publisher controls (must be implemented server-side before live export)
1. Authenticate publishing staff using `cms.manage`; require review/approval and per-site isolation.
2. Use authoritative publication status, approved rights-cleared PUBLIC media, and valid public URL before including a record. Do **not** trust browser-side filtering for authorization.
3. Atomic export of a public JSON snapshot with last-known-good rollback. Exclude private source metadata, customer identities, draft revisions, internal prices, and secrets.
4. Validate unique slugs and site-specific canonical paths. Maintain a reserved-slug inventory against legacy SEO before cutover.
5. Purge CDN cache only after valid publish. Version snapshots, log audit records and test a revert.
6. Route RFQ to the canonical secured CRM intake only after Issue #250 is resolved and end-to-end verified. Current CTA points to the explicitly labeled mailto form.
7. Test SEO migration redirects, gallery/media permission, 404, mobile/a11y, and API resilience before enabling indexability.

## Limitations
Static `product.html?slug=` is a staging PDP shell, **not yet** a crawlable per-product SEO route. Production needs a server-rendered/SSG product route and canonical per-slug URL with sitemap generation based on published records. Category query URLs should not be indexed as standalone SEO landing pages until clean server-routed equivalents exist.

## Suggested VNC OS models
`StudioProduct`: siteId, slug, categoryKey, title, summary, description, status, publishedRevisionId, seoTitle, seoDescription, canonicalPath, publishedAt.
`StudioProductRevision`: productId, version, content JSON, authorId, reviewerId, approval status, timestamps.
`StudioProductMedia`: productId, mediaId, sortOrder, alt, publicApproved, rightsAuditId.
Media Library remains the source of truth for approved media and rights. No production migration is included in this branch.
