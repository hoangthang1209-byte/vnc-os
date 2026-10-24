import type {
  AutomationLaneBoardEntry,
  AutomationLaneOverallState,
} from "@/features/automation/automation-lane-board";
import type { AgentRunStatus } from "@/features/agent-os/agent-run.types";

/** Max age of AgentRun.updatedAt (or GitHub activity fallback) treated as a live Builder heartbeat. */
export const ACTIVE_BUILDER_HEARTBEAT_MS = 6 * 60 * 60 * 1000;

const NON_TERMINAL_AGENT_RUN_STATUSES = new Set<AgentRunStatus>([
  "QUEUED",
  "RUNNING",
  "WAITING_EXTERNAL",
  "WAITING_HUMAN",
]);

export type LaneActiveBuilderRunHint =
  | {
      kind: "agent_run";
      status: AgentRunStatus;
      lastHeartbeatAt: string;
    }
  | { kind: "none" };

export type LaneActiveBuilderResolution = "active" | "inactive" | "unknown";

const PIPELINE_IN_PROGRESS_LANE_STATES = new Set<AutomationLaneOverallState>([
  "dang_kiem_tra",
  "san_sang_merge",
  "dang_deploy",
]);

export function isLanePipelineInProgress(entry: AutomationLaneBoardEntry): boolean {
  return PIPELINE_IN_PROGRESS_LANE_STATES.has(entry.overallState);
}

/**
 * Whether a lane should contribute to the "Builder đang chạy" summary stat.
 * CI review, merge-ready, deploy, and "approved waiting for Builder" are never counted.
 */
export function resolveLaneActiveBuilder(
  entry: AutomationLaneBoardEntry,
  hint: LaneActiveBuilderRunHint | undefined,
  nowMs: number = Date.now(),
): LaneActiveBuilderResolution {
  if (entry.overallState !== "dang_build" || !entry.task) {
    return "inactive";
  }

  if (entry.task.status !== "building") {
    return "inactive";
  }

  if (hint?.kind === "agent_run") {
    if (!NON_TERMINAL_AGENT_RUN_STATUSES.has(hint.status)) {
      return "inactive";
    }
    const heartbeatAgeMs = nowMs - Date.parse(hint.lastHeartbeatAt);
    if (Number.isNaN(heartbeatAgeMs) || heartbeatAgeMs > ACTIVE_BUILDER_HEARTBEAT_MS) {
      return "inactive";
    }
    return "active";
  }

  if (hint?.kind === "none") {
    return "unknown";
  }

  const activityAgeMs = nowMs - Date.parse(entry.task.latestUpdateAt);
  if (Number.isNaN(activityAgeMs) || activityAgeMs > ACTIVE_BUILDER_HEARTBEAT_MS) {
    return "inactive";
  }

  return "unknown";
}

export type LaneBoardActiveBuilderSummaryInput = {
  entries: AutomationLaneBoardEntry[];
  hintsByIssueNumber?: ReadonlyMap<number, LaneActiveBuilderRunHint>;
  nowMs?: number;
};

export function summarizeLaneActiveBuilders(input: LaneBoardActiveBuilderSummaryInput): {
  runningCount: number;
  runningCountHasUnknown: boolean;
  pipelineInProgressCount: number;
} {
  const nowMs = input.nowMs ?? Date.now();
  let runningCount = 0;
  let runningCountHasUnknown = false;
  let pipelineInProgressCount = 0;

  for (const entry of input.entries) {
    if (isLanePipelineInProgress(entry)) {
      pipelineInProgressCount += 1;
    }

    const task = entry.task;
    const hint =
      task != null ? input.hintsByIssueNumber?.get(task.issueNumber) : undefined;
    const resolution = resolveLaneActiveBuilder(entry, hint, nowMs);
    if (resolution === "active") {
      runningCount += 1;
    } else if (resolution === "unknown") {
      runningCountHasUnknown = true;
    }
  }

  return { runningCount, runningCountHasUnknown, pipelineInProgressCount };
}
