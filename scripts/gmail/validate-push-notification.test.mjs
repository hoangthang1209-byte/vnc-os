import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function run(payload) {
  return spawnSync(process.execPath, ["scripts/gmail/validate-push-notification.mjs"], {
    input: JSON.stringify(payload), encoding: "utf8", timeout: 5000,
  });
}
function event(payload) {
  return { message: { messageId: "evt-1", data: Buffer.from(JSON.stringify(payload)).toString("base64") } };
}
test("accepts valid Gmail watch notification without exposing mailbox", () => {
  const result = run(event({ emailAddress: "support@vietnamclothing.vn", historyId: "123456789" }));
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).valid, true);
  assert.doesNotMatch(result.stdout, /support@vietnamclothing.vn/);
});
test("rejects malformed Pub/Sub data", () => {
  assert.notEqual(run({ message: { data: "*not-base64*" } }).status, 0);
});
test("rejects invalid mailbox and nonnumeric history IDs", () => {
  assert.notEqual(run(event({ emailAddress: "wrong", historyId: "123" })).status, 0);
  assert.notEqual(run(event({ emailAddress: "support@vietnamclothing.vn", historyId: "not-history" })).status, 0);
});
test("rejects no message envelope", () => {
  assert.notEqual(run({}).status, 0);
});
