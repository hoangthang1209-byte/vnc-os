# VietnamClothing OEM Website MVP (Issue #244)

Independent, framework-free static HTML/CSS/JS prototype at `sites/vietnamclothing/index.html`. No impact to the existing VNC OS Next.js build or public domain.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server 8000 -d sites/vietnamclothing` and visit http://localhost:8000.

## Current scope
- Responsive English-first B2B OEM/export landing page with six service blocks and process steps.
- Accessible navigation, FAQ-free clear CTA, RFQ inquiry preview, privacy consent.
- **RFQ is NOT live**: currently opens the visitor's email application. No request is transmitted to or persisted in the CRM. Do not switch production domain to this preview.
- Copy does not promise particular certifications, MOQ, production volume, capacity, lead time or export markets without approval.
- No external JS, CDN, analytics, cookies or service secrets.

## Before shipping on vietnamclothing.vn
1. Confirm company details, real service capability, brand identity, approved imagery and actual target buyer segments.
2. Confirm the production website source/host and any current CMS: capture route inventory, 301 redirect plan, sitemap, canonical/hreflang, analytics baseline.
3. Implement a secured server-side RFQ endpoint using the existing **canonical** VNC OS lead intake service (Issue #124), with signed service authentication, server-side validation, spam/rate limits, idempotency, origin attribution (`sourceSite=vietnamclothing.vn`) and structured UTM attribution. Never embed private tokens client-side.
4. Include privacy notice, lawful consent, safe attachment upload when supported, confirmation and failure feedback; test form-to-CRM lead creation, dedupe, assignment and follow-up in staging.
5. Add analytics conversion tracking (consented as required), source attribution, mobile QA at 393x852, accessibility, security, Lighthouse, deployment health and rollback.
6. Release only after preview, CI, independent reviewer, explicit owner sign-off for domain cutover. Existing vietnamclothing.vn remains untouched.

## Operational KPIs
Verified RFQ count, qualified RFQ rate, first response SLA, quote rate, quote-to-order, and actual sales; baseline not yet established.

Related: #244 website program, #243 revenue program, #124 CRM hub, #214 website conversion, #240 Agent OS.
