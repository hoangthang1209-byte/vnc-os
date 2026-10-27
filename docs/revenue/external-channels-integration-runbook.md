# VNC OS external acquisition integrations — implementation runbook

Owner approval 2026-10-25: Gmail/Google Workspace, Facebook Page + Lead Ads, Instagram Business, Zalo Official Account, WhatsApp Business Platform. **All leads land in the canonical VNC OS shared/unassigned inbox.** No separate CRM.

## Current status
- PR #248: three-website authenticated inbound bridge (Draft; merge/release gates still apply).
- This PR: only a pure, tested, provider-agnostic normalization contract, **NOT** live OAuth, provider signature validation, database ingress or actual inbox collection.
- Never accept provider webhook traffic on the generic `/api/integrations/vnc/leads` path; that endpoint requires a trusted server secret and must never reveal it to Meta/Zalo/browser.
- A social sender ID without a phone/email is a **conversation**, not a contactable canonical lead. Route to secure conversation inbox/staging queue once designed, with retention, dedupe and consent; do not invent phone/email, or drop messages and pretend end-to-end completion.

## Required integration stages in delivery order
| Order | Channel | Setup by account owner (no credentials in chat) | Engineering adapter and acceptance |
| --- | --- | --- | --- |
| 1 | Gmail Workspace | Identify dedicated shared sales inbox / OAuth admin consent; Google Cloud project with Gmail API and Pub/Sub authorized publisher | OAuth read-only scoped mailbox, `users.watch` with renewal, Pub/Sub validation, `history.list` cursor replay/expiry handling, message ID idempotency; customer inquiry filtering and secure intake |
| 2 | Facebook Lead Ads | Confirm Meta Business portfolio, Page, lead access, Meta Developer App and permitted form IDs | HTTPS verification handshake, HMAC signature on POST, subscribed `leadgen` webhook, Graph fetch using permitted token server-side, event+form idempotency, canonical intake |
| 3 | Facebook Messenger | Confirm Page and application messaging permissions | Verify webhook, page-message filtering, sender+message idempotency, keep platform sender ID in conversation store until contact captured |
| 4 | Instagram Business | Confirm professional IG connected to Page, correct app permissions | Verified IG messaging event webhook, thread identity and inbox-to-lead promotion with consent/contact route |
| 5 | Zalo OA | OA Admin confirms linked Zalo App, OpenAPI scopes, OAuth grant and allowed webhook events | Follow vendor-specific webhook signature verification, token storage/refresh, event dedupe, retain UID chat in conversation store until customer contact is obtained |
| 6 | WhatsApp Business Platform | Admin identifies Meta Business WABA and registered phone number; approve Cloud API app | Meta webhook verify/POST signature, messages statuses separation, customer phone normalization and WABA+message idempotency, shared inbox intake |

## Security and operations
1. OAuth and webhook secrets are configured **only** in server-side Vercel environment per deployment stage with least-privilege access and rotation plan. Never put tokens in GitHub, client code, issue comments or test fixtures.
2. HTTPS webhook endpoints per provider, signature validation on **raw request body** before JSON parsing, replay event store uniqueness and strict payload limits. Verify ownership during GET challenge but NEVER use GET verification token for POST authenticity.
3. Retry with bounded backoff, dead-letter queue, rate limits, logging without PII, provider cursor high-watermark; do not acknowledge receipt before durable storage or enqueue.
4. Shared inbox must show source channel/account, message origin, date, conversation/lead state, unassigned owner, SLA age, duplicate linkage and assignment audit. Preserve provider platform IDs privately.
5. Contacts, personal messages and marketing opt-ins are sensitive; comply with Vietnam's data privacy requirements and provider platform policies. Separate operational RFQ response from promotional consent.
6. Test with **synthetic** inquiry per channel: expected one inbound event, at most one matching lead, no duplicate on replay, no false auto-assignment; validate provider retry and webhook invalid-signature rejection. Keep production outbound OFF until approved.

## Dependencies
- #124 canonical lead intake and dedupe, shared inbox/permissions; #243 revenue goals; #248 website bridge.
- Gmail official docs: https://developers.google.com/workspace/gmail/api/guides/push
- Meta official docs: https://developers.facebook.com/docs/graph-api/webhooks/
- WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
- Zalo OA: https://oa.zalo.me/home/documents/guides/Khoi-tao-ung-dung-va-cap-quyen_117071366476220195

## Owner action checklist
- Give a non-sensitive list of connected Page IDs / OA names / mailboxes (do not paste private contacts). App admin performs OAuth and app review within official provider dashboards.
- Confirm eligible Meta, Zalo and Google scopes and permissions for each production account. No passwords, tokens, private keys, app secrets or refresh tokens are to be shared in chat.
- Pilot one mailbox and one Meta Page before connecting all accounts. Approve privacy/retention and personnel access to shared inbox.
