import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAnonymousSession, createOwnerSession, type AdminSessionUser } from "@/features/auth/admin-session.types";
import { FUNNEL_STAGES, funnelPercent, funnelWhere, getFunnelAccess, parseFunnelPeriod } from "./v9-lead-funnel";

const staff = (employeeId: string | null, grants: [string, "ALL" | "NONE"][] = [["leads.view", "ALL"]]): AdminSessionUser => ({
  ...createOwnerSession(), mode: "user", employeeId, permissions: new Map(grants),
});

describe("V9 lead funnel permission gates", () => {
  it("returns 401 for anonymous and 403 without lead permission", () => {
    assert.deepEqual(getFunnelAccess(createAnonymousSession()), { allowed: false, status: 401 });
    assert.deepEqual(getFunnelAccess(staff("emp-2", [])), { allowed: false, status: 403 });
    assert.deepEqual(getFunnelAccess(staff("emp-2", [["leads.view", "NONE"]])), { allowed: false, status: 403 });
    assert.deepEqual(getFunnelAccess(staff(null)), { allowed: false, status: 403 });
  });
  it("allows owner all leads but staff only their own", () => {
    assert.deepEqual(getFunnelAccess(createOwnerSession()), { allowed: true });
    assert.deepEqual(getFunnelAccess(staff("emp-1")), { allowed: true, employeeId: "emp-1" });
  });
});

describe("V9 cumulative Lead → Quote → Order cohort", () => {
  const now = new Date("2026-11-04T10:00:00.000Z");
  it("accepts only supported time windows", () => {
    assert.equal(parseFunnelPeriod("7"), 7);
    assert.equal(parseFunnelPeriod("30"), 30);
    assert.equal(parseFunnelPeriod("90"), 90);
    assert.equal(parseFunnelPeriod("9999"), null);
    assert.equal(parseFunnelPeriod("garbage"), null);
  });
  it("applies identical assigned-owner and created-date scope at every step", () => {
    for (const s of FUNNEL_STAGES) {
      const where = funnelWhere(s.key, 30, now, { allowed: true, employeeId: "emp-1" });
      assert.ok("AND" in where);
      const cohort = (where.AND as object[])[0] as { createdAt: { gte: Date; lte: Date }; assignedEmployeeId: string };
      assert.equal(cohort.assignedEmployeeId, "emp-1");
      assert.equal(cohort.createdAt.gte.toISOString(), "2026-10-05T10:00:00.000Z");
      assert.equal(cohort.createdAt.lte.toISOString(), now.toISOString());
    }
  });
  it("counts converted orders only through a directly linked quote", () => {
    const where = funnelWhere("ordered", 7, now, { allowed: true });
    const terminal = (where.AND as object[])[1] as { quotes: { some: { order: { is: { status: { not: string } } } } } };
    assert.equal(terminal.quotes.some.order.is.status.not, "CANCELLED");
    assert.equal(funnelPercent(5, 10), 50);
    assert.equal(funnelPercent(0, 0), null);
  });
});
