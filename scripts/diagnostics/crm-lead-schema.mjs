/**
 * Read-only production diagnostics for issue #250.
 * Usage: DATABASE_URL=... node scripts/diagnostics/crm-lead-schema.mjs
 * Never runs migrations and never prints row-level CRM data.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const columns = await prisma.$queryRaw`
    SELECT column_name AS "columnName"
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Lead'
    ORDER BY ordinal_position
  `;
  const found = new Set(columns.map((row) => row.columnName));
  const expected = [
    "assignedEmployeeId", "assignedAt", "assignmentSource",
    "phoneNormalized", "emailNormalized", "lastInboundAt",
    "landingPage", "utmSource", "utmMedium", "utmCampaign", "referrer",
  ];
  const missing = expected.filter((name) => !found.has(name));
  const migrationTable = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = '_prisma_migrations'
    ) AS "exists"
  `;
  console.log(JSON.stringify({
    leadTablePresent: columns.length > 0,
    missingLeadColumns: missing,
    prismaMigrationTablePresent: migrationTable[0]?.exists === true,
    action: missing.length ? "Investigate and apply reviewed migration; do not reset DB" : "No missing fields in inspected schema",
  }, null, 2));
  if (!columns.length || missing.length) process.exitCode = 2;
} catch (error) {
  console.error("Read-only CRM schema diagnostic failed:", error?.code ?? "UNKNOWN");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
