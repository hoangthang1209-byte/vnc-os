# Demo content workflow — VietnamClothing staging

**Owner request:** use illustrative products/images now, edit real catalog later.

## What exists
- `demo-catalog-data.json`: 5 fictional sample products, deliberately `status: DRAFT`, `publicApproved: false`, `mediaRightsApproved: false` and `demo: true`.
- `demo-media/*.svg`: original non-photographic labeled concept illustrations. These are **not** customer or factory portfolio images.
- `catalog.js`: when the approved public feed is empty, may use these demo records **only on VNC preview Vercel hosts or localhost**. It clearly labels all cards and PDPs as DEMO and NOT FOR SALE.
- `catalog-data.json`: real/public approved feed remains empty. The demo does not write to a live database, bypass publication gates, or make inventory claims.
- VNC OS Content Studio **draft PR #255** adds permission-checked `/admin/content-studio/demo-products`, local browser editing and `Export demo JSON`. It **does not persist to a shared database** or update website deployments automatically.

## To edit / promote
1. Edit demo titles and descriptions in the permission-gated draft editor (after CMS branch has passed review and is deployed on a safe environment).
2. Download JSON; have an authorized editor review and commit to the website branch, without modifying the safety fields.
3. To replace demo with real products, import actual product/media via approved VNC OS publishing workflow **after** schema and rights controls are enabled; never change `DRAFT` to `PUBLISHED` only to make demo visible.
4. Clear demo fallback before any Production cutover, verify customer-visible text, responsive UI, copyright/rights, SEO URLs and RFQ→CRM.

No secrets, customer names, real brand endorsements or invented prices/capacity.
