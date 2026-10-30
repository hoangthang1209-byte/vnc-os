import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { isContentSiteId, validateStudioBlocks } from "@/features/content-studio/content-studio-policy";

type RouteContext = { params: Promise<{ pageId: string }> };
async function authorize() {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (!can(session, "cms.manage")) return NextResponse.json({ message: "CMS permission required" }, { status: 403 });
  return null;
}
/** Read site-scoped draft revisions; no unpublished content is exposed publicly. */
export async function GET(request: NextRequest, context: RouteContext) {
  const denied = await authorize(); if (denied) return denied;
  const siteId = request.nextUrl.searchParams.get("siteId");
  if (!isContentSiteId(siteId)) return NextResponse.json({ message: "Unknown site" }, { status: 400 });
  const { pageId } = await context.params;
  try {
    const page = await prisma.studioPage.findFirst({ where: { id: pageId, siteId }, include: { revisions: { orderBy: { version: "desc" }, take: 20 } } });
    if (!page) return NextResponse.json({ message: "Page not found for site" }, { status: 404 });
    return NextResponse.json({ page });
  } catch { return NextResponse.json({ message: "Content Studio migration unavailable" }, { status: 503 }); }
}
/** Append a revision rather than mutate published or prior drafts. */
export async function PUT(request: NextRequest, context: RouteContext) {
  const denied = await authorize(); if (denied) return denied;
  const session = await getAdminSessionFromCookies();
  const actorId = session.userId || session.employeeId || (session.mode === "owner" ? "owner" : null);
  if (!actorId) return NextResponse.json({ message: "Identifiable CMS author required" }, { status: 403 });
  const { pageId } = await context.params;
  let data: {siteId?:unknown; blocks?:unknown; title?:unknown; expectedVersion?:unknown};
  try { data = await request.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  if (!isContentSiteId(data.siteId)) return NextResponse.json({ message: "Unknown site" }, { status: 400 });
  let blocks: ReturnType<typeof validateStudioBlocks>;
  try { blocks = validateStudioBlocks(data.blocks); if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 180) throw Error("Invalid title"); if (!Number.isSafeInteger(data.expectedVersion) || Number(data.expectedVersion) < 1) throw Error("Expected version required"); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid draft" }, { status: 400 }); }
  try {
    const result = await prisma.$transaction(async tx => {
      const page = await tx.studioPage.findFirst({ where: { id: pageId, siteId: data.siteId as string }, select: { id: true } });
      if (!page) return { error: "NOT_FOUND" };
      const latest = await tx.studioPageRevision.findFirst({ where: { pageId }, orderBy: { version: "desc" }, select: { version: true } });
      if (!latest || latest.version !== data.expectedVersion) return { error: "CONFLICT" };
      const revision = await tx.studioPageRevision.create({ data: { pageId, version: latest.version + 1, status: "DRAFT", authorId: actorId, content: { title: (data.title as string).trim(), blocks } as Prisma.InputJsonValue } });
      // Draft metadata is not exposed until the revision is approved and published.
      return { revision: { id: revision.id, version: revision.version, status: revision.status } };
    });
    if ("error" in result) return NextResponse.json({ message: result.error === "NOT_FOUND" ? "Page not found" : "Version conflict: refresh before saving" }, { status: result.error === "NOT_FOUND" ? 404 : 409 });
    return NextResponse.json(result, { status: 201 });
  } catch { return NextResponse.json({ message: "Unable to save draft revision; check migration or concurrency" }, { status: 503 }); }
}
