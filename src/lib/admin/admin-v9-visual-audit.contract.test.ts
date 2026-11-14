import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("V9 authenticated visual QA harness is read-only and restricted", () => {
  const source = readFileSync("scripts/admin-v9-visual-audit.ts", "utf8");

  it("requires operator-provided session, host and private output directory", () => {
    for (const key of ["V9_BASE_URL", "V9_STORAGE_STATE_FILE", "V9_OUTPUT_DIR"]) {
      assert.ok(source.includes(key));
    }
    assert.ok(source.includes("os.vietnamclothing.vn"));
    assert.ok(source.includes("hoangthang1209-3040s-projects.vercel.app"));
    assert.ok(source.includes('request.isNavigationRequest()'));
  });

  it("captures V9 route candidates at desktop and mobile, not synthetic entity IDs", () => {
    assert.ok(source.includes("ADMIN_V9_VIEW_INVENTORY.filter"));
    assert.ok(source.includes('name: "desktop", width: 1440, height: 900'));
    assert.ok(source.includes('name: "mobile", width: 390, height: 844'));
    assert.ok(source.includes("outOfScopeWithoutConcreteRoute"));
  });

  it("does not claim completion or mutate the app", () => {
    assert.ok(source.includes("Does NOT certify auth, role matrix"));
    assert.ok(source.includes("captured-not-yet-accepted"));
    assert.ok(!source.includes("page.click("));
    assert.ok(!source.includes("page.fill("));
  });
});
