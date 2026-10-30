import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { isContentSiteId, canPublishStudioRevision } from "@/features/content-studio/content-studio-policy";

/**
 * Publish an already-approved immutable revision, never a draft.
 * This endpoint intentionally does NOT approve content and does NOT perform
 * a production database migration.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> },
) {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (!can(session, "cms.manage")) return NextResponse.json({ message: "CMS permission required" }, { status: 403 });
  const { pageId } = await context.params;
  if (!pageId || pageId.length > 128) return NextResponse.json({ message: "Invalid page" }, { status: 400 });

  let input: { siteId?: unknown; revisionId?: unknown };
  try { input = await request.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  if (!isContentSiteId(input.siteId) || typeof input.revisionId !== "string" || !input.revisionId) {
    return NextResponse.json({ message: "Valid site and revision required" }, { status: 400 });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const page = await tx.studioPage.findFirst({
        where: { id: pageId, siteId: input.siteId as string },
        select: { id: true, siteId: true, publishedRevisionId: true },
      });
      if (!page) return { status: 404, message: "Page not found for site" };
      const revision = await tx.studioPageRevision.findFirst({
        where: { id: input.revisionId as string, pageId },
        select: { id: true, status: true, approvedById: true, publishedAt: true, content: true },
      });
      if (!revision) return { status: 404, message: "Revision not found" };
      const latest = await tx.studioPageRevision.findFirst({ where: { pageId }, orderBy: { version: "desc" }, select: { id: true } });
      if (latest?.id !== revision.id) return { status: 409, message: "Only latest approved revision may be published" };
      if (!canPublishStudioRevision(revision.status, revision.approvedById)) {
        return { status: 409, message: "Revision must be independently approved before publishing" };
      }
      if (page.publishedRevisionId === revision.id) {
        return { status: 200, publishedRevisionId: revision.id, alreadyPublished: true };
      }
      await tx.studioPage.update({
        where: { id: page.id },
        data: { publishedRevisionId: revision.id, ...((revision.content as {title?:unknown}|null)?.title && typeof (revision.content as {title?:unknown}).title === "string" && (revision.content as {title:string}).title.length <= 180 ? { title: (revision.content as {title:string}).title.trim() } : {}) } ,
      });
      await tx.studioPageRevision.update({
        where: { id: revision.id },
        data: { publishedAt: revision.publishedAt ?? new Date() },
      });
      return { status: 200, publishedRevisionId: revision.id, alreadyPublished: false };
    });
    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json({ message: "Publishing unavailable; verify CMS migration and database" }, { status: 503 });
  }
}
