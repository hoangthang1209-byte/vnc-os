import type {
  AutomationLaneBoardEntry,
  AutomationLaneOverallState,
} from "@/features/automation/automation-lane-board";
import type { AgentRunStatus } from "@/features/agent-os/agent-run.types";

/** Max age of AgentRun heartbeat treated as a live Builder signal. */
export const ACTIVE_BUILDER_HEARTBEAT_MS = 6 * 60 * 60 * 1000;

// A queued or blocked run must not appear as a currently executing Builder.
const EXECUTING_AGENT_RUN_STATUSES = new Set<AgentRunStatus>(["RUNNING"]);

export type LaneActiveBuilderRunHint =
  | {
      kind: "agent_run";
      status: AgentRunStatus;
      lastHeartbeatAt: string;
      /** True when AgentRun is linked to a real Cursor Cloud agent/run id. */
      hasVerifiedRunnerLink: boolean;
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
    if (!EXECUTING_AGENT_RUN_STATUSES.has(hint.status)) {
      return "inactive";
    }
    if (!hint.hasVerifiedRunnerLink) {
      return "unknown";
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
