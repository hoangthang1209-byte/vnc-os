import { test } from "node:test";
import assert from "node:assert/strict";
import { canPublishCmsContent, canResolvePublicCmsContent, requireCmsScope } from "./cms-site-policy";


test("rejects an unauthorized site even when the site id exists", () => {
    assert.throws(() => requireCmsScope({ siteId: "vietnamclothing.vn", locale: "en" }, ["attd.vn"]), /CMS site access denied/);
  });
test("rejects unknown sites and locales", () => {
    assert.throws(() => requireCmsScope({ siteId: "other.example", locale: "vi" }, ["other.example"]));
    assert.throws(() => requireCmsScope({ siteId: "attd.vn", locale: "fr" }, ["attd.vn"]));
  });
test("only approves owned, non-demo content with approved media", () => {
    const x = { siteId: "vietnamclothing.vn", revisionSiteId: "vietnamclothing.vn", locale: "en", status: "APPROVED" as const, isDemo: false, approvedById: "editor1", mediaRightsApproved: true };
    assert.equal(canPublishCmsContent(x), true);
    assert.equal(canPublishCmsContent({ ...x, isDemo: true }), false);
    assert.equal(canPublishCmsContent({ ...x, revisionSiteId: "attd.vn" }), false);
    assert.equal(canPublishCmsContent({ ...x, mediaRightsApproved: false }), false);
    assert.equal(canPublishCmsContent({ ...x, approvedById: null }), false);
  });
test("never serves an unpublished, demo, mismatched or cross-site revision", () => {
    const x = { siteId: "vietnamclothing.vn", requestedSiteId: "vietnamclothing.vn", locale: "en", status: "PUBLISHED" as const, isDemo: false, publishedRevisionId: "r1", revisionId: "r1" };
    assert.equal(canResolvePublicCmsContent(x), true);
    assert.equal(canResolvePublicCmsContent({ ...x, isDemo: true }), false);
    assert.equal(canResolvePublicCmsContent({ ...x, requestedSiteId: "attd.vn" }), false);
    assert.equal(canResolvePublicCmsContent({ ...x, revisionId: "r2" }), false);
    assert.equal(canResolvePublicCmsContent({ ...x, publishedRevisionId: null }), false);
    assert.equal(canResolvePublicCmsContent({ ...x, status: "DRAFT" }), false);
  });
