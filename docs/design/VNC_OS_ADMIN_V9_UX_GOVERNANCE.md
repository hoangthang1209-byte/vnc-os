# VNC OS Admin V9 — UX Governance & Release Contract

**Status:** Design governance. This document does not claim full V9 visual parity or production release.

## Authority
- Preserve the approved V9 Final HTML as the visual/information-architecture reference. Do not invent V10 or replace functional modules with mock dashboards.
- Audit reference: `docs/design/VNC_OS_V9_FULL_HTML_PARITY_AUDIT.md`.
- Existing 8 domains remain the only top-level navigation groups. A contextual detail view is not necessarily another sidebar entry.

## One operational destination per question
- **Đơn hàng:** which customer orders need action, and who owns them?
- **Điều hành sản xuất** (`/admin/production`): what production jobs require action now?
- **Lịch & tiến độ** (`/admin/manufacturing/production-timeline`): when is each job planned or due? Keep as a secondary focused view.
- **QC:** inspection belongs to the actual OrderItem / Production Job; navigate with verified record IDs and permission checks. Do not introduce a duplicate QC database.
- **Documents:** show an attached document only when a validated record relation exists; a route shortcut is not a linked document.

## Mandatory layout conventions
1. One page header: breadcrumb, page title, optional brief description, one primary action. Avoid duplicate title banners.
2. One dominant task region; KPI cards only when they change decisions and are backed by authorized server data. Never mix page-local and global counts.
3. Portfolio tables prioritize identity, owner, due date, operational state, risk and contextual action; progressive disclosure for optional metadata.
4. Detail workspaces prioritize identity/status, next action, connected records, then domain-specific tabs. Preserve unsaved edits.
5. Responsive: compare 1440x900 and 390x844. Mobile cards and dialogs should remain usable; horizontal overflow only for inherently matrix-like data.
6. Common UI primitives: typography, input labels, button hierarchy, status semantics, table density, empty/loading/error states; visual tokens should be shared rather than per-module inventions.
7. All fields and actions gated by role at both API and UI; never render protected financial data in an operational summary.

## Acceptance evidence for each changed screen
- Route, component and backing API listed; reference screenshot and authenticated screenshot on same viewport.
- Role matrix: Owner, Sales, Production, Delivery, anonymous. Exercise both allowed and denied transitions.
- Real data: no demo amounts, fabricated order counts, fake links, or multi-currency aggregation.
- Core task E2E and failure states tested; keyboard focus, tablet/mobile, pagination and filter persistence checked.
- Exact HEAD CI green, correct Vercel project Preview READY, independent review and release approval, plus rollback method.
- Partial slices must be explicitly labeled as partial. CI green is not visual or functional acceptance.

## Migration policy
Changes to labels and sidebar order must keep existing deep-link URLs functional. Do not remove pages or rewrite database schemas as a cosmetic step.
