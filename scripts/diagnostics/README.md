# CRM Production Lead Schema Drift — Issue #250

## Incident
The live CRM Leads screen showed Prisma error: `Lead.assignedEmployeeId` does not exist in the database. The tracked Prisma `Lead` model *does* declare this column. Treat as possible migration/deployment drift pending actual database verification. Do **not** interpret the failed page's `0 leads` as a valid count.

## Read-only evidence gathering
1. Confirm live deployment SHA, environment, correct database/project and a recent restorable backup. Do not print credentials.
2. From an authorized, audited environment, run `node scripts/diagnostics/crm-lead-schema.mjs` using the production `DATABASE_URL` supplied via secret manager; never paste connection strings into logs, PRs or chat. Script queries `information_schema` only and does **not** change data.
3. Check `_prisma_migrations` state against committed migration directory (never assume a single missing column is the only divergence).
4. Diagnose any missing foreign-key prerequisites, indexes or dependent columns. Prefer a reviewed additive Prisma migration; do **not** run `prisma migrate reset`, destructive `db push` or ad hoc edits in production.
5. Run in staging, check Lead list/detail/edit and previous records, then gated production rollout with rollback strategy and post-deploy smoke.
6. Block live Gmail Watch and new website RFQ integrations until the canonical CRM intake works end-to-end.

**This runbook is not authorization to write to the production database.**
