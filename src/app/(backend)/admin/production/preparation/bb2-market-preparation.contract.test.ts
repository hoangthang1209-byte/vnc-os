import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync("src/app/(backend)/admin/production/preparation/page.tsx", "utf8");

describe("BIGBANG production preparation — all active markets", () => {
  it("includes four production markets and filters order item scope", () => {
    assert.match(page, /const MARKETS = \["KUL", "JKT", "MNL", "KHH"\] as const/);
    assert.match(page, /const marketItems = order\.items\.filter/);
    assert.match(page, /MARKETS\.includes/);
    assert.match(page, /orderItemId: \{ in: itemIds \}/);
  });
  it("sums market totals without duplicating SKU rows", () => {
    assert.match(page, /row\.quantities\[market\] \+= item\.quantity/);
    assert.match(page, /MARKETS\.reduce\(\(sum, market\) => sum \+ v\.quantities\[market\], 0\)/);
    assert.match(page, /grouped\.size\} style/);
    assert.doesNotMatch(page, /13 style —/);
  });
  it("does not claim shipment or BOM completed when records are absent", () => {
    assert.match(page, /const missingBom = itemIds\.length/);
    assert.match(page, /!deliveries\.length/);
    assert.match(page, /không phải vận đơn/);
  });
});
