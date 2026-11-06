/**
 * Shared, database-independent content ownership policy.
 * This module intentionally does not authorize a user by itself:
 * callers must authenticate and then enforce assigned-site RBAC server-side.
 */
export const CMS_SITES = {
  "attd.vn": { label: "ATTD", defaultLocale: "vi", locales: ["vi", "en"] },
  "vietnamclothing.vn": { label: "VietnamClothing", defaultLocale: "en", locales: ["en", "vi"] },
} as const;

export type CmsSiteId = keyof typeof CMS_SITES;
export type CmsLocale = "vi" | "en";
export type CmsPublicationStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export function isCmsSiteId(value: unknown): value is CmsSiteId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CMS_SITES, value);
}
export function isCmsLocale(value: unknown): value is CmsLocale {
  return value === "vi" || value === "en";
}
/** Every data-access endpoint must apply this scope in its DB query. */
export function requireCmsScope(input: { siteId: unknown; locale: unknown }, assignedSites: readonly string[]) {
  if (!isCmsSiteId(input.siteId)) throw new Error("Invalid CMS site");
  if (!assignedSites.includes(input.siteId)) throw new Error("CMS site access denied");
  if (!isCmsLocale(input.locale)) throw new Error("Invalid CMS locale");
  return { siteId: input.siteId, locale: input.locale } as const;
}
/** Demo records are always drafts until explicitly verified and approved. */
export function canPublishCmsContent(input: {
  status: CmsPublicationStatus;
  isDemo: boolean;
  mediaRightsApproved: boolean;
  approvedById: string | null;
  siteId: unknown;
  revisionSiteId: unknown;
  locale: unknown;
}): boolean {
  return isCmsSiteId(input.siteId) && input.siteId === input.revisionSiteId &&
    isCmsLocale(input.locale) && input.status === "APPROVED" &&
    !input.isDemo && input.mediaRightsApproved && Boolean(input.approvedById);
}
/** Never serve draft content through the public resolver. */
export function canResolvePublicCmsContent(input: {
  siteId: unknown; requestedSiteId: unknown;
  locale: unknown; status: CmsPublicationStatus;
  isDemo: boolean; publishedRevisionId: string | null;
  revisionId: string;
}): boolean {
  return isCmsSiteId(input.siteId) && input.siteId === input.requestedSiteId &&
    isCmsLocale(input.locale) && input.status === "PUBLISHED" &&
    !input.isDemo && Boolean(input.publishedRevisionId) &&
    input.revisionId === input.publishedRevisionId;
}
