import assert from "node:assert/strict";
import test from "node:test";
import { parseVerifiedGmailPushData, VNC_GMAIL_PILOT_MAILBOX } from "./gmail-push-event";

const allowed = new Set([VNC_GMAIL_PILOT_MAILBOX]);
const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64");

test("accepts only explicitly configured pilot mailbox with numeric history ID", () => {
  const event = parseVerifiedGmailPushData(
    encode({ emailAddress: "SUPPORT@VIETNAMCLOTHING.VN", historyId: "123456789" }), allowed,
  );
  assert.deepEqual(event, { mailbox: VNC_GMAIL_PILOT_MAILBOX, historyId: "123456789" });
  assert.equal(parseVerifiedGmailPushData(encode({ emailAddress: "other@example.com", historyId: "123" }), allowed), null);
});

test("rejects malformed and spoofed payloads", () => {
  assert.equal(parseVerifiedGmailPushData("!", allowed), null);
  assert.equal(parseVerifiedGmailPushData(encode({ emailAddress: VNC_GMAIL_PILOT_MAILBOX, historyId: "not-an-id" }), allowed), null);
  assert.equal(parseVerifiedGmailPushData(encode({ emailAddress: VNC_GMAIL_PILOT_MAILBOX }), allowed), null);
});
