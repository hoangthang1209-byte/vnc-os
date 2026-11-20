import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read=(path:string)=>readFileSync(path,"utf8");
describe("Production Planning → Factory Execution wiring",()=>{
  const batchPanel=read("src/components/admin/item-production/ItemProductionBatchPanel.tsx");
  const batchService=read("src/features/item-production-tracking/item-production-batch.service.ts");
  const batchApi=read("src/app/api/manufacturing/production-items/[id]/batches/route.ts");
  const batchUpdateApi=read("src/app/api/manufacturing/production-batches/[batchId]/route.ts");
  it("lets an operator assign a real supplier, PIC, start/end dates while creating a batch",()=>{
    assert.match(batchPanel,/production-suppliers\?activeOnly=true/);
    assert.match(batchPanel,/employees\?active=1/);
    assert.match(batchPanel,/supplierId: form\.supplierId \|\| null/);
    assert.match(batchPanel,/picEmployeeId: form\.picEmployeeId \|\| null/);
    assert.match(batchPanel,/plannedStartAt: form\.plannedStartAt \|\| null/);
    assert.match(batchPanel,/plannedEndAt: form\.plannedEndAt \|\| null/);
    assert.match(batchApi,/requireProductionUpdate/);
  });
  it("supports editing the assigned factory and schedule, with audit logs",()=>{
    assert.match(batchPanel,/async function saveBatchAssignment/);
    assert.match(batchPanel,/method: "PATCH"/);
    assert.match(batchPanel,/Phân công \/ lịch/);
    assert.match(batchUpdateApi,/canAssign/);
    assert.match(batchService,/SUPPLIER_REASSIGNED/);
    assert.match(batchService,/PLANNED_DATES_CHANGED/);
  });
  it("rejects fractional allocations and reversed dates server-side",()=>{
    assert.match(batchService,/Number\.isSafeInteger\(input\.plannedQuantity\)/);
    assert.match(batchService,/Number\.isSafeInteger\(patch\.plannedQuantity\)/);
    assert.match(batchService,/assertBatchDates\(input\.plannedStartAt, input\.plannedEndAt\)/);
    assert.match(batchService,/assertBatchDates\(start, end\)/);
  });
});
