import assert from "node:assert/strict";
import { it } from "node:test";
import { applyExecutionEvent, createExecutionSnapshot, executionStageToRunStatus,
  type ExecutionEvent, type ExecutionSnapshot } from "./execution-lifecycle";
import { GET } from "../../app/api/health/route";

const head = "a".repeat(40), nextHead = "b".repeat(40), merge = "c".repeat(40);
let id = 0;
function apply(state: ExecutionSnapshot, event: Omit<ExecutionEvent, "eventId"> & Record<string, unknown>, now = 100) {
  return applyExecutionEvent(state, { ...event, eventId: `event-${++id}` } as ExecutionEvent, now);
}
function building() {
  let state = createExecutionSnapshot("medium");
  state = apply(state, { kind: "claim", leaseId: "lease-237", expiresAt: 200 });
  return apply(state, { kind: "executor_started", leaseId: "lease-237", provider: "interactive-work",
    executionId: "verified-session-reference", startedAt: 99 });
}
function reviewed() {
  let state = apply(building(), { kind: "pull_request", pullNumber: 238, headSha: head });
  state = apply(state, { kind: "ci", headSha: head, passed: true });
  return apply(state, { kind: "review", headSha: head, passed: true, independent: true });
}

it("claim and approval are not evidence of a running executor", () => {
  const claim = apply(createExecutionSnapshot("medium"), { kind: "claim", leaseId: "x", expiresAt: 200 });
  assert.equal(claim.stage, "CLAIMED");
  assert.equal(executionStageToRunStatus(claim.stage), "QUEUED");
  assert.equal(apply(claim, { kind: "executor_started", leaseId: "x", provider: "work", executionId: "", startedAt: 99 }).stage, "WAIT_HUMAN");
});
it("expired leases stop execution and cannot be resurrected by a heartbeat", () => {
  assert.equal(apply(building(), { kind: "heartbeat", leaseId: "lease-237", expiresAt: 400 }, 201).stage, "WAIT_HUMAN");
});
it("stale CI/review cannot approve a new head and new commits invalidate old approval", () => {
  const state = apply(reviewed(), { kind: "pull_request", pullNumber: 238, headSha: nextHead });
  assert.equal(state.ciPassed, false);
  const stale = apply(state, { kind: "ci", headSha: head, passed: true });
  assert.equal(stale.ciPassed, false);
  assert.equal(apply(stale, { kind: "review", headSha: head, passed: true, independent: true }).stage, "CI_REVIEW");
});
it("requires independent review and bounded repair attempts", () => {
  let state = apply(building(), { kind: "pull_request", pullNumber: 238, headSha: head });
  state = apply(state, { kind: "ci", headSha: head, passed: true });
  assert.equal(apply(state, { kind: "review", headSha: head, passed: true, independent: false }).stage, "WAIT_HUMAN");
  for (let attempt = 1; attempt <= 4; attempt++) {
    state = apply(state, { kind: "ci", headSha: state.headSha!, passed: false });
    if (attempt < 4) state = apply(state, { kind: "pull_request", pullNumber: 238, headSha: String(attempt).repeat(40) });
  }
  assert.equal(state.stage, "WAIT_HUMAN");
});
it("requires exact production SHA and smoke before completion; terminal and duplicate events are idempotent", () => {
  let state = apply(reviewed(), { kind: "merge", headSha: head, mergeSha: merge, ownerApproved: true });
  assert.equal(apply(state, { kind: "deployment", commitSha: head, ready: true, environment: "production" }).stage, "DEPLOY");
  assert.equal(apply(state, { kind: "deployment", commitSha: merge, ready: true, environment: "preview" }).stage, "DEPLOY");
  state = apply(state, { kind: "deployment", commitSha: merge, ready: true, environment: "production" });
  assert.equal(state.stage, "VERIFY");
  assert.equal(apply(state, { kind: "smoke", commitSha: head, passed: true }).stage, "VERIFY");
  const event: ExecutionEvent = { kind: "smoke", commitSha: merge, passed: true, eventId: "smoke-live" };
  state = applyExecutionEvent(state, event, 100);
  assert.equal(state.stage, "COMPLETED");
  assert.equal(applyExecutionEvent(state, event, 101), state);
});
it("high-risk merge evidence cannot bypass owner approval", () => {
  const state = { ...reviewed(), risk: "high" as const };
  assert.equal(apply(state, { kind: "merge", headSha: head, mergeSha: merge, ownerApproved: false }).stage, "WAIT_HUMAN");
});
it("health endpoint reports deployment identity without database access or caching", async () => {
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const body = await response.json();
  assert.equal(body.service, "vnc-os");
  assert.deepEqual(Object.keys(body).sort(), ["commitSha", "environment", "service", "status"]);
});
