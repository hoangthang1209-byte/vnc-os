import assert from "node:assert/strict";
import { test } from "node:test";
import { assessLeadershipAction, LEADERSHIP_ACTIONS, LEADERSHIP_ROLES } from "./leadership-policy";

test("MVP has four bounded roles", () => { assert.equal(LEADERSHIP_ROLES.length, 4); });
test("unauthenticated access is denied", () => {
  for (const action of LEADERSHIP_ACTIONS) assert.equal(assessLeadershipAction(action, false).allowed, false);
});
test("read-only planning is permitted to authenticated operators", () => {
  for (const action of ["read_status", "draft_plan"] as const) assert.equal(assessLeadershipAction(action, true).allowed, true);
});
test("all writes and high risk actions require separate human approval", () => {
  for (const action of LEADERSHIP_ACTIONS.filter(a => a !== "read_status" && a !== "draft_plan")) {
    const result = assessLeadershipAction(action, true);
    assert.equal(result.allowed, false); assert.equal(result.requiresHumanApproval, true);
  }
});
