import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatFactoryLoopStageLabel,
  resolveAutomationFactoryLoopSnapshot,
  resolveBuilderExecutionEvidence,
} from "@/features/automation/automation-factory-loop";

describe("automation-factory-loop", () => {
  it("maps approved backlog tasks to QUEUE stage", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "approved",
      comments: [],
    });
    assert.equal(snapshot.stage, "QUEUE");
    assert.equal(formatFactoryLoopStageLabel(snapshot.stage), "Hàng đợi");
  });

  it("maps ci_review to CI_REVIEW with retry count from review orchestrator markers", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "ci_review",
      comments: [
        {
          author: "github-actions[bot]",
          createdAt: "2026-01-01T00:00:00Z",
          body: "REQUEST_INDEPENDENT_REVIEW\nREVIEW_ORCHESTRATOR_IDEMPOTENCY: request-pr-1-sha-abc",
        },
      ],
      linkedHeadSha: "abc1234567890",
    });
    assert.equal(snapshot.stage, "CI_REVIEW");
    assert.equal(snapshot.retryCount, 1);
    assert.equal(snapshot.exactHeadSha, "abc1234567890");
  });

  it("maps verifying status to VERIFYING stage", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "verifying",
      comments: [],
      linkedMergeCommitSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    });
    assert.equal(snapshot.stage, "VERIFYING");
    assert.equal(snapshot.productionVerificationSha, "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
  });

  it("treats non-expired BUILDER_LEASE as active execution evidence", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "building",
      comments: [
        {
          author: "github-actions[bot]",
          createdAt: "2026-01-01T00:00:00Z",
          body:
            "BUILDER_LEASE: issue=240 pr=241 head=abc1234 claimedAt=2026-01-01T00:00:00Z leaseExpiresAt=2026-01-01T01:00:00Z attempt=1 stage=BUILDING heartbeat=2026-01-01T00:00:00Z",
        },
      ],
    });
    assert.equal(
      resolveBuilderExecutionEvidence(snapshot, { nowMs: Date.parse("2026-01-01T00:30:00Z") }),
      "active",
    );
    assert.equal(
      resolveBuilderExecutionEvidence(snapshot, { nowMs: Date.parse("2026-01-01T02:00:00Z") }),
      "inactive",
    );
  });

  it("returns unknown for BUILDING stage without lease evidence", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "building",
      comments: [],
    });
    assert.equal(resolveBuilderExecutionEvidence(snapshot), "unknown");
  });

  it("returns inactive for CI_REVIEW without lease", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "ci_review",
      comments: [],
    });
    assert.equal(resolveBuilderExecutionEvidence(snapshot), "inactive");
  });

  it("detects WAIT_HUMAN from review orchestrator stall comments", () => {
    const snapshot = resolveAutomationFactoryLoopSnapshot({
      status: "ci_review",
      comments: [
        {
          author: "github-actions[bot]",
          createdAt: "2026-01-01T00:00:00Z",
          body: "REVIEW_ORCHESTRATOR_STALLED: Independent reviewer did not complete.",
        },
      ],
    });
    assert.equal(snapshot.stage, "WAIT_HUMAN");
    assert.equal(snapshot.waitHuman, true);
  });
});
