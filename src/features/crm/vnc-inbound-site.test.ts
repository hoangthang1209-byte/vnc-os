import assert from "node:assert/strict";
import test from "node:test";
import { cleanInboundAttribution, resolveVncInboundSite } from "./vnc-inbound-site";

test("accepts only trusted website sourceSite values", () => {
  assert.deepEqual(resolveVncInboundSite(" ATTD.VN "), { site: "attd.vn", channel: "WEBSITE_ATTD" });
  assert.deepEqual(resolveVncInboundSite("vietnamclothing.vn"), { site: "vietnamclothing.vn", channel: "WEBSITE_VIETNAMCLOTHING" });
  assert.deepEqual(resolveVncInboundSite("aothunthongdiep.com"), { site: "aothunthongdiep.com", channel: "WEBSITE_AOTHUNTHONGDIEP" });
  assert.equal(resolveVncInboundSite("attd.vn.evil.test"), null);
  assert.equal(resolveVncInboundSite(""), null);
  assert.equal(resolveVncInboundSite({ site: "attd.vn" }), null);
});

test("attribution permits http(s) URLs only and bounds UTM", () => {
  const meta = cleanInboundAttribution({
    landingPage: "javascript:alert(1)",
    referrer: "https://example.com/page",
    utmSource: "google",
    utmCampaign: "x".repeat(250),
  });
  assert.equal(meta.landingPage, "");
  assert.equal(meta.referrer, "https://example.com/page");
  assert.equal(meta.utmSource, "google");
  assert.equal(meta.utmCampaign.length, 200);
});
