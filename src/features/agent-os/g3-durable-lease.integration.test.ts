import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PrismaClient, type Prisma } from "@prisma/client";
import {
  claimDurableG3Lease,
  releaseDurableG3Lease,
  renewDurableG3Lease,
} from "./g3-durable-lease.service";

/**
 * Opt-in REAL PostgreSQL concurrency test, never pointed at Production.
 * Requires an isolated database named *_test or *_ci with the additive G3
 * migration already applied. CI uses ONLY its local PostgreSQL attd_ci service;
 * local manual execution requires an explicit separate test database URL.
 *
 * G3_LEASE_TEST_DATABASE_URL=postgresql://.../vnc_g3_test
 * NODE_OPTIONS=--conditions=react-server npx tsx --test \
 *   src/features/agent-os/g3-durable-lease.integration.test.ts
 */
const testUrl = process.env.G3_LEASE_TEST_DATABASE_URL ??
  (process.env.CI === "true" ? process.env.DATABASE_URL : undefined);
function isIsolatedTestUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const dbName = decodeURIComponent(parsed.pathname.slice(1));
    if (!/^postgres(ql)?:$/.test(parsed.protocol) || !/(?:_test|_ci)$/.test(dbName)) return false;
    // CI can use its local ephemeral PostgreSQL service; NEVER a remote CI DB.
    if (value === process.env.DATABASE_URL) {
      return process.env.CI === "true" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        dbName.endsWith("_ci");
    }
    return true;
  } catch {
    return false;
  }
}

describe("G3 durable lease PostgreSQL CAS (isolated DB only)", { skip: !isIsolatedTestUrl(testUrl) }, () => {
  it("one concurrent winner, fenced heartbeat/release, expiry and takeover", async () => {
    if (!isIsolatedTestUrl(testUrl)) return;
    const db = new PrismaClient({ datasources: { db: { url: testUrl } } });
    const run = await db.agentRun.create({
      data: { agentId: "G3_LEASE_ISOLATED_TEST", triggerSource: "MANUAL_OWNER" },
    });
    try {
      const task = await db.taskRun.create({ data: { agentRunId: run.id } });
      const sha = "a".repeat(40);
      const a = { taskRunId: task.id, executorId: "worker-a", token: "isolated-worker-a-token-123", headSha: sha, ttlMs: 60_000 };
      const b = { ...a, executorId: "worker-b", token: "isolated-worker-b-token-456" };
      const [first, second] = await Promise.all([
        claimDurableG3Lease(a, db),
        claimDurableG3Lease(b, db),
      ]);
      assert.equal(Number(first.ok) + Number(second.ok), 1, "only one executor can claim a TaskRun");
      const winner = first.ok ? a : b;
      const loser = first.ok ? b : a;
      const initial = first.ok ? first : second;
      assert.equal(initial.ok, true);
      if (!initial.ok) return;
      assert.equal(initial.lease.attempt, 1);

      assert.equal((await renewDurableG3Lease(loser, db)).ok, false, "loser cannot heartbeat");
      const renewed = await renewDurableG3Lease(winner, db);
      assert.equal(renewed.ok, true);
      if (renewed.ok) assert.equal(renewed.lease.status, "RUNNING");
      assert.equal((await claimDurableG3Lease(loser, db)).ok, false, "active lease blocks takeover");

      assert.equal((await releaseDurableG3Lease(loser, db)).ok, false, "loser cannot release");
      assert.equal((await releaseDurableG3Lease(winner, db)).ok, true);
      const takeover = await claimDurableG3Lease(loser, db);
      assert.equal(takeover.ok, true);
      if (takeover.ok) assert.equal(takeover.lease.attempt, 2);
      assert.equal((await renewDurableG3Lease(winner, db)).ok, false, "old token is fenced");

      // Expire the CURRENT lease in the isolated test DB; no waiting or prod writes.
      await db.$executeRaw`UPDATE "G3TaskLease" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "taskRunId" = ${task.id}`;
      assert.equal((await renewDurableG3Lease(loser, db)).ok, false, "expired worker cannot renew");
      const third = { ...a, token: "isolated-worker-a-token-789" };
      const reclaimed = await claimDurableG3Lease(third, db);
      assert.equal(reclaimed.ok, true);
      if (reclaimed.ok) assert.equal(reclaimed.lease.attempt, 3);
      assert.equal((await renewDurableG3Lease(loser, db)).ok, false, "superseded token remains fenced");

      // WAITING_* tasks must not retain an actively renewable execution lease.
      // Explicitly release before waiting; resume requires a fresh claim/token.
      await db.taskRun.update({ where: { id: task.id }, data: { status: "WAITING_HUMAN" } });
      assert.equal((await renewDurableG3Lease(third, db)).ok, false, "waiting task cannot heartbeat");
      assert.equal((await claimDurableG3Lease({ ...third, token: "isolated-waiting-token-000" }, db)).ok, false, "waiting task cannot be claimed");
      assert.equal((await releaseDurableG3Lease(third, db)).ok, true, "owner may release lease while waiting");
      await db.taskRun.update({ where: { id: task.id }, data: { status: "WAITING_EXTERNAL" } });
      assert.equal((await claimDurableG3Lease({ ...third, token: "isolated-external-token-00" }, db)).ok, false, "external wait cannot be claimed");
      await db.taskRun.update({ where: { id: task.id }, data: { status: "RUNNING" } });
      const resumed = { ...third, token: "isolated-resumed-token-000" };
      const resumedLease = await claimDurableG3Lease(resumed, db);
      assert.equal(resumedLease.ok, true, "resumed task requires a new claim");
      if (resumedLease.ok) assert.equal(resumedLease.lease.attempt, 4);
      assert.equal((await renewDurableG3Lease(third, db)).ok, false, "pre-wait token remains fenced");

      // Parent AgentRun WAITING_* must fence an otherwise runnable child TaskRun.
      // This protects human/external approval boundaries even when child status
      // remains RUNNING. Release before parent pause; resume with a new token.
      await db.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_HUMAN" } });
      assert.equal((await renewDurableG3Lease(resumed, db)).ok, false, "parent human wait blocks heartbeat");
      assert.equal((await claimDurableG3Lease({ ...resumed, token: "isolated-parent-wait-token" }, db)).ok, false, "parent human wait blocks claim");
      assert.equal((await releaseDurableG3Lease(resumed, db)).ok, true, "owner may release during parent wait");
      const deniedAfterRelease = await claimDurableG3Lease(
        { ...resumed, token: "isolated-parent-reclaim-denied-token" }, db,
      );
      assert.equal(deniedAfterRelease.ok, false, "released lease cannot be reclaimed while parent is waiting");
      const heldLease = await db.g3TaskLease.findUniqueOrThrow({ where: { taskRunId: task.id } });
      assert.equal(heldLease.status, "RELEASED", "denied claim must not change the existing lease");
      await db.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_EXTERNAL" } });
      assert.equal((await claimDurableG3Lease({ ...resumed, token: "isolated-parent-external-token" }, db)).ok, false, "parent external wait blocks claim");
      await db.agentRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });
      const parentResumed = { ...resumed, token: "isolated-parent-resume-token" };
      const parentResumeLease = await claimDurableG3Lease(parentResumed, db);
      assert.equal(parentResumeLease.ok, true, "parent resume requires fresh claim");
      if (parentResumeLease.ok) assert.equal(parentResumeLease.lease.attempt, 5);
      assert.equal((await renewDurableG3Lease(resumed, db)).ok, false, "pre-parent-wait token remains fenced");

      await db.taskRun.update({ where: { id: task.id }, data: { status: "SUCCEEDED" } });
      assert.equal((await renewDurableG3Lease(parentResumed, db)).ok, false, "terminal TaskRun cannot heartbeat");
      assert.equal((await claimDurableG3Lease({ ...resumed, token: "isolated-new-token-0000" }, db)).ok, false);
    } finally {
      await db.agentRun.delete({ where: { id: run.id } });
      await db.$disconnect();
    }
  });
  it("serializes claim and heartbeat against uncommitted wait transitions", async () => {
    if (!isIsolatedTestUrl(testUrl)) return;
    const db = new PrismaClient({ datasources: { db: { url: testUrl } } });
    const run = await db.agentRun.create({
      data: { agentId: "G3_LEASE_STATUS_RACE_TEST", triggerSource: "MANUAL_OWNER" },
    });
    try {
      const task = await db.taskRun.create({ data: { agentRunId: run.id } });
      const lease = {
        taskRunId: task.id, executorId: "race-test-worker",
        token: "isolated-race-test-token-123", headSha: "b".repeat(40), ttlMs: 60_000,
      };

      // Hold a row update uncommitted while claim/renew starts in another session.
      // Without row-lock serialization, READ COMMITTED may accept a stale
      // QUEUED/RUNNING snapshot and grant a lease after a WAITING_* transition.
      async function whileTransitionHeld(
        transition: (tx: Prisma.TransactionClient) => Promise<unknown>,
        operation: () => Promise<unknown>,
      ): Promise<unknown> {
        let signalStarted!: () => void;
        let release!: () => void;
        const started = new Promise<void>((resolve) => { signalStarted = resolve; });
        const held = new Promise<void>((resolve) => { release = resolve; });
        const transaction = db.$transaction(async (tx) => {
          await transition(tx);
          signalStarted();
          await held;
        }, { timeout: 10_000 });
        await started;
        const pending = operation();
        // Give the independent connection time to reach the row-lock boundary.
        await new Promise((resolve) => setTimeout(resolve, 100));
        release();
        await transaction;
        return pending;
      }

      const claimedDuringTaskPause = await whileTransitionHeld(
        (tx) => tx.taskRun.update({ where: { id: task.id }, data: { status: "WAITING_HUMAN" } }),
        () => claimDurableG3Lease(lease, db),
      );
      assert.equal((claimedDuringTaskPause as { ok: boolean }).ok, false, "task pause must fence in-flight claim");
      assert.equal(await db.g3TaskLease.count({ where: { taskRunId: task.id } }), 0);

      await db.taskRun.update({ where: { id: task.id }, data: { status: "RUNNING" } });
      const claimedDuringParentPause = await whileTransitionHeld(
        (tx) => tx.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_EXTERNAL" } }),
        () => claimDurableG3Lease(lease, db),
      );
      assert.equal((claimedDuringParentPause as { ok: boolean }).ok, false, "parent pause must fence in-flight claim");
      assert.equal(await db.g3TaskLease.count({ where: { taskRunId: task.id } }), 0);

      await db.agentRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });
      assert.equal((await claimDurableG3Lease(lease, db)).ok, true);
      const renewedDuringPause = await whileTransitionHeld(
        (tx) => tx.agentRun.update({ where: { id: run.id }, data: { status: "WAITING_HUMAN" } }),
        () => renewDurableG3Lease(lease, db),
      );
      assert.equal((renewedDuringPause as { ok: boolean }).ok, false, "parent pause must fence in-flight heartbeat");
    } finally {
      await db.agentRun.delete({ where: { id: run.id } });
      await db.$disconnect();
    }
  });

});
