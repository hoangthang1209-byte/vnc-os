import type { AgentRunStatus } from "@/features/agent-os/agent-run.types";

export type ExecutionStage =
  | "QUEUED" | "CLAIMED" | "BUILDING" | "CI_REVIEW" | "REPAIR"
  | "MERGE" | "DEPLOY" | "VERIFY" | "COMPLETED" | "WAIT_HUMAN";

export type ExecutionSnapshot = {
  stage: ExecutionStage;
  risk: "low" | "medium" | "high" | "unknown";
  lease: { id: string; expiresAt: number } | null;
  executor: { provider: string; executionId: string; startedAt: number } | null;
  pullNumber: number | null;
  headSha: string | null;
  ciPassed: boolean;
  reviewPassed: boolean;
  mergeSha: string | null;
  repairCount: number;
  blocker: string | null;
  appliedEventIds: readonly string[];
};

export type ExecutionEvent = { eventId: string } & (
  | { kind: "claim"; leaseId: string; expiresAt: number }
  | { kind: "executor_started"; leaseId: string; provider: string; executionId: string; startedAt: number }
  | { kind: "heartbeat"; leaseId: string; expiresAt: number }
  | { kind: "pull_request"; pullNumber: number; headSha: string }
  | { kind: "ci"; headSha: string; passed: boolean }
  | { kind: "review"; headSha: string; passed: boolean; independent: boolean }
  | { kind: "merge"; headSha: string; mergeSha: string; ownerApproved: boolean }
  | { kind: "deployment"; commitSha: string; ready: boolean; environment: "production" | "preview" }
  | { kind: "smoke"; commitSha: string; passed: boolean }
  | { kind: "tick" }
);

export function createExecutionSnapshot(risk: ExecutionSnapshot["risk"]): ExecutionSnapshot {
  return { stage: "QUEUED", risk, lease: null, executor: null, pullNumber: null,
    headSha: null, ciPassed: false, reviewPassed: false, mergeSha: null,
    repairCount: 0, blocker: null, appliedEventIds: [] };
}

const validSha = (value: string) => /^[0-9a-f]{40}$/.test(value);
const nonempty = (value: string) => value.trim().length > 0;

/**
 * Evidence contract for trusted adapters, not a public event ingestion API.
 * Adapters must verify runner/GitHub/Vercel identities before calling this reducer.
 * A comment or BUILD_APPROVED label is deliberately not an executor event.
 * Storage, dispatch, and periodic ticks are not installed by this pure contract.
 */
export function applyExecutionEvent(
  snapshot: ExecutionSnapshot,
  event: ExecutionEvent,
  now: number,
): ExecutionSnapshot {
  if (!nonempty(event.eventId) || !Number.isFinite(now)) throw new Error("Invalid event identity or clock");
  if (snapshot.stage === "COMPLETED" || snapshot.appliedEventIds.includes(event.eventId)) return snapshot;
  const next = { ...snapshot, appliedEventIds: [...snapshot.appliedEventIds, event.eventId] };
  const wait = (reason: string): ExecutionSnapshot => ({ ...next, stage: "WAIT_HUMAN", blocker: reason });
  if (next.appliedEventIds.length > 256) return wait("Event history limit reached; archive and reconcile this attempt");

  // A stale heartbeat cannot renew an expired execution lease.
  if ((next.stage === "CLAIMED" || next.stage === "BUILDING") &&
      (!next.lease || next.lease.expiresAt <= now)) return wait("Executor lease expired");

  const repair = (): ExecutionSnapshot => {
    next.repairCount += 1;
    next.ciPassed = false;
    next.reviewPassed = false;
    return next.repairCount > 3 ? wait("Repair budget exhausted") : { ...next, stage: "REPAIR" };
  };

  switch (event.kind) {
    case "claim":
      if (next.stage !== "QUEUED") return next;
      if (!nonempty(event.leaseId) || !Number.isFinite(event.expiresAt) || event.expiresAt <= now) return wait("Invalid claim lease");
      return { ...next, stage: "CLAIMED", lease: { id: event.leaseId, expiresAt: event.expiresAt } };
    case "executor_started":
      if (next.stage !== "CLAIMED") return next;
      if (event.leaseId !== next.lease?.id || !nonempty(event.provider) || !nonempty(event.executionId) ||
          !Number.isFinite(event.startedAt) || event.startedAt > now) return wait("Verified executor identity is missing");
      return { ...next, stage: "BUILDING", executor: {
        provider: event.provider, executionId: event.executionId, startedAt: event.startedAt,
      } };
    case "heartbeat":
      if ((next.stage !== "CLAIMED" && next.stage !== "BUILDING") || event.leaseId !== next.lease?.id) return next;
      if (!Number.isFinite(event.expiresAt) || event.expiresAt <= now) return wait("Invalid heartbeat lease");
      return { ...next, lease: { id: event.leaseId, expiresAt: event.expiresAt } };
    case "pull_request":
      if (!["BUILDING", "CI_REVIEW", "REPAIR", "MERGE"].includes(next.stage)) return next;
      if (!next.executor || !Number.isInteger(event.pullNumber) || event.pullNumber < 1 || !validSha(event.headSha)) return wait("Invalid PR evidence");
      if (next.headSha === event.headSha && next.pullNumber === event.pullNumber) return next;
      return { ...next, stage: "CI_REVIEW", pullNumber: event.pullNumber, headSha: event.headSha,
        ciPassed: false, reviewPassed: false };
    case "ci":
      if (next.stage !== "CI_REVIEW" || event.headSha !== next.headSha) return next;
      return event.passed ? { ...next, ciPassed: true } : repair();
    case "review":
      if (next.stage !== "CI_REVIEW" || event.headSha !== next.headSha || !next.ciPassed) return next;
      if (!event.independent) return wait("Independent review is required");
      return event.passed ? { ...next, stage: "MERGE", reviewPassed: true } : repair();
    case "merge":
      if (next.stage !== "MERGE" || event.headSha !== next.headSha || !next.ciPassed || !next.reviewPassed) return next;
      if (!validSha(event.mergeSha)) return wait("Invalid merge commit");
      if ((next.risk === "high" || next.risk === "unknown") && !event.ownerApproved) return wait("Owner approval required for elevated or unknown risk");
      return { ...next, stage: "DEPLOY", mergeSha: event.mergeSha };
    case "deployment":
      if (next.stage !== "DEPLOY" || event.commitSha !== next.mergeSha || event.environment !== "production" || !event.ready) return next;
      return { ...next, stage: "VERIFY" };
    case "smoke":
      if (next.stage !== "VERIFY" || event.commitSha !== next.mergeSha) return next;
      return event.passed ? { ...next, stage: "COMPLETED" } : wait("Production smoke failed");
    case "tick":
      return next;
  }
}

/** Reuse existing persistence statuses; no Prisma enum or migration is introduced. */
export function executionStageToRunStatus(stage: ExecutionStage): AgentRunStatus {
  if (stage === "QUEUED" || stage === "CLAIMED") return "QUEUED";
  if (stage === "WAIT_HUMAN") return "WAITING_HUMAN";
  if (stage === "COMPLETED") return "SUCCEEDED";
  if (["CI_REVIEW", "MERGE", "DEPLOY", "VERIFY"].includes(stage)) return "WAITING_EXTERNAL";
  return "RUNNING";
}
