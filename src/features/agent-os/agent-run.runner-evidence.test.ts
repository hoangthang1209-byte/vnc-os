import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasVerifiedCursorRunnerEvidence } from "@/features/agent-os/agent-run.runner-evidence";

describe("hasVerifiedCursorRunnerEvidence", () => {
  it("accepts Cursor Cloud agent and run correlation ids", () => {
    assert.equal(
      hasVerifiedCursorRunnerEvidence({
        correlationId: "bc-a93e19a1-7fb1-5fc2-9639-c5f339ede39e",
      }),
      true,
    );
    assert.equal(
      hasVerifiedCursorRunnerEvidence({
        correlationId: "run-6af50d33-9146-4d45-908a-fd27d9f61b15",
      }),
      true,
    );
  });

  it("accepts cursor ids in inputSummary", () => {
    assert.equal(
      hasVerifiedCursorRunnerEvidence({
        inputSummary: { cursorAgentId: "bc-a93e19a1-7fb1-5fc2-9639-c5f339ede39e" },
      }),
      true,
    );
  });

  it("rejects github-only AgentRun rows without runner linkage", () => {
    assert.equal(hasVerifiedCursorRunnerEvidence({ correlationId: "issue-240" }), false);
    assert.equal(
      hasVerifiedCursorRunnerEvidence({
        inputSummary: { cursorAgentId: "issue-240-not-a-runner" },
      }),
      false,
    );
    assert.equal(hasVerifiedCursorRunnerEvidence({}), false);
  });
});
