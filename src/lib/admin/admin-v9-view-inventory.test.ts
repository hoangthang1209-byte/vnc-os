import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_V9_VIEW_INVENTORY, ADMIN_V9_ACCEPTANCE_GATE_NAMES } from "./admin-v9-view-inventory";

const groups = {
  "WORKSPACE": 4,
  "SALES & CRM": 5,
  "ORDERS & OPERATIONS": 7,
  "TECHNICAL & SOURCING": 6,
  "FINANCE & DOCUMENTS": 3,
  "PRODUCTS & MULTI-SITE": 4,
  "CONTENT & MARKETING": 11,
  "ADMINISTRATION": 4,
};

describe("V9 Final 44-view acceptance inventory", () => {
  it("locks 44 distinct views across the approved 8 domains", () => {
    assert.equal(ADMIN_V9_VIEW_INVENTORY.length, 44);
    assert.equal(new Set(ADMIN_V9_VIEW_INVENTORY.map(v => v.id)).size, 44);
    assert.deepEqual(
      Object.fromEntries(Object.keys(groups).map(domain => [domain, ADMIN_V9_VIEW_INVENTORY.filter(v => v.domain === domain).length])),
      groups,
    );
  });
  it("never claims acceptance from a route candidate", () => {
    for (const view of ADMIN_V9_VIEW_INVENTORY) {
      assert.equal(view.acceptance, "not-verified");
      assert.ok(view.title.trim());
      if (view.candidateRoute !== null) assert.ok(view.candidateRoute.startsWith("/admin/"));
    }
  });
  it("requires both viewports and production verification", () => {
    for (const gate of ["authenticated-desktop", "authenticated-mobile", "rbac-role-matrix", "verified-production"]) {
      assert.ok(ADMIN_V9_ACCEPTANCE_GATE_NAMES.includes(gate as (typeof ADMIN_V9_ACCEPTANCE_GATE_NAMES)[number]));
    }
  });
});
