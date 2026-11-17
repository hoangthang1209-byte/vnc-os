import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("V9 Orders filter reset", () => {
  const source = readFileSync("src/components/admin/orders/OrderListManager.tsx", "utf8");

  it("resets every URL-backed filter and page number, including customer and payment filters", () => {
    const resetStart = source.indexOf("const clearFilters = () => {");
    const resetEnd = source.indexOf("};", resetStart);
    assert.ok(resetStart >= 0 && resetEnd > resetStart);
    const reset = source.slice(resetStart, resetEnd);
    for (const fragment of ['setSearchInput("")', 'search: ""', 'customerId: ""', 'status: ""', 'paymentState: ""', 'quickFilter: "all"', 'kpi: ""', 'mine: false', 'page: 1']) {
      assert.ok(reset.includes(fragment), "Missing filter reset: " + fragment);
    }
  });

  it("uses the same filter predicate for reset affordance and empty result messaging", () => {
    assert.match(source, /const hasActiveFilters = Boolean\(/);
    assert.match(source, /filters\.customerId \|\| filters\.status/);
    assert.match(source, /filters\.paymentState \|\| filters\.kpi/);
    assert.ok(source.includes('aria-label="Xóa tất cả bộ lọc đơn hàng"'));
    assert.ok(source.includes('{hasActiveFilters && ('));
    assert.match(source, /\{hasActiveFilters\s*\? "Không tìm thấy đơn hàng phù hợp\."/);
  });
});
