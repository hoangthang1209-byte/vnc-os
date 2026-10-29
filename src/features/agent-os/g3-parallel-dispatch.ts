/**
 * Pure scheduling gate for G3. It makes no claim that an executor was started.
 * Callers must persist a lease atomically before dispatching a runner.
 */
export type G3Task = {
  id: string;
  priority: number;
  dependencies: readonly string[];
  resources: readonly string[];
  state: "QUEUED" | "RUNNING" | "COMPLETE" | "BLOCKED";
  requiresHumanApproval: boolean;
  humanApproved: boolean;
};

export type G3DispatchDecision = {
  selected: string[];
  deferred: Array<{ id: string; reason: string }>;
};

/**
 * Exact resource keys (e.g. "prisma/schema.prisma", "admin-shell",
 * "deployment:production") must come from a trusted scope classifier.
 * Unknown or empty resource scopes fail closed until classified.
 */
export function planSafeParallelDispatch(
  tasks: readonly G3Task[],
  concurrencyLimit: number,
): G3DispatchDecision {
  if (!Number.isSafeInteger(concurrencyLimit) || concurrencyLimit < 0) {
    throw new Error("Invalid concurrency limit");
  }
  const ids = new Set<string>();
  for (const task of tasks) {
    if (!task.id || ids.has(task.id)) throw new Error("Invalid or duplicate task ID");
    ids.add(task.id);
  }
  const state = new Map(tasks.map((t) => [t.id, t.state]));
  const locked = new Set<string>();
  const runningCount = tasks.filter((t) => t.state === "RUNNING").length;
  const selected: string[] = [];
  const deferred: G3DispatchDecision["deferred"] = [];
  for (const task of tasks.filter((t) => t.state === "RUNNING")) {
    // Unknown resource ownership prevents dispatch of further work.
    if (task.resources.length === 0) locked.add("*");
    for (const resource of task.resources) locked.add(resource);
  }
  const queued = tasks.filter((t) => t.state === "QUEUED")
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  for (const task of queued) {
    let reason: string | undefined;
    if (task.requiresHumanApproval && !task.humanApproved) reason = "human_approval";
    else if (task.resources.length === 0 || task.resources.some((x) => !x.trim())) reason = "unclassified_resources";
    else if (task.dependencies.some((dep) => state.get(dep) !== "COMPLETE")) reason = "dependencies_unverified";
    else if (locked.has("*") || task.resources.some((key) => locked.has(key) || locked.has("*"))) reason = "resource_conflict";
    else if (runningCount + selected.length >= concurrencyLimit) reason = "capacity";
    if (reason) {
      deferred.push({ id: task.id, reason });
      continue;
    }
    selected.push(task.id);
    for (const resource of task.resources) locked.add(resource);
  }
  return { selected, deferred };
}
