import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { diagnosticAccessStatus } from "@/features/agent-os/g3-production-db-diagnostic-access";

/**
 * Read-only G3 production schema preflight. Never returns DATABASE_URL, server
 * hostname, roles, SQL error messages, row contents or migration logs.
 * Owner-only until a dedicated infrastructure diagnostics permission exists.
 */
export async function GET(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  const denied = diagnosticAccessStatus(session, process.env.VERCEL_ENV);
  if (denied !== null) {
    const message = denied === 401 ? "Unauthorized" : denied === 403 ? "Forbidden" : "Not found";
    return NextResponse.json({ message }, { status: denied, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw<Array<{
      database_name: string;
      agent_run: boolean;
      task_run: boolean;
      g3_task_lease: boolean;
      migration_history: boolean;
    }>>`
      SELECT current_database() AS database_name,
        (to_regclass('public."AgentRun"') IS NOT NULL) AS agent_run,
        (to_regclass('public."TaskRun"') IS NOT NULL) AS task_run,
        (to_regclass('public."G3TaskLease"') IS NOT NULL) AS g3_task_lease,
        (to_regclass('public."_prisma_migrations"') IS NOT NULL) AS migration_history
    `;
    const row = rows[0];
    if (!row) throw new Error("Empty database response");
    // Only query migration history after confirming its table exists.
    let migrationCount: number | null = null;
    let latestMigration: string | null = null;
    let failedMigrations: number | null = null;
    if (row.migration_history) {
      const history = await prisma.$queryRaw<Array<{
        applied_count: bigint;
        failed_count: bigint;
        latest_name: string | null;
      }>>`
        SELECT COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied_count,
          COUNT(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS failed_count,
          (SELECT migration_name FROM "public"."_prisma_migrations"
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
           ORDER BY finished_at DESC LIMIT 1) AS latest_name
        FROM "public"."_prisma_migrations"
      `;
      migrationCount = Number(history[0]?.applied_count ?? 0);
      failedMigrations = Number(history[0]?.failed_count ?? 0);
      latestMigration = history[0]?.latest_name ?? null;
    }
    return NextResponse.json({
      environment: "production",
      databaseName: row.database_name,
      tables: {
        AgentRun: row.agent_run,
        TaskRun: row.task_run,
        G3TaskLease: row.g3_task_lease,
        prismaMigrations: row.migration_history,
      },
      migrations: { appliedCount: migrationCount, failedCount: failedMigrations, latestName: latestMigration },
      minimumSchemaPrerequisitesPresent: row.agent_run && row.task_run && row.migration_history && failedMigrations === 0,
      note: "Read-only table-presence preflight only; does not establish Neon project/branch identity, schema drift compatibility, backup readiness, or migration authorization.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Database diagnostic unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
