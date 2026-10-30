import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * G3 durable lease CAS. This module is intentionally NOT connected to a
 * dispatcher, API route or background job. Apply the additive migration on an
 * isolated test DB and pass review before enabling any executor.
 *
 * The DB clock is authoritative. Each claim is a single INSERT ... ON CONFLICT
 * conditional UPDATE; competing claimers cannot both win. No raw lease token
 * is persisted or returned. Never log a token or include it in event payloads.
 */
type LeaseDb = Pick<PrismaClient, "$queryRaw">;
type LeaseState = "CLAIMED" | "RUNNING" | "RELEASED";

export type G3DurableLease = {
  taskRunId: string;
  executorId: string;
  headSha: string;
  attempt: number;
  status: LeaseState;
  heartbeatAt: Date;
  expiresAt: Date;
};

export type G3DurableLeaseResult =
  | { ok: true; lease: G3DurableLease }
  | { ok: false; reason: "invalid" | "not_claimed" };

type LeaseIdentity = {
  taskRunId: string;
  executorId: string;
  token: string;
  headSha: string;
};

type LeaseWithTtl = LeaseIdentity & { ttlMs: number };
const SHA = /^[0-9a-f]{40}$/i;

function validIdentity(input: LeaseIdentity): boolean {
  return (
    typeof input.taskRunId === "string" &&
    input.taskRunId.trim().length > 0 &&
    input.taskRunId.length <= 256 &&
    typeof input.executorId === "string" &&
    input.executorId.trim().length > 0 &&
    input.executorId.length <= 256 &&
    typeof input.token === "string" &&
    input.token.length >= 16 &&
    input.token.length <= 512 &&
    typeof input.headSha === "string" &&
    SHA.test(input.headSha)
  );
}

function validTtl(ttlMs: number): boolean {
  return Number.isSafeInteger(ttlMs) && ttlMs >= 1_000 && ttlMs <= 3_600_000;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function result(rows: G3DurableLease[]): G3DurableLeaseResult {
  return rows.length === 1 ? { ok: true, lease: rows[0] } : { ok: false, reason: "not_claimed" };
}

/**
 * Only a QUEUED/RUNNING TaskRun whose parent AgentRun is QUEUED/RUNNING may be claimed.
 * Expired/released leases may be reclaimed with a NEW token; attempt increases.
 * A failed claim must never launch a runner. This is not proof of execution.
 */
export async function claimDurableG3Lease(
  input: LeaseWithTtl,
  db: LeaseDb = prisma,
): Promise<G3DurableLeaseResult> {
  if (!validIdentity(input) || !validTtl(input.ttlMs)) return { ok: false, reason: "invalid" };
  const { taskRunId, executorId, headSha, ttlMs } = input;
  const tokenHash = hashToken(input.token);
  const rows = await db.$queryRaw<G3DurableLease[]>`
    WITH eligible AS MATERIALIZED (
      -- Lock the status rows before evaluating eligibility. Concurrent parent/task
      -- WAITING_* or terminal transitions must serialize with a lease claim.
      SELECT task."id"
      FROM "TaskRun" task
      INNER JOIN "AgentRun" run ON run."id" = task."agentRunId"
      WHERE task."id" = ${taskRunId}
        AND task."status" IN ('QUEUED', 'RUNNING')
        AND run."status" IN ('QUEUED', 'RUNNING')
      FOR UPDATE OF task, run
    )
    INSERT INTO "G3TaskLease"
      ("id", "taskRunId", "executorId", "tokenHash", "headSha", "attempt",
       "status", "heartbeatAt", "expiresAt", "createdAt", "updatedAt")
    SELECT ${randomUUID()}, eligible."id", ${executorId}, ${tokenHash}, ${headSha},
           1, 'CLAIMED', CURRENT_TIMESTAMP,
           CURRENT_TIMESTAMP + (${ttlMs} * INTERVAL '1 millisecond'),
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM eligible
    WHERE TRUE
    ON CONFLICT ("taskRunId") DO UPDATE SET
      "executorId" = EXCLUDED."executorId",
      "tokenHash" = EXCLUDED."tokenHash",
      "headSha" = EXCLUDED."headSha",
      "attempt" = "G3TaskLease"."attempt" + 1,
      "status" = 'CLAIMED',
      "heartbeatAt" = CURRENT_TIMESTAMP,
      "expiresAt" = EXCLUDED."expiresAt",
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE ("G3TaskLease"."status" = 'RELEASED'
           OR "G3TaskLease"."expiresAt" <= CURRENT_TIMESTAMP)
      AND "G3TaskLease"."tokenHash" <> EXCLUDED."tokenHash"
      AND "G3TaskLease"."attempt" < 2147483647
      AND EXISTS (
        SELECT 1 FROM "TaskRun" task
        JOIN "AgentRun" run ON run."id" = task."agentRunId"
        WHERE task."id" = "G3TaskLease"."taskRunId"
          AND task."status" IN ('QUEUED', 'RUNNING')
          AND run."status" IN ('QUEUED', 'RUNNING')
      )
    RETURNING "taskRunId", "executorId", "headSha", "attempt",
              "status", "heartbeatAt", "expiresAt"
  `;
  return result(rows);
}

/** Heartbeat is fenced by owner, token hash, exact head and unexpired lease. */
export async function renewDurableG3Lease(
  input: LeaseWithTtl,
  db: LeaseDb = prisma,
): Promise<G3DurableLeaseResult> {
  if (!validIdentity(input) || !validTtl(input.ttlMs)) return { ok: false, reason: "invalid" };
  const { taskRunId, executorId, headSha, ttlMs } = input;
  const tokenHash = hashToken(input.token);
  const rows = await db.$queryRaw<G3DurableLease[]>`
    WITH eligible AS MATERIALIZED (
      -- Recheck parent and task eligibility under row locks so a concurrent
      -- pause/terminal transition cannot race a successful heartbeat.
      SELECT task."id"
      FROM "TaskRun" task
      INNER JOIN "AgentRun" run ON run."id" = task."agentRunId"
      WHERE task."id" = ${taskRunId}
        AND task."status" IN ('QUEUED', 'RUNNING')
        AND run."status" IN ('QUEUED', 'RUNNING')
      FOR UPDATE OF task, run
    )
    UPDATE "G3TaskLease" lease SET
      "status" = 'RUNNING',
      "heartbeatAt" = CURRENT_TIMESTAMP,
      "expiresAt" = CURRENT_TIMESTAMP + (${ttlMs} * INTERVAL '1 millisecond'),
      "updatedAt" = CURRENT_TIMESTAMP
    FROM eligible
    WHERE lease."taskRunId" = eligible."id"
      AND lease."taskRunId" = ${taskRunId}
      AND lease."executorId" = ${executorId}
      AND lease."tokenHash" = ${tokenHash}
      AND lease."headSha" = ${headSha}
      AND lease."status" IN ('CLAIMED', 'RUNNING')
      AND lease."expiresAt" > CURRENT_TIMESTAMP
      AND EXISTS (
        SELECT 1 FROM "TaskRun" task
        JOIN "AgentRun" run ON run."id" = task."agentRunId"
        WHERE task."id" = lease."taskRunId"
          AND task."status" IN ('QUEUED', 'RUNNING')
          AND run."status" IN ('QUEUED', 'RUNNING')
      )
    RETURNING "taskRunId", "executorId", "headSha", "attempt",
              "status", "heartbeatAt", "expiresAt"
  `;
  return result(rows);
}

/** An expired or superseded worker cannot release a newer worker's lease. */
export async function releaseDurableG3Lease(
  input: LeaseIdentity,
  db: LeaseDb = prisma,
): Promise<G3DurableLeaseResult> {
  if (!validIdentity(input)) return { ok: false, reason: "invalid" };
  const { taskRunId, executorId, headSha } = input;
  const tokenHash = hashToken(input.token);
  const rows = await db.$queryRaw<G3DurableLease[]>`
    UPDATE "G3TaskLease" SET
      "status" = 'RELEASED',
      "expiresAt" = CURRENT_TIMESTAMP,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "taskRunId" = ${taskRunId}
      AND "executorId" = ${executorId}
      AND "tokenHash" = ${tokenHash}
      AND "headSha" = ${headSha}
      AND "status" IN ('CLAIMED', 'RUNNING')
      AND "expiresAt" > CURRENT_TIMESTAMP
    RETURNING "taskRunId", "executorId", "headSha", "attempt",
              "status", "heartbeatAt", "expiresAt"
  `;
  return result(rows);
}
