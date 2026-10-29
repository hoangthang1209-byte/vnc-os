import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planSafeParallelDispatch, type G3Task } from "./g3-parallel-dispatch";

const task = (id: string, resources: string[], overrides: Partial<G3Task> = {}): G3Task => ({
  id, resources, dependencies: [], priority: 1, state: "QUEUED",
  requiresHumanApproval: false, humanApproved: false, ...overrides,
});

describe("G3 safe parallel dispatch", () => {
  it("dispatches independent tasks in priority order", () => {
    const result = planSafeParallelDispatch([task("a", ["crm"]), task("b", ["srm"], {priority: 2})], 2);
    assert.deepEqual(result.selected, ["b", "a"]);
  });
  it("defers overlapping resources even with spare capacity", () => {
    const result = planSafeParallelDispatch([task("a", ["schema"]), task("b", ["schema"])], 3);
    assert.deepEqual(result.selected, ["a"]);
    assert.deepEqual(result.deferred, [{id:"b", reason:"resource_conflict"}]);
  });
  it("honors active leases and missing scope", () => {
    const result = planSafeParallelDispatch([
      task("active", ["admin-shell"], {state:"RUNNING"}),
      task("next", ["admin-shell"]),
      task("unknown", []),
    ], 3);
    assert.deepEqual(result.selected, []);
    assert.equal(result.deferred[0].reason, "resource_conflict");
    assert.equal(result.deferred[1].reason, "unclassified_resources");
  });
  it("fails closed for unmet or unknown dependencies and human approval", () => {
    const result = planSafeParallelDispatch([
      task("a", ["a"], {dependencies:["missing"]}),
      task("b", ["b"], {requiresHumanApproval:true}),
    ], 2);
    assert.deepEqual(result.selected, []);
    assert.deepEqual(result.deferred.map((d) => d.reason), ["dependencies_unverified", "human_approval"]);
  });
  it("requires completed dependencies and accepts explicit approval", () => {
    const result = planSafeParallelDispatch([
      task("done", ["old"], {state:"COMPLETE"}),
      task("next", ["new"], {dependencies:["done"], requiresHumanApproval:true, humanApproved:true}),
    ], 1);
    assert.deepEqual(result.selected, ["next"]);
  });
  it("never dispatches when an active task has unknown scope", () => {
    const result = planSafeParallelDispatch([task("running", [], {state:"RUNNING"}), task("next", ["crm"])], 2);
    assert.deepEqual(result.selected, []);
  });
  it("rejects duplicate IDs and invalid capacity", () => {
    assert.throws(() => planSafeParallelDispatch([task("a", ["x"]), task("a", ["y"])], 2));
    assert.throws(() => planSafeParallelDispatch([], -1));
  });
});
