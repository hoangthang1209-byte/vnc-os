import type { AgentRunSummaryJson } from "@/features/agent-os/agent-run.types";

/** Cursor Cloud Agent id (e.g. bc-a93e19a1-7fb1-5fc2-9639-c5f339ede39e). */
const CURSOR_AGENT_ID_PATTERN = /^bc-[0-9a-f-]{36}$/i;

/** Cursor Cloud run id (e.g. run-6af50d33-9146-4d45-908a-fd27d9f61b15). */
const CURSOR_RUN_ID_PATTERN = /^run-[0-9a-f-]{36}$/i;

const INPUT_SUMMARY_RUNNER_KEYS = [
  "cursorAgentId",
  "cursorRunId",
  "cursorRunnerId",
] as const satisfies readonly (keyof AgentRunSummaryJson)[];

function isCursorRunnerReference(value: string): boolean {
  const trimmed = value.trim();
  return CURSOR_AGENT_ID_PATTERN.test(trimmed) || CURSOR_RUN_ID_PATTERN.test(trimmed);
}

export function hasVerifiedCursorRunnerEvidence(input: {
  correlationId?: string | null;
  inputSummary?: AgentRunSummaryJson | null;
}): boolean {
  const correlationId = input.correlationId?.trim();
  if (correlationId && isCursorRunnerReference(correlationId)) {
    return true;
  }

  const summary = input.inputSummary;
  if (!summary) return false;

  for (const key of INPUT_SUMMARY_RUNNER_KEYS) {
    const value = summary[key];
    if (typeof value === "string" && isCursorRunnerReference(value)) {
      return true;
    }
  }

  return false;
}
