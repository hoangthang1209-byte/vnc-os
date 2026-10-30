import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { isContentSiteId } from "@/features/content-studio/content-studio-policy";

/** Explicit submission moves only the latest DRAFT revision to IN_REVIEW. */
export async function POST(request: NextRequest, context: { params: Promise<{ pageId: string }> }) {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (!can(session, "cms.manage")) return NextResponse.json({ message: "CMS permission required" }, { status: 403 });
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
      if (latest?.id !== body.revisionId) return { status: 409, message: "Only latest revision can be submitted" };
      const changed = await tx.studioPageRevision.updateMany({
        where: { id: body.revisionId, pageId, status: "DRAFT" },
        data: { status: "IN_REVIEW" },
      });
      return changed.count === 1 ? { status: 200, revisionId: body.revisionId, state: "IN_REVIEW" } :
        { status: 409, message: "Revision is not in DRAFT state" };
    });
    return NextResponse.json(result, { status: result.status });
  } catch { return NextResponse.json({ message: "Review submission unavailable" }, { status: 503 }); }
}
