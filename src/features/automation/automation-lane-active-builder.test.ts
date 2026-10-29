import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVE_BUILDER_HEARTBEAT_MS,
  resolveLaneActiveBuilder,
  summarizeLaneActiveBuilders,
} from "@/features/automation/automation-lane-active-builder";
import { buildLaneBoard, buildLaneBoardSummary } from "@/features/automation/automation-lane-board";
import type { AutomationTask } from "@/features/automation/automation-task.types";
import { withAutomationTaskAgentDefaults } from "@/features/automation/automation-task.test-fixture";

const NOW_MS = Date.parse("2026-10-24T12:00:00.000Z");

function taskFixture(overrides: Partial<AutomationTask> = {}): AutomationTask {
  return withAutomationTaskAgentDefaults({
    issueNumber: 240,
    title: "Lane runtime states",
    taskArea: "Automation Platform",
    status: "ci_review",
    statusLabel: "status:ci-review",
    risk: "medium",
    riskLabel: "risk:medium",
    linkedPullRequest: {
      number: 241,
      url: "https://github.com/hoangthang1209-byte/vnc-os/pull/241",
      state: "open",
      merged: false,
      title: "Fix lane board",
      updatedAt: "2026-10-24T11:00:00.000Z",
      mergedAt: null,
      mergeCommitSha: null,
      verification: { ciStatus: "success", reviewStatus: "pending" },
    },
    latestUpdateAt: "2026-10-24T11:00:00.000Z",
    closedAt: null,
    mergedAt: null,
    blockerReason: null,
    isOpen: true,
    githubIssueUrl: "https://github.com/hoangthang1209-byte/vnc-os/issues/240",
    labels: ["status:ci-review", "risk:medium"],
    recentStatusComments: [],
    hasBuildApproved: false,
    productionStatus: {
      status: "unknown",
      mergedCommitSha: null,
      reason: null,
      checkedAt: "2026-10-24T11:00:00.000Z",
    },
    ...overrides,
  });
}

describe("automation-lane-active-builder", () => {
  it("does not count CI review, ready-to-merge, or deploy lanes as active Builder", () => {
    const board = buildLaneBoard([
      taskFixture({ issueNumber: 1, taskArea: "Lead & Sales", status: "ci_review" }),
      taskFixture({
        issueNumber: 2,
        taskArea: "Marketing / Content / SEO",
        status: "ready_to_merge",
        statusLabel: "status:ready-to-merge",
      }),
      taskFixture({
        issueNumber: 3,
        taskArea: "Quotation / Quote Builder",
        status: "merged",
        isOpen: false,
        productionStatus: {
          status: "deploying",
          mergedCommitSha: "abc",
          reason: null,
          checkedAt: "2026-10-24T11:00:00.000Z",
        },
      }),
    ]);

    const summary = buildLaneBoardSummary(board, { nowMs: NOW_MS });
    assert.equal(summary.runningCount, 0);
    assert.equal(summary.pipelineInProgressCount, 3);
    assert.equal(summary.runningCountHasUnknown, false);
  });

  it("counts only confirmed AgentRun heartbeat for status:building", () => {
    const building = taskFixture({
      status: "building",
      statusLabel: "status:building",
      linkedPullRequest: null,
      latestUpdateAt: "2026-10-24T11:30:00.000Z",
    });
    const board = buildLaneBoard([building]);
    const entry = board.find((row) => row.laneId === "automation-platform")!;

    assert.equal(
      resolveLaneActiveBuilder(entry, { kind: "none" }, NOW_MS),
      "unknown",
    );
    const freshHeartbeat = new Date(NOW_MS - 5 * 60 * 1000).toISOString();

    assert.equal(
      resolveLaneActiveBuilder(
        entry,
        {
          kind: "agent_run",
          status: "RUNNING",
          lastHeartbeatAt: freshHeartbeat,
          hasVerifiedRunnerLink: false,
        },
        NOW_MS,
      ),
      "unknown",
    );
    assert.equal(
      resolveLaneActiveBuilder(
        entry,
        {
          kind: "agent_run",
          status: "RUNNING",
          lastHeartbeatAt: freshHeartbeat,
          hasVerifiedRunnerLink: true,
        },
        NOW_MS,
      ),
      "active",
    );

    const hints = new Map([
      [
        240,
        {
          kind: "agent_run" as const,
          status: "RUNNING" as const,
          lastHeartbeatAt: freshHeartbeat,
          hasVerifiedRunnerLink: true as const,
        },
      ],
    ]);
    const summary = buildLaneBoardSummary(board, { hintsByIssueNumber: hints, nowMs: NOW_MS });
    assert.equal(summary.runningCount, 1);
  });

  it("treats stale status:building without AgentRun as inactive", () => {
    const board = buildLaneBoard([
      taskFixture({
        status: "building",
        statusLabel: "status:building",
        linkedPullRequest: null,
        latestUpdateAt: "2026-09-01T00:00:00.000Z",
      }),
    ]);
    const entry = board.find((row) => row.laneId === "automation-platform")!;

    assert.equal(resolveLaneActiveBuilder(entry, { kind: "none" }, NOW_MS), "unknown");
    assert.equal(
      summarizeLaneActiveBuilders({
        entries: board,
        hintsByIssueNumber: new Map([[240, { kind: "none" }]]),
        nowMs: NOW_MS,
      }).runningCount,
      0,
    );
  });

  it("never counts queued or waiting AgentRuns as executing Builders", () => {
    const board = buildLaneBoard([
      taskFixture({
        status: "building",
        statusLabel: "status:building",
        linkedPullRequest: null,
      }),
    ]);
    const entry = board.find((row) => row.laneId === "automation-platform")!;
    const heartbeat = new Date(NOW_MS - 60_000).toISOString();

    for (const status of ["QUEUED", "WAITING_EXTERNAL", "WAITING_HUMAN"] as const) {
      assert.equal(
        resolveLaneActiveBuilder(
          entry,
          {
            kind: "agent_run",
            status,
            lastHeartbeatAt: heartbeat,
            hasVerifiedRunnerLink: true,
          },
          NOW_MS,
        ),
        "inactive",
        `Non-executing status ${status} must not inflate runningCount`,
      );
    }
  });

  it("expires AgentRun heartbeats beyond the configured window", () => {
    const board = buildLaneBoard([
      taskFixture({
        status: "building",
        statusLabel: "status:building",
        linkedPullRequest: null,
      }),
    ]);
    const entry = board.find((row) => row.laneId === "automation-platform")!;
    const staleHeartbeat = new Date(NOW_MS - ACTIVE_BUILDER_HEARTBEAT_MS - 1).toISOString();

    assert.equal(
      resolveLaneActiveBuilder(
        entry,
        {
          kind: "agent_run",
          status: "RUNNING",
          lastHeartbeatAt: staleHeartbeat,
          hasVerifiedRunnerLink: true,
        },
        NOW_MS,
      ),
      "inactive",
    );
  });

  it("does not count approved-waiting lanes as active Builder", () => {
    const board = buildLaneBoard([
      taskFixture({
        status: "approved",
        statusLabel: "status:approved",
        hasBuildApproved: true,
        linkedPullRequest: null,
      }),
    ]);
    const summary = buildLaneBoardSummary(board, { nowMs: NOW_MS });
    assert.equal(summary.runningCount, 0);
  });
});
