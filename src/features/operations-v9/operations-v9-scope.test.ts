import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { buildScopedOrderWhere } from "@/features/auth/order-scope";
import { can, getPermissionScope } from "@/features/auth/admin-permissions";

function session(scope: "ALL" | "OWN" | "ASSIGNED" | "NONE", employeeId: string | null = "staff-1"): AdminSessionUser {
  return {
    authenticated: true, mode: "user", userId: "admin-user", username: "operator",
    roleId: "role", roleCode: "PRODUCTION", employeeId, legacyEmployeeRole: null,
    permissions: new Map([["production.view", scope]]),
  };
}

describe("Operations V9 server-side production data gate (#376)", () => {
  it("blocks users with no production.view grant before querying confidential records", () => {
    const user = session("NONE");
    assert.equal(can(user, "production.view"), false);
    assert.deepEqual(buildScopedOrderWhere(user, "production.view"), { id: "__no_access__" });
  });
  it("does not allow OWN access without an employee identity", () => {
    assert.deepEqual(buildScopedOrderWhere(session("OWN", null), "production.view"), { id: "__no_access__" });
  });
  it("constrains OWN records to the matching sales employee", () => {
    assert.equal(getPermissionScope(session("OWN"), "production.view"), "OWN");
    assert.deepEqual(buildScopedOrderWhere(session("OWN"), "production.view"), { salesEmployeeId: "staff-1" });
  });
  it("constrains ASSIGNED records to an actual order role", () => {
    assert.deepEqual(buildScopedOrderWhere(session("ASSIGNED"), "production.view"), {
      OR: [
        { productionOwnerId: "staff-1" },
        { deliveryOwnerId: "staff-1" },
        { salesEmployeeId: "staff-1" },
      ],
    });
  });
  it("allows ALL grants and owner sessions across production orders", () => {
    assert.deepEqual(buildScopedOrderWhere(session("ALL"), "production.view"), {});
  });
});
