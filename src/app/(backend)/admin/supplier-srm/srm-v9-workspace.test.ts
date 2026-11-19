import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Supplier SRM V9 task navigation", () => {
  const src = readFileSync("src/app/(backend)/admin/supplier-srm/page.tsx", "utf8");
  it("provides reachable task shortcuts to real sections", () => {
    assert.match(src, /aria-label="Điều hướng tác vụ SRM"/);
    for (const id of ["srm-create", "srm-suppliers", "srm-rfqs", "srm-quote-update", "srm-scorecards"]) {
      assert.ok(src.includes('id="' + id + '"'), "Missing anchored SRM section: " + id);
      assert.ok(src.includes('["' + id + '",'), "Missing task shortcut: " + id);
    }
  });
  it("preserves existing supplier/RFQ/scorecard APIs", () => {
    for (const endpoint of ["/api/production-suppliers", "/api/supplier-rfqs", "/api/supplier-scorecards"]) {
      assert.ok(src.includes(endpoint), "Missing existing API workflow " + endpoint);
    }
    assert.ok(src.includes("V9SupplierOverview"));
  });
});
