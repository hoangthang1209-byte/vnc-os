import { describe, expect, it } from "vitest";
import { canPublishCmsContent, canResolvePublicCmsContent, requireCmsScope } from "./cms-site-policy";

describe("CMS multi-site authorization boundaries", () => {
  it("rejects an unauthorized site even when the site id exists", () => {
    expect(() => requireCmsScope({ siteId: "vietnamclothing.vn", locale: "en" }, ["attd.vn"])).toThrow("CMS site access denied");
  });
  it("rejects unknown sites and locales", () => {
    expect(() => requireCmsScope({ siteId: "other.example", locale: "vi" }, ["other.example"])).toThrow();
    expect(() => requireCmsScope({ siteId: "attd.vn", locale: "fr" }, ["attd.vn"])).toThrow();
  });
  it("only approves owned, non-demo content with approved media", () => {
    const x = { siteId: "vietnamclothing.vn", revisionSiteId: "vietnamclothing.vn", locale: "en", status: "APPROVED" as const, isDemo: false, approvedById: "editor1", mediaRightsApproved: true };
    expect(canPublishCmsContent(x)).toBe(true);
    expect(canPublishCmsContent({ ...x, isDemo: true })).toBe(false);
    expect(canPublishCmsContent({ ...x, revisionSiteId: "attd.vn" })).toBe(false);
    expect(canPublishCmsContent({ ...x, mediaRightsApproved: false })).toBe(false);
    expect(canPublishCmsContent({ ...x, approvedById: null })).toBe(false);
  });
  it("never serves an unpublished, demo, mismatched or cross-site revision", () => {
    const x = { siteId: "vietnamclothing.vn", requestedSiteId: "vietnamclothing.vn", locale: "en", status: "PUBLISHED" as const, isDemo: false, publishedRevisionId: "r1", revisionId: "r1" };
    expect(canResolvePublicCmsContent(x)).toBe(true);
    expect(canResolvePublicCmsContent({ ...x, isDemo: true })).toBe(false);
    expect(canResolvePublicCmsContent({ ...x, requestedSiteId: "attd.vn" })).toBe(false);
    expect(canResolvePublicCmsContent({ ...x, revisionId: "r2" })).toBe(false);
    expect(canResolvePublicCmsContent({ ...x, publishedRevisionId: null })).toBe(false);
    expect(canResolvePublicCmsContent({ ...x, status: "DRAFT" })).toBe(false);
  });
});
