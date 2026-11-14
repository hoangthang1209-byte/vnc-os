import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Order Item QC execution workspace contract", () => {
  const source = readFileSync("src/components/admin/orders/OrderItemExecutionCard.tsx", "utf8");

  it("uses saved QC record for the quantity summary", () => {
    assert.match(source, /Kết quả QC đã ghi nhận/);
    for (const field of ["inspectedQuantity", "passedQuantity", "defectQuantity", "reworkQuantity", "scrapQuantity"]) {
      assert.ok(source.includes(`qc.${field}`), `missing persisted field ${field}`);
    }
    assert.doesNotMatch(source, /\["Đã kiểm", qcForm/);
  });

  it("only deep-links an individual order item from another workspace", () => {
    assert.ok(source.includes('!isLegacySharedData && item.orderItemId && variant !== "workspace-qc"'));
    assert.ok(source.includes("/admin/production/jobs/"));
    assert.ok(source.includes("encodeURIComponent(item.orderItemId)"));
  });
});
