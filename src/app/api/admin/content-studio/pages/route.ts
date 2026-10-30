import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { CONTENT_SITES, isContentSiteId, validateStudioSlug, validateStudioBlocks } from "@/features/content-studio/content-studio-policy";

async function guard() {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return { response: NextResponse.json({ message: "Authentication required" }, { status: 401 }) };
  if (!can(session, "cms.manage")) return { response: NextResponse.json({ message: "CMS permission required" }, { status: 403 }) };
  return { response: null };
}

/** Admin-only, site-scoped page list. Legacy ATTD CMS is never overwritten. */
export async function GET(request: NextRequest) {
  const access = await guard();
  if (access.response) return access.response;
  const siteId = request.nextUrl.searchParams.get("siteId");
  if (!isContentSiteId(siteId)) return NextResponse.json({ message: "Unknown website" }, { status: 400 });
  try {
    const pages = await prisma.studioPage.findMany({
      where: { siteId },
      select: { id: true, slug: true, title: true, publishedRevisionId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ site: CONTENT_SITES[siteId], pages });
  } catch {
    return NextResponse.json({ message: "Content Studio schema unavailable; migration required" }, { status: 503 });
  }
}

/** Creates a site-scoped page and immutable draft revision; does not publish. */
export async function POST(request: NextRequest) {
  const access = await guard();
  if (access.response) return access.response;
  const session = await getAdminSessionFromCookies();
  const actorId = session.userId || session.employeeId || (session.mode === "owner" ? "owner" : null);
  if (!actorId) return NextResponse.json({ message: "Identifiable CMS author required" }, { status: 403 });
  let input: { siteId: unknown; slug: unknown; title: unknown; blocks: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  if (!isContentSiteId(input.siteId)) return NextResponse.json({ message: "Unknown website" }, { status: 400 });
  let slug: string;
  let blocks: ReturnType<typeof validateStudioBlocks>;
  try {
    slug = validateStudioSlug(input.slug);
    blocks = validateStudioBlocks(input.blocks);
    if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 180) throw new Error("Invalid title");
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid input" }, { status: 400 });
  }
  try {
    const site = CONTENT_SITES[input.siteId];
    const page = await prisma.$transaction(async (tx) => {
      await tx.studioSite.upsert({ where: { id: input.siteId as string }, update: {}, create: { id: input.siteId as string, ...site } });
      return tx.studioPage.create({
        data: {
          siteId: input.siteId as string, slug, title: (input.title as string).trim(),
          revisions: { create: { version: 1, status: "DRAFT", authorId: actorId, content: JSON.parse(JSON.stringify({ blocks })) as Prisma.InputJsonValue } },
        },
        select: { id: true, siteId: true, slug: true, title: true },
      });
    });
    return NextResponse.json({ page, status: "DRAFT" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to create draft (duplicate page or migration pending)" }, { status: 409 });
  }
}
