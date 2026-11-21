import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { reconcileFactoryHandover, validateFactoryHandover, type FactoryHandoverType } from "./factory-handover-balance";

type Event = { type: FactoryHandoverType; quantity: number };
const events: Event[] = [
  { type: "VNC_DISPATCH", quantity: 600 },
  { type: "VNC_DISPATCH", quantity: 400 },
  { type: "FACTORY_RECEIVE", quantity: 700 },
  { type: "FACTORY_RETURN", quantity: 350 },
  { type: "VNC_RECEIVE", quantity: 200 },
];

describe("VNC ↔ Factory physical custody ledger",()=>{
  it("reconciles partial dispatch, receipt, returns and unmatched movements",()=>{
    assert.deepEqual(reconcileFactoryHandover(1000,events),{
      dispatched:1000,factoryReceived:700,factoryReturned:350,vncReceived:200,
      awaitingFactory:300,withFactory:350,returning:150,
    });
  });
  it("rejects overdispatch, overreceipt, overreturn and unreceived returns",()=>{
    assert.throws(()=>validateFactoryHandover(1000, events, {type:"VNC_DISPATCH",quantity:1}),/khớp/);
    assert.throws(()=>validateFactoryHandover(1000, events, {type:"FACTORY_RECEIVE",quantity:301}),/khớp/);
    assert.throws(()=>validateFactoryHandover(1000, events, {type:"FACTORY_RETURN",quantity:351}),/khớp/);
    assert.throws(()=>validateFactoryHandover(1000, events, {type:"VNC_RECEIVE",quantity:151}),/khớp/);
  });
  it("rejects zero, negative and decimal quantities",()=>{
    for (const quantity of [0,-1,1.5,Number.NaN]) {
      assert.throws(()=>validateFactoryHandover(1000,events,{type:"FACTORY_RECEIVE",quantity}),/nguyên dương/);
    }
  });
  it("requires scoped access, server transaction lock, and a real active batch",()=>{
    const service=readFileSync("src/features/item-production-tracking/factory-handover.service.ts","utf8");
    const api=readFileSync("src/app/api/manufacturing/production-batches/[batchId]/handover/route.ts","utf8");
    const panel=readFileSync("src/components/admin/item-production/ItemProductionBatchPanel.tsx","utf8");
    assert.match(service,/FOR UPDATE/);
    assert.match(service,/buildAssignedJobFilter/);
    assert.match(service,/buildProductionPlanOrderWhere/);
    assert.match(service,/batch\.status !== "ACTIVE"/);
    assert.match(api,/requireProductionUpdate/);
    assert.match(api,/can\(auth\.session, "production\.update"\)/);
    assert.match(panel,/FactoryHandoverPanel/);
  });
});
