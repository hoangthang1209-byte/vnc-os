import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { createAnonymousSession, createOwnerSession } from "@/features/auth/admin-session.types";
import { qcPermissionStatus } from "./qc-api-access";

const employee = (grants: Array<[string, "ALL" | "NONE" | "ASSIGNED"]>): AdminSessionUser => ({
  ...createAnonymousSession(),
  authenticated: true,
  mode: "user",
  employeeId: "staff-1",
  permissions: new Map(grants),
});

describe("QC route authorization", () => {
  it("rejects anonymous reads and writes with 401", () => {
    assert.equal(qcPermissionStatus(createAnonymousSession(), "read"), 401);
    assert.equal(qcPermissionStatus(createAnonymousSession(), "write"), 401);
  });
  it("allows owner session", () => {
    assert.equal(qcPermissionStatus(createOwnerSession(), "read"), null);
    assert.equal(qcPermissionStatus(createOwnerSession(), "write"), null);
  });
  it("allows read-only order role, denies mutations", () => {
    const viewer = employee([["orders.view", "ASSIGNED"]]);
    assert.equal(qcPermissionStatus(viewer, "read"), null);
    assert.equal(qcPermissionStatus(viewer, "write"), 403);
  });
  it("denies unrelated user grants", () => {
    const viewer = employee([["crm.view", "ALL"]]);
    assert.equal(qcPermissionStatus(viewer, "read"), 403);
    assert.equal(qcPermissionStatus(viewer, "write"), 403);
  });
  it("allows QC update only when explicitly granted", () => {
    const worker = employee([["orders.view", "ASSIGNED"], ["qc.update", "ASSIGNED"]]);
    assert.equal(qcPermissionStatus(worker, "read"), null);
    assert.equal(qcPermissionStatus(worker, "write"), null);
  });
});
