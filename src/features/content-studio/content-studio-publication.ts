import { canPublishStudioRevision } from "./content-studio-policy";

export type StudioRevision = { id: string; pageId: string; status: string; approvedById: string | null };
export function assertPublishableRevision(revision: StudioRevision, expectedPageId: string) {
  if (revision.pageId !== expectedPageId) throw new Error("Revision belongs to another page");
  if (!canPublishStudioRevision(revision.status, revision.approvedById)) throw new Error("Only approved revisions may be published");
  return revision.id;
}
export function validatePublishTarget(siteId: string, pageSiteId: string): void {
  if (siteId !== pageSiteId) throw new Error("Cross-site publish rejected");
}
