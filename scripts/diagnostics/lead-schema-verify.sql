-- Read-only CRM production schema triage (#250)
-- Run with authorized read-only DB role; never share output containing credentials.
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Lead' AND column_name IN ('assignedEmployeeId','assignedAt','assignmentSource','phoneNormalized','emailNormalized','lastInboundAt') ORDER BY column_name;
SELECT indexname FROM pg_indexes WHERE schemaname=current_schema() AND tablename='Lead' AND indexname ILIKE '%assigned%';
SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 30;
