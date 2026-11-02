import assert from "node:assert/strict";
import test from "node:test";
import { classifyDueAt, getLeadTaskAccess } from "./action-center-access";
import { createAnonymousSession, createOwnerSession, type AdminSessionUser } from "@/features/auth/admin-session.types";

test("anonymous cannot read Action Center", () => {
  assert.deepEqual(getLeadTaskAccess(createAnonymousSession()), { allowed: false, status: 401 });
});
test("owner may read the CRM task queue", () => {
  assert.deepEqual(getLeadTaskAccess(createOwnerSession()), { allowed: true });
});
test("non-owner requires both leads.view and an employee identity", () => {
  const base: AdminSessionUser = { ...createAnonymousSession(), authenticated: true, mode: "user", permissions: new Map([["leads.view", "ALL" as const]]) };
  assert.deepEqual(getLeadTaskAccess(base), { allowed: false, status: 403 });
  assert.deepEqual(getLeadTaskAccess({ ...base, employeeId:"emp_001" }), { allowed: true, ownerId:"emp_001" });
  assert.deepEqual(getLeadTaskAccess({ ...base, employeeId:"emp_001", permissions:new Map() }), { allowed: false, status: 403 });
});
test("due date classification uses Vietnam business date", () => {
  const now = new Date("2026-11-02T18:00:00.000Z"); // 03 Nov 01:00 in VN
  assert.equal(classifyDueAt(new Date("2026-11-02T16:59:00.000Z"), now), "overdue");
  assert.equal(classifyDueAt(new Date("2026-11-02T17:30:00.000Z"), now), "today");
  assert.equal(classifyDueAt(new Date("2026-11-04T00:00:00.000Z"), now), "upcoming");
  assert.equal(classifyDueAt(null, now), "unscheduled");
});
