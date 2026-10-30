import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { isContentSiteId } from "@/features/content-studio/content-studio-policy";

/**
 * Independent approval gate. CMS editors cannot approve merely because they
 * can edit. Approval cannot be applied to legacy drafts with no author ID.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ pageId: string }> }) {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (!can(session, "cms.approve")) return NextResponse.json({ message: "Independent CMS approval permission required" }, { status: 403 });
  const actorId = session.userId || session.employeeId || (session.mode === "owner" ? "owner" : null);
  if (!actorId) return NextResponse.json({ message: "Identifiable approver required" }, { status: 403 });
  const { pageId } = await context.params;
  let body: { siteId?: unknown; revisionId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  if (!isContentSiteId(body.siteId) || typeof body.revisionId !== "string" || !body.revisionId || pageId.length > 128) {
    return NextResponse.json({ message: "Invalid site, page or revision" }, { status: 400 });
  }
  try {
    const result = await prisma.$transaction(async tx => {
      const page = await tx.studioPage.findFirst({ where: { id: pageId, siteId: body.siteId as string }, select: { id: true } });
      if (!page) return { status: 404, message: "Page not found" };
      const latest = await tx.studioPageRevision.findFirst({ where: { pageId }, orderBy: { version: "desc" }, select: { id: true } });
      if (latest?.id !== body.revisionId) return { status: 409, message: "Only latest revision can be approved" };
      const revision = await tx.studioPageRevision.findFirst({
        where: { id: body.revisionId, pageId },
        select: { id: true, status: true, authorId: true },
      });
      if (!revision?.authorId) return { status: 409, message: "Revision author missing; resave a new draft with attribution" };
      if (revision.authorId === actorId) return { status: 403, message: "Authors cannot approve their own revisions" };
      if (revision.status !== "IN_REVIEW") return { status: 409, message: "Revision must be submitted for review first" };
      const changed = await tx.studioPageRevision.updateMany({
        where: { id: revision.id, pageId, status: "IN_REVIEW", approvedById: null },
        data: { status: "APPROVED", approvedById: actorId, approvedAt: new Date() },
      });
      return changed.count === 1 ? { status: 200, revisionId: revision.id, state: "APPROVED", approvedById: actorId } :
        { status: 409, message: "Revision approval conflict" };
    });
    return NextResponse.json(result, { status: result.status });
  } catch { return NextResponse.json({ message: "Approval unavailable" }, { status: 503 }); }
}
