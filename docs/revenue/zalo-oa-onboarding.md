# Zalo OA onboarding — VietnamClothing + aothunthongdiep.com

## Known account scope
Owner reports existing Zalo Official Accounts for **vietnamclothing.vn** and **aothunthongdiep.com**. OA IDs, developer application and OpenAPI eligibility have **not yet been verified**. Do not assume a new ATTD OA exists.

## Owner-side checklist
1. Sign into OA Manager for both organizations and verify admin permissions, verification state and API-entitled OA plan.
2. Sign into Zalo Developer App Manager; inspect existing applications before creating a dedicated VNC OS integration application.
3. Associate and authorize each OA through the official Zalo OAuth/permission process; do not post app secrets or OA access tokens in GitHub.
4. Record only non-secret OA numeric identity, brand/source mapping, app ownership and granted scope in a restricted integration configuration.
5. Register provider-approved HTTPS webhook only after a signed-request verification and replay-safe event consumer has been deployed and tested.
6. Perform controlled messages to each OA. Verify identity and event mapping stays separated by OA ID and channels are not merged together.
7. Store identity-free chat as conversation event, not a forged CRM contact. Convert to lead only when a verified contact route or qualified RFQ permits it.
8. Hold live CRM intake switch until incident #250 is fixed, #248 intake is verified and data/privacy agreements are reviewed.

## Canonical CRM event contract
- Provider: ZALO_OA, sourceAccountId: actual OA ID, sourceSite: mapped brand/domain, externalEventId: unique provider event ID.
- Verify authenticity before normalization. Prevent duplicate events using provider+OA+event id.
- Never log OAuth tokens or customer message content in plain request logs; store only fields needed for sales follow-up under role-based access.

**Status:** preparation only. No OA connected, no OAuth token captured, no live webhook configured by this document.
