import assert from "node:assert/strict";
import test from "node:test";
import {
  externalLeadSourceRef,
  isReadyForCanonicalLeadIntake,
  normalizeVerifiedExternalEvent,
} from "./external-channel-normalization";

test("normalizes six external channels with replay-safe source refs", () => {
  for (const channel of ["GMAIL","FACEBOOK_LEAD_ADS","FACEBOOK_MESSENGER","INSTAGRAM_DM","ZALO_OA","WHATSAPP_BUSINESS"] as const) {
    const value = normalizeVerifiedExternalEvent(channel, { eventId: "evt-1", accountId: "account-9", text: "Báo giá 100 áo" });
    assert.ok(value);
    assert.equal(value.channel, channel);
    assert.equal(value.message, "Báo giá 100 áo");
    assert.equal(isReadyForCanonicalLeadIntake(value), false);
    assert.ok(externalLeadSourceRef(value).startsWith(channel + ":account-9:evt-1"));
  }
});

test("rejects absent provider identity and does not forge customer contacts", () => {
  assert.equal(normalizeVerifiedExternalEvent("GMAIL", { eventId: "id" }), null);
  const social = normalizeVerifiedExternalEvent("ZALO_OA", { eventId: "event", accountId: "oa", contactName: "Alice" });
  assert.ok(social);
  assert.equal(social.email, null);
  assert.equal(social.phone, null);
  assert.equal(isReadyForCanonicalLeadIntake(social), false);
});

test("accepts verified contact route and guards excessive payload", () => {
  const value = normalizeVerifiedExternalEvent("FACEBOOK_LEAD_ADS", {
    eventId: "lead-1", accountId: "page-1", phone: "0901234567", text: "a".repeat(9000),
  });
  assert.ok(value);
  assert.equal(isReadyForCanonicalLeadIntake(value), true);
  assert.equal(value.message.length, 4000);
});
