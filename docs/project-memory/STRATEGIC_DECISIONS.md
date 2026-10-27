# Strategic decision record
All dates are decision-record dates; these are not assertions of current runtime health.

| Date | Decision | Why / boundaries | Evidence |
|---|---|---|---|
| 2026-10-26 | Build AI Leadership & Governance **inside existing Agent OS** | Chief Orchestrator, Technology, Operations, Risk/QA first; later CRO/CMO after verified data; no self-approval or autonomous high-risk Production actions | [Issue #257](https://github.com/hoangthang1209-byte/vnc-os/issues/257), [PR #258](https://github.com/hoangthang1209-byte/vnc-os/pull/258) |
| 2026-10-26 | Establish durable Project Memory & Continuity | Versioned GitHub source-backed handovers across ChatGPT sessions and agents; never trust stale status as live | [Issue #259](https://github.com/hoangthang1209-byte/vnc-os/issues/259) |
| 2026-10-26 | Protect legacy VietnamClothing SEO before new catalog cutover | Stage new catalog independently; preserve legacy URLs and content with reviewed migration plan | [Issue #256](https://github.com/hoangthang1209-byte/vnc-os/issues/256) |
| 2026-10-25 | CRM schema incident requires read-only diagnosis before repair | No blind column creation, reset, truncation or unreviewed migrations | [Issue #250](https://github.com/hoangthang1209-byte/vnc-os/issues/250) |

For future decisions add: date, decision, alternatives, owner, affected components, approvals, source, reversal policy.

## Owner-approved brand architecture — 2026-10-27

**Decision:** Three distinct product-led brands, not separated by buyer geography. Both ATTD.vn and VietnamClothing.vn serve domestic **and** international buyers and are to be bilingual (Vietnamese / English). The sites are not translations or duplicates of each other.

| Brand | Core commercial scope | Buyer routing |
|---|---|---|
| **ATTD.vn** | Blank apparel, wholesale B2B apparel supply, standard corporate uniforms, repeat supply contracts | Enterprise or SME ordering uniforms, apparel blanks or ongoing apparel supply — regardless of order value, buyer size, nationality or complexity of supporting OEM work |
| **VietnamClothing.vn** | Entertainment/artist merchandise, branded merchandise, product development, OEM/ODM and project-led sourcing | Brand/agency/entertainment buyer developing branded product, merchandise or custom project — regardless of nationality |
| **aothunthongdiep.com** | Personalized printed apparel, print-on-demand / short-run customization | Individual, small group or buyer primarily requiring personalized prints; ecommerce/self-service features are **not yet approved** |

**Examples are hypothetical routing, not proof of customer relationships:** a large company's staff uniform program → ATTD; YG/BIGBANG or Yeah1 branded fan merchandise project → VietnamClothing; an individual's custom printed shirt → aothunthongdiep.com. Large buyer status alone does not direct work to VietnamClothing. If a uniform order needs specialist product development, ATTD owns the account and can draw on shared technical capabilities; if the primary deliverable is merchandise for resale, VietnamClothing owns the account. Ambiguous briefs are triaged in a shared VNC OS CRM with a single responsible owner.

**Implementation implications:** Distinct sitemap, positioning, catalogs, pricing/RFQ flow and SEO topics; shared VNC OS operations with site/brand isolation and lead provenance. Preserve legacy URLs and verified SEO assets; no automatic domain cutovers, no unsupported claims about clients or manufacturing capacity. Bilingual ATTD and VietnamClothing are approved strategy, **not yet confirmed deployed**. Validate language URL design and hreflang against current routes before implementation.
