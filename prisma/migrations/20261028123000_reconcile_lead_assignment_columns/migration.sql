-- Additive reconciliation for production Lead schema drift (#250).
-- Apply through reviewed deployment migration process; never run db push/reset.
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedEmployeeId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignmentSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailNormalized" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastInboundAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Lead_assignedEmployeeId_idx" ON "Lead"("assignedEmployeeId");
CREATE INDEX IF NOT EXISTS "Lead_phoneNormalized_idx" ON "Lead"("phoneNormalized");
CREATE INDEX IF NOT EXISTS "Lead_emailNormalized_idx" ON "Lead"("emailNormalized");
CREATE INDEX IF NOT EXISTS "Lead_lastInboundAt_idx" ON "Lead"("lastInboundAt");
