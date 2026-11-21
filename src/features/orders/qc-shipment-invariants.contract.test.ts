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
    assert.match(shipment, /Shipment vượt số lượng đã đóng carton/);
    assert.match(shipment, /Chuyến mới phải bắt đầu ở trạng thái nháp/);
    assert.match(shipment, /Phải dùng thao tác Dispatch/);
  });
  it("cartons seal only against approved QC and cannot be unsealed after dispatch",()=>{
    const service=readFileSync("src/features/orders/packing-carton.service.ts","utf8");
    const schema=readFileSync("prisma/schema.prisma","utf8");
    const api=readFileSync("src/app/api/orders/[id]/packing-cartons/route.ts","utf8");
    assert.match(service,/FOR UPDATE/);
    assert.match(service,/status: "SEALED"/);
    assert.match(service,/Carton vượt số lượng QC đạt/);
    assert.match(service,/Không thể mở carton khi số lượng đã xuất/);
    assert.match(schema,/model OrderPackingCarton/);
    assert.match(api,/canAccessPackingOrder/);
  });
});
