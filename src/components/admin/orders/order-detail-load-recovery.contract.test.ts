import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("V9 Order Detail loading and error recovery", () => {
  const src = readFileSync("src/components/admin/orders/OrderDetailView.tsx", "utf8");
  it("never leaves loading stuck after a failed fetch or malformed response", () => {
    const start = src.indexOf("async function load() {");
    const end = src.indexOf("useEffect(() => {", start);
    const load = src.slice(start, end);
    assert.ok(start > -1 && end > start);
    for (const fragment of ["setError(null);", "try {", "if (!res.ok)", "catch {", "finally {", "setLoading(false);"]) {
      assert.ok(load.includes(fragment), "Missing load recovery step " + fragment);
    }
    assert.match(load, /const failure = await res\.json\(\)\.catch\(\(\) => null\)/);
    assert.ok(load.includes("setProductionFields(syncProductionFields(next))"));
  });
  it("offers accessible retry without losing the prior list context", () => {
    assert.ok(src.includes('<p role="alert">{error ?? "Không tìm thấy đơn hàng"}</p>'));
    assert.ok(src.includes("onClick={() => void load()}"));
    assert.ok(src.includes('href={listBackHref}'));
  });
});
