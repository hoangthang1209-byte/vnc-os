/** Approved AI Leadership MVP: roles and explicit authority boundaries.
 * No executable dispatcher or autonomous approval is exported from this module.
 */
export const LEADERSHIP_ROLES = [
  "chief_orchestrator",
  "technology_lead",
  "operations_lead",
  "risk_qa_lead",
] as const;
export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];

export const LEADERSHIP_ACTIONS = [
  "read_status",
  "draft_plan",
  "propose_issue",
  "dispatch_builder",
  "merge_pr",
  "deploy_production",
  "migrate_database",
  "change_domain",
  "modify_crm",
  "send_external_message",
  "publish_content",
] as const;
export type LeadershipAction = (typeof LEADERSHIP_ACTIONS)[number];

const READ_ONLY = new Set<LeadershipAction>(["read_status", "draft_plan"]);
const ALWAYS_HUMAN = new Set<LeadershipAction>([
  "dispatch_builder", "merge_pr", "deploy_production", "migrate_database",
  "change_domain", "modify_crm", "send_external_message", "publish_content",
  "propose_issue",
]);

export type LeadershipDecision = { allowed: boolean; requiresHumanApproval: boolean; reason: string };
export function assessLeadershipAction(action: LeadershipAction, authenticated: boolean): LeadershipDecision {
  if (!authenticated) return { allowed: false, requiresHumanApproval: false, reason: "Authentication required" };
  if (READ_ONLY.has(action)) return { allowed: true, requiresHumanApproval: false, reason: "Authenticated read-only planning" };
  if (ALWAYS_HUMAN.has(action)) return { allowed: false, requiresHumanApproval: true, reason: "Human approval and operational gates required" };
  return { allowed: false, requiresHumanApproval: true, reason: "Unknown action — fail closed" };
}
