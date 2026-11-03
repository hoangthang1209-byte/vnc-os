import type { Prisma } from "@prisma/client";
import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { can } from "@/features/auth/admin-permissions";

export type FunnelPeriod = 7 | 30 | 90;
export type FunnelStage = "received" | "contacted" | "qualified" | "quoted" | "ordered";
export const FUNNEL_STAGES: { key: FunnelStage; label: string }[] = [
  { key: "received", label: "Lead tiếp nhận" },
  { key: "contacted", label: "Đã tiếp cận / xử lý" },
  { key: "qualified", label: "Đủ điều kiện / Pricing" },
  { key: "quoted", label: "Đã gửi báo giá" },
  { key: "ordered", label: "Đã tạo đơn" },
];

export function parseFunnelPeriod(raw: string | null): FunnelPeriod | null {
  if (raw === "7") return 7;
  if (raw === "30") return 30;
  if (raw === "90") return 90;
  return null;
}

/** Employees only see leads assigned directly to them. Do not trust role-based frontend filtering. */
export function getFunnelAccess(session: AdminSessionUser):
  | { allowed: false; status: 401 | 403 }
  | { allowed: true; employeeId?: string } {
  if (!session.authenticated) return { allowed: false, status: 401 };
  if (!can(session, "leads.view")) return { allowed: false, status: 403 };
  if (session.mode === "owner") return { allowed: true };
  if (!session.employeeId) return { allowed: false, status: 403 };
  return { allowed: true, employeeId: session.employeeId };
}

const sentQuote: Prisma.LeadWhereInput = {
  quotes: { some: { status: { in: ["SENT", "VIEWED", "ACCEPTED"] } } },
};
const linkedOrder: Prisma.LeadWhereInput = {
  quotes: { some: { order: { is: { status: { not: "CANCELLED" } } } } },
};
const qualifiedStatus: Prisma.LeadWhereInput = {
  status: { in: ["QUALIFIED", "NEED_PRICING", "QUOTING", "QUOTED", "NEGOTIATING", "WON"] },
};
const contactedStatus: Prisma.LeadWhereInput = {
  status: { in: ["CONTACTED", "QUALIFIED", "NEED_PRICING", "QUOTING", "QUOTED", "NEGOTIATING", "WON", "LOST"] },
};

/**
 * Cumulative cohort funnel by Lead.createdAt, not by mixed timestamps from different objects.
 * Each downstream stage is a subset of the previous stage. No indirect Customer-name join.
 */
export function funnelWhere(
  stage: FunnelStage, period: FunnelPeriod, now: Date,
  scope: { allowed: true; employeeId?: string },
): Prisma.LeadWhereInput {
  const start = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
  const cohort: Prisma.LeadWhereInput = {
    createdAt: { gte: start, lte: now },
    ...(scope.employeeId ? { assignedEmployeeId: scope.employeeId } : {}),
  };
  const stageCondition: Record<FunnelStage, Prisma.LeadWhereInput> = {
    received: {},
    contacted: { OR: [contactedStatus, sentQuote, linkedOrder] },
    qualified: { OR: [qualifiedStatus, sentQuote, linkedOrder] },
    quoted: { OR: [sentQuote, linkedOrder] },
    ordered: linkedOrder,
  };
  return { AND: [cohort, stageCondition[stage]] };
}

export function funnelPercent(count: number, previous: number): number | null {
  return previous > 0 ? Math.round(count / previous * 1000) / 10 : null;
}
