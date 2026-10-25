# Gmail Workspace → VNC OS CRM: release gates

The existing Pub/Sub validator is NOT a deployed worker.

1. OAuth consent, least privilege, encrypted refresh token, revocation and expiration checks.
2. Start Gmail users.watch only after Pull subscriber and CRM intake are validated.
3. Pub/Sub payload carries historyId, not message contents. Maintain durable per-mailbox history cursor; fetch changes via Gmail History API.
4. Idempotency on Gmail message/change identity, ACK only after durable processing, retry/dead-letter on failure.
5. Recover from expired History cursor (404) with controlled reconciliation.
6. Avoid logging message bodies, secrets, and PII. Enforce source attribution and access permissions.
7. Test replay, out-of-order notifications, OAuth expiry, CRM outage, subscription lag and one inquiry → one canonical CRM lead.
8. Never enable live Watch until CRM Production incident #250 is resolved and staged end-to-end checks pass.
