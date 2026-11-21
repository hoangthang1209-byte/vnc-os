import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

describe("QC → Shipment execution safety", () => {
  const qc = readFileSync("src/features/orders/qc-inspection.service.ts", "utf8");
  const shipment = readFileSync("src/features/orders/delivery-execution.service.ts", "utf8");
  it("requires Lean Ops item-level QC to be backed by VNC physical receipts", () => {
    assert.match(qc, /handoverEvents: \{ where: \{ type: "VNC_RECEIVE" \}/);
    assert.match(qc, /Đơn sản xuất theo lô cần QC cho từng SKU/);
    assert.match(qc, /inspectedQuantity\.gt\(physicallyReceived\)/);
    assert.match(qc, /passedQuantity\.gt\(physicallyReceived\)/);
  });
  it("serializes shipment dispatch and rejects missing/overdrawn QC", () => {
    assert.match(shipment, /FOR UPDATE/);
    assert.match(shipment, /Shipment phải liên kết SKU đơn hàng/);
    assert.match(shipment, /status: \{ in: \["PASSED", "PASSED_WITH_NOTE"\] \}/);
    assert.match(shipment, /Shipment vượt số lượng QC đạt/);
    assert.match(shipment, /status: "DISPATCHED"/);
  });
});
