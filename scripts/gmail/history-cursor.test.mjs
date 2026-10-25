import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeHistoryId, selectNextHistoryId } from "./history-cursor.mjs";

test("historyId does not lose precision beyond Number.MAX_SAFE_INTEGER", () => {
  const large = "900719925474099317777";
  assert.equal(normalizeHistoryId(large), large);
  assert.equal(selectNextHistoryId("900719925474099317776", large), large);
});
test("cursor never regresses under duplicate or out-of-order notifications", () => {
  assert.equal(selectNextHistoryId("101", "100"), "101");
  assert.equal(selectNextHistoryId("101", "101"), "101");
  assert.equal(selectNextHistoryId(null, "101"), "101");
});
test("invalid cursor values fail closed", () => {
  for (const value of [0, -1, "0", "12abc", "", " 12", "1.1"]) {
    assert.throws(() => normalizeHistoryId(value));
  }
});
