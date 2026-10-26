# System architecture and boundaries
**Date recorded:** 2026-10-26.

## Logical layers
1. **Public brands:** VietnamClothing (global English B2B) and ATTD (domestic Vietnamese B2B), separate SEO, content and approved media publication.
2. **Application:** VNC OS with admin RBAC, CRM/shared lead inbox, Media Library, Content Studio, sales/operations features.
3. **Automation:** Agent OS = issue/task truth, Builder/AgentRun, CI/review, heartbeat and controlled deploy gates.
4. **Leadership:** proposal-first Chief Orchestrator, Technology, Operations, Risk/QA. Human approval and independent review for irreversible/high-risk actions.
5. **Delivery:** GitHub code/CI and Vercel deployment/aliases; GitHub records do not prove live site state.

## Constraints
- Production `os.vietnamclothing.vn` and `attd.vn` have shared Vercel project infrastructure: inspect alias and deployed SHA before release.
- VNC Content Studio PR #255 foundation is not Production publishing-ready; database migration requires DBA/staging gates.
- VNC catalog staging is not a complete replacement for legacy product inventory.
- Published media requires provenance and rights verification at server-side publication boundary.
- Security/privacy: never store credentials, customer PII or raw leads in project memory.

Refer to implementation code and live infrastructure for authoritative specifics.
