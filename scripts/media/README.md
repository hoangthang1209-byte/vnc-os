# Legacy VietnamClothing Media Migration

The local optimizer creates WebP derivatives and JSON manifest from an approved copy. It does NOT fetch Google Drive assets or upload Media Library items.

- Inventory full legacy image archive recursively with source paths, checksums and media dimensions. Retain immutable originals.
- Exclude SQL, config, scripts and credentials from public media pipelines.
- Rights-clear customer, artist, logo and IP assets before publication.
- Map each legacyPublicPath to canonical VNC OS mediaAssetId and safe responsive URLs, preserving or permanently redirecting old public image links where appropriate.
- Validate SEO coverage, Google Images references, transparency, colors, art direction and responsive sizes.
- Import via authenticated, idempotent VNC OS Media Library job; log success/error without secrets.
- Verify consumption by both new website frontends in staging before Production.

Completion requires verified archive inventory, checksums, rights clearance, SEO mapping and successful VNC OS ingestion. Optimized files alone are not complete migration.
