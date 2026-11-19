import { qcOrderScopeWhere } from "./qc-api-access";
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


// Scope regressions cover owner, legacy v1 roles, and narrower explicit QC writes.
describe("QC order-scope authorization", () => {
  it("keeps owner unrestricted", () => {
    assert.deepEqual(qcOrderScopeWhere(createOwnerSession(), "write"), {});
  });
  it("fails closed for legacy staff without an employee identity", () => {
    const legacy: AdminSessionUser = { ...createAnonymousSession(), authenticated: true, mode: "legacy", legacyEmployeeRole: "PRODUCTION" };
    assert.deepEqual(qcOrderScopeWhere(legacy, "write"), { id: "__no_access__" });
  });
  it("allows legacy production only on assigned orders", () => {
    const legacy: AdminSessionUser = { ...createAnonymousSession(), authenticated: true, mode: "legacy", legacyEmployeeRole: "PRODUCTION", employeeId: "worker-1" };
    assert.deepEqual(qcOrderScopeWhere(legacy, "write"), { OR: [
      { salesEmployeeId: "worker-1" },
      { productionOwnerId: "worker-1" },
      { deliveryOwnerId: "worker-1" },
    ] });
  });
  it("denies ungranted legacy QC writes", () => {
    const legacy: AdminSessionUser = { ...createAnonymousSession(), authenticated: true, mode: "legacy", legacyEmployeeRole: "SALES", employeeId: "sales-1" };
    assert.deepEqual(qcOrderScopeWhere(legacy, "write"), { id: "__no_access__" });
  });
  it("intersects explicitly granted read and QC write scopes", () => {
    const worker = employee([["orders.view", "ALL"], ["qc.update", "ASSIGNED"]]);
    assert.deepEqual(qcOrderScopeWhere(worker, "write"), { AND: [{}, { OR: [
      { productionOwnerId: "staff-1" },
      { deliveryOwnerId: "staff-1" },
      { salesEmployeeId: "staff-1" },
    ] }] });
  });
});

describe("QC access scope matrix", () => {
  it("rejects all anonymous order queries even if asked for a known ID", () => {
    assert.deepEqual(qcOrderScopeWhere(createAnonymousSession(), "read"), { id: "__no_access__" });
    assert.deepEqual(qcOrderScopeWhere(createAnonymousSession(), "write"), { id: "__no_access__" });
  });
  it("does not let QC permission alone bypass orders.view", () => {
    const noOrderRead = employee([["qc.update", "ALL"]]);
    assert.equal(qcPermissionStatus(noOrderRead, "write"), 403);
    assert.deepEqual(qcOrderScopeWhere(noOrderRead, "write"), { id: "__no_access__" });
  });
  it("restricts ASSIGNED reads to current employee relations", () => {
    const worker = employee([["orders.view", "ASSIGNED"]]);
    assert.deepEqual(qcOrderScopeWhere(worker, "read"), { OR: [
      { productionOwnerId: "staff-1" },
      { deliveryOwnerId: "staff-1" },
      { salesEmployeeId: "staff-1" },
    ] });
  });
  it("prevents a wider qc.update grant from expanding order visibility", () => {
    const worker = employee([["orders.view", "ASSIGNED"], ["qc.update", "ALL"]]);
    assert.deepEqual(qcOrderScopeWhere(worker, "write"), { AND: [
      { OR: [
        { productionOwnerId: "staff-1" },
        { deliveryOwnerId: "staff-1" },
        { salesEmployeeId: "staff-1" },
      ] },
      {},
    ] });
  });
  it("rejects legacy delivery QC mutation even when assigned", () => {
    const legacy: AdminSessionUser = {
      ...createAnonymousSession(), authenticated: true, mode: "legacy",
      legacyEmployeeRole: "DELIVERY", employeeId: "delivery-1",
    };
    assert.equal(qcPermissionStatus(legacy, "write"), 403);
    assert.deepEqual(qcOrderScopeWhere(legacy, "write"), { id: "__no_access__" });
  });
  it("restricts legacy sales to own orders for reading", () => {
    const legacy: AdminSessionUser = {
      ...createAnonymousSession(), authenticated: true, mode: "legacy",
      legacyEmployeeRole: "SALES", employeeId: "sales-1",
    };
    assert.deepEqual(qcOrderScopeWhere(legacy, "read"), { salesEmployeeId: "sales-1" });
  });
});

describe("QC main route shares the evidence authorization gate", () => {
  it("uses one access helper for GET, POST and PATCH", async () => {
    const { readFileSync } = await import("node:fs");
    const contents = readFileSync("src/app/api/orders/[id]/qc/route.ts", "utf8");
    assert.match(contents, /import \{ checkQcOrderAccess \} from/);
    assert.equal((contents.match(/checkQcOrderAccess\(req, id, /g) ?? []).length, 3);
    assert.doesNotMatch(contents, /function checkQcAccess\(/);
  });
});

describe("QC evidence routes use the order-scoped authorization gate", () => {
  it("rejects accidental reintroduction of generic commercial permission stub", async () => {
    const { readFileSync } = await import("node:fs");
    const base = "src/app/api/orders/[id]/qc/evidence";
    for (const route of [`${base}/route.ts`, `${base}/[evidenceId]/route.ts`]) {
      const contents = readFileSync(route, "utf8");
      assert.match(contents, /checkQcOrderAccess\(req, id, "write"\)/);
      assert.doesNotMatch(contents, /requireAdminPermission/);
    }
  });
  it("shares a 404 scoped order query before evidence mutations", async () => {
    const { readFileSync } = await import("node:fs");
    const shared = readFileSync("src/features/orders/qc-route-access.ts", "utf8");
    assert.match(shared, /qcPermissionStatus\(session, action\)/);
    assert.match(shared, /prisma\.order\.findFirst/);
    assert.match(shared, /qcOrderScopeWhere\(session, action\)/);
    assert.match(shared, /status: 404/);
  });
});
