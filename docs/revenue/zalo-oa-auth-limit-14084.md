# Zalo OA authorization blocker: -14084

Observed on 2026-10-25 in official Zalo OAuth popup: App Vietnam Clothing 2706 (ID 1896323796184663501), OA Vietnam Clothing (ID 1814500354229784667). Error `-14084` / `App authorization limit reached`.

## Safe recovery
1. Check OA package API eligibility and list of authorized apps in OA Manager.
2. Never revoke an existing app until dependencies are reviewed; no blind upgrade or charges.
3. If over limit, remove an approved unused grant or obtain an eligible plan under provider terms.
4. Retry OAuth and verify granted OA and requested scopes; linked OA != authorized OA.
5. Repeat separately for aothunthongdiep.com; OA ID and package unverified.
6. Enable signed HTTPS webhook only after authenticated grant, staging endpoint, replay-safe consumer and CRM #250 recovery.

Status: blocked on provider OAuth; no verified live Zalo webhook or CRM ingestion. Do not post secrets.
