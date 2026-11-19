import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_V9_VIEW_INVENTORY } from "./admin-v9-view-inventory";
import { makeV9QaLedger, V9_QA_ROLES, V9_QA_VIEWPORTS } from "./admin-v9-qa-ledger";

describe("V9 Final acceptance matrix coverage", () => {
  const entries = makeV9QaLedger();

  it("covers all 44 views across every approved role and viewport", () => {
    assert.equal(ADMIN_V9_VIEW_INVENTORY.length, 44);
    assert.equal(entries.length, 44 * 5 * 2);
    assert.equal(new Set(entries.map(e => [e.viewId, e.role, e.viewport].join("|"))).size, entries.length);
    for (const view of ADMIN_V9_VIEW_INVENTORY) {
      const cases = entries.filter(e => e.viewId === view.id);
      assert.equal(cases.length, 10);
      assert.deepEqual(new Set(cases.map(e => e.role)), new Set(V9_QA_ROLES));
      assert.deepEqual(new Set(cases.map(e => e.viewport)), new Set(V9_QA_VIEWPORTS));
    }
  });

  it("marks every check pending; never fabricates access, screenshots or QA success", () => {
    for (const entry of entries) {
      assert.equal(entry.expectedAccess, "not-defined");
      assert.equal(entry.actualAccess, "not-tested");
      assert.equal(entry.visual, "not-tested");
      assert.equal(entry.functional, "not-tested");
      assert.equal(entry.screenshotEvidence, "");
      assert.equal(entry.testedBy, "");
    }
  });
});
