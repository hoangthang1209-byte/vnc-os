import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  claimDurableG3Lease,
  releaseDurableG3Lease,
  renewDurableG3Lease,
} from "./g3-durable-lease.service";

/**
 * Opt-in REAL PostgreSQL concurrency test, never pointed at Production.
 * Requires an isolated database named *_test or *_ci with the additive G3
 * migration already applied. It does not run in default npm test/CI.
 *
 * G3_LEASE_TEST_DATABASE_URL=postgresql://.../vnc_g3_test
 * NODE_OPTIONS=--conditions=react-server npx tsx --test \
 *   src/features/agent-os/g3-durable-lease.integration.test.ts
 */
const testUrl = process.env.G3_LEASE_TEST_DATABASE_URL;
function isIsolatedTestUrl(value: string | undefined): value is string {
  if (!value || value === process.env.DATABASE_URL) return false;
  try {
    const parsed = new URL(value);
    return /^postgres(ql)?:$/.test(parsed.protocol) &&
      /(?:_test|_ci)$/.test(decodeURIComponent(parsed.pathname.slice(1)));
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

      await db.taskRun.update({ where: { id: task.id }, data: { status: "SUCCEEDED" } });
      assert.equal((await renewDurableG3Lease(third, db)).ok, false, "terminal TaskRun cannot heartbeat");
      assert.equal((await claimDurableG3Lease({ ...third, token: "isolated-new-token-0000" }, db)).ok, false);
    } finally {
      await db.agentRun.delete({ where: { id: run.id } });
      await db.$disconnect();
    }
  });
});
