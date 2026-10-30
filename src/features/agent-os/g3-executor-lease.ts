/**
 * G3 lease transition guard. Pure validation only: callers MUST persist the
 * compare-and-swap result atomically in G2 before starting any executor.
 * A GitHub comment, CI job or PR alone does not prove an active builder.
 */
export type G3Lease = {
  taskId: string;
  attempt: number;
  executorId: string;
  token: string;
  headSha: string;
  expiresAtMs: number;
  heartbeatAtMs: number;
  status: "CLAIMED" | "RUNNING" | "RELEASED";
};
export type G3LeaseTransition =
  | { ok: true; lease: G3Lease }
  | { ok: false; reason: "active_lease" | "stale_token" | "expired" | "invalid" | "not_running" };
const shaPattern = /^[0-9a-f]{40}$/i;
export function claimG3Lease(args: {
  taskId: string; executorId: string; token: string; headSha: string;
  nowMs: number; ttlMs: number; previous?: G3Lease | null;
}): G3LeaseTransition {
  const {taskId,executorId,token,headSha,nowMs,ttlMs,previous} = args;
  if (!taskId.trim() || !executorId.trim() || token.length < 16 ||
      !shaPattern.test(headSha) || !Number.isSafeInteger(nowMs) ||
      !Number.isSafeInteger(ttlMs) || ttlMs < 1_000 || ttlMs > 3_600_000) {
    return {ok:false,reason:"invalid"};
  }
  if (previous && previous.taskId !== taskId) return {ok:false,reason:"invalid"};
  if (previous && previous.status !== "RELEASED" && previous.expiresAtMs > nowMs) {
    return {ok:false,reason:"active_lease"};
  }
  if (previous && previous.attempt >= Number.MAX_SAFE_INTEGER) return {ok:false,reason:"invalid"};
  if (previous && previous.token === token) return {ok:false,reason:"stale_token"};
  if (!Number.isSafeInteger(nowMs + ttlMs)) return {ok:false,reason:"invalid"};
  return {ok:true,lease:{taskId,executorId,token,headSha,attempt:(previous?.attempt ?? 0)+1,
    expiresAtMs:nowMs+ttlMs,heartbeatAtMs:nowMs,status:"CLAIMED"}};
}
export function heartbeatG3Lease(args: {
  lease: G3Lease; token: string; headSha: string; nowMs: number; ttlMs: number;
}): G3LeaseTransition {
  const {lease,token,headSha,nowMs,ttlMs} = args;
  if (token !== lease.token || headSha !== lease.headSha) return {ok:false,reason:"stale_token"};
  if (!Number.isSafeInteger(nowMs) || !Number.isSafeInteger(ttlMs) ||
      ttlMs < 1_000 || ttlMs > 3_600_000 || nowMs < lease.heartbeatAtMs ||
      !Number.isSafeInteger(nowMs + ttlMs)) return {ok:false,reason:"invalid"};
  if (lease.expiresAtMs <= nowMs) return {ok:false,reason:"expired"};
  if (lease.status === "RELEASED") return {ok:false,reason:"not_running"};
  return {ok:true,lease:{...lease,heartbeatAtMs:nowMs,expiresAtMs:nowMs+ttlMs,status:"RUNNING"}};
}
export function releaseG3Lease(args: {
  lease: G3Lease; token: string; nowMs: number;
}): G3LeaseTransition {
  const {lease,token,nowMs}=args;
  if (token !== lease.token) return {ok:false,reason:"stale_token"};
  if (!Number.isSafeInteger(nowMs) || nowMs < lease.heartbeatAtMs) return {ok:false,reason:"invalid"};
  if (lease.status === "RELEASED") return {ok:false,reason:"not_running"};
  return {ok:true,lease:{...lease,status:"RELEASED"}};
}
