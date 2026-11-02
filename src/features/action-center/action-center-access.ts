import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { can } from "@/features/auth/admin-permissions";

/** Fail closed: a non-owner without an employee link must never see other staff's tasks. */
export function getLeadTaskAccess(session: AdminSessionUser):
  | { allowed: false; status: 401 | 403 }
  | { allowed: true; ownerId?: string } {
  if (!session.authenticated) return { allowed: false, status: 401 };
  if (!can(session, "leads.view")) return { allowed: false, status: 403 };
  if (session.mode === "owner") return { allowed: true };
  if (!session.employeeId) return { allowed: false, status: 403 };
  return { allowed: true, ownerId: session.employeeId };
}

export function classifyDueAt(dueAt: Date | null, now: Date): "overdue" | "today" | "upcoming" | "unscheduled" {
  if (!dueAt) return "unscheduled";
  // Day boundaries follow the configured Vietnam business timezone, not UTC.
  const date = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
  const key = (value: Date) => {
    const parts = Object.fromEntries(date.formatToParts(value).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const d = key(dueAt), n = key(now);
  return d < n ? "overdue" : d === n ? "today" : "upcoming";
}
