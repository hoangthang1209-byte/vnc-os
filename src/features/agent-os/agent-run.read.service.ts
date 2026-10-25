import "server-only";

import type {
  AgentEventPayloadSummary,
  AgentEventSource,
  AgentRunListItem,
  AgentRunStatus,
} from "@/features/agent-os/agent-run.types";
import { hasVerifiedCursorRunnerEvidence } from "@/features/agent-os/agent-run.runner-evidence";
import type { AgentRunSummaryJson } from "@/features/agent-os/agent-run.types";
import type { LaneActiveBuilderRunHint } from "@/features/automation/automation-lane-active-builder";
import { prisma } from "@/lib/prisma";

const NON_TERMINAL_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  "QUEUED",
  "RUNNING",
  "WAITING_EXTERNAL",
  "WAITING_HUMAN",
];

function parsePayloadSummary(raw: unknown): AgentEventPayloadSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.kind !== "string") return null;
  return {
    kind: record.kind,
    reference: typeof record.reference === "string" ? record.reference : undefined,
    statusHint: typeof record.statusHint === "string" ? record.statusHint : undefined,
    notes: typeof record.notes === "string" ? record.notes : undefined,
  };
}

function mapRun(row: {
  id: string;
  agentId: string;
  status: AgentRunListItem["status"];
  attemptNumber: number;
  githubIssueNumber: number | null;
  blockerReason: string | null;
  nextAction: string | null;
  humanApprovalRequired: boolean;
  humanApprovalReceivedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  updatedAt: Date;
  events: Array<{
    source: AgentEventSource;
    appliedAt: Date;
    payloadSummary: unknown;
  }>;
}): AgentRunListItem {
  const last = row.events[0] ?? null;
  return {
    id: row.id,
    agentId: row.agentId,
    status: row.status,
    attemptNumber: row.attemptNumber,
    githubIssueNumber: row.githubIssueNumber,
    blockerReason: row.blockerReason,
    nextAction: row.nextAction,
    humanApprovalRequired: row.humanApprovalRequired,
    humanApprovalReceivedAt: row.humanApprovalReceivedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    lastEvent: last
      ? {
          source: last.source,
          appliedAt: last.appliedAt.toISOString(),
          payloadSummary: parsePayloadSummary(last.payloadSummary),
        }
      : null,
  };
}

export async function listAgentRunsForIssue(input: {
  issueNumber: number;
  limit?: number;
}): Promise<{ currentRun: AgentRunListItem | null; runs: AgentRunListItem[] }> {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);

  const runs = await prisma.agentRun.findMany({
    where: { githubIssueNumber: input.issueNumber },
    orderBy: [{ attemptNumber: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      events: {
        orderBy: { appliedAt: "desc" },
        take: 1,
      },
    },
  });

  const mapped = runs.map(mapRun);
  const currentRun =
    mapped.find((run) => !["SUCCEEDED", "FAILED", "CANCELLED"].includes(run.status)) ??
    mapped[0] ??
    null;

  return { currentRun, runs: mapped };
}

/**
 * Latest non-terminal AgentRun per issue for lane-board Builder liveness (heartbeat via updatedAt).
 */
export async function findActiveBuilderHintsByIssueNumbers(
  issueNumbers: number[],
): Promise<Map<number, LaneActiveBuilderRunHint>> {
  const uniqueIssues = [...new Set(issueNumbers.filter((n) => Number.isFinite(n) && n > 0))];
  const hints = new Map<number, LaneActiveBuilderRunHint>();
  if (uniqueIssues.length === 0) {
    return hints;
  }

  const runs = await prisma.agentRun.findMany({
    where: {
      githubIssueNumber: { in: uniqueIssues },
      status: { in: NON_TERMINAL_AGENT_RUN_STATUSES },
    },
    orderBy: [{ githubIssueNumber: "asc" }, { updatedAt: "desc" }],
    select: {
      githubIssueNumber: true,
      status: true,
      updatedAt: true,
      correlationId: true,
      inputSummary: true,
    },
  });

  const seenIssues = new Set<number>();
  for (const run of runs) {
    const issueNumber = run.githubIssueNumber;
    if (issueNumber == null || seenIssues.has(issueNumber)) continue;
    seenIssues.add(issueNumber);
    hints.set(issueNumber, {
      kind: "agent_run",
      status: run.status,
      lastHeartbeatAt: run.updatedAt.toISOString(),
      hasVerifiedRunnerLink: hasVerifiedCursorRunnerEvidence({
        correlationId: run.correlationId,
        inputSummary: run.inputSummary as AgentRunSummaryJson | null,
      }),
    });
  }

  for (const issueNumber of uniqueIssues) {
    if (!hints.has(issueNumber)) {
      hints.set(issueNumber, { kind: "none" });
    }
  }

  return hints;
}
