import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isContentSiteId } from "@/features/content-studio/content-studio-policy";

/** Public, read-only resolver. Never expose draft or pending revisions. */
export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get("siteId");
  const path = request.nextUrl.searchParams.get("path");
  if (!isContentSiteId(siteId) || !path || path.length > 160 ||
      !/^(?:\/|\/[a-z0-9]+(?:[-/][a-z0-9]+)*)$/.test(path)) {
    return NextResponse.json({ message: "Invalid site or path" }, { status: 400 });
  }
  try {
    const page = await prisma.studioPage.findFirst({
      where: { siteId, slug: path, publishedRevisionId: { not: null }, site: { isActive: true } },
      select: {
        slug: true, title: true, seoTitle: true, seoDescription: true, canonicalPath: true,
        publishedRevisionId: true,
        revisions: { select: { id: true, status: true, approvedById: true, content: true },
          where: { status: "APPROVED", approvedById: { not: null } } },
      },
    });
    if (!page) return NextResponse.json({ message: "Not found" }, { status: 404 });
    const revision = page.revisions.find(r => r.id === page.publishedRevisionId);
    if (!revision) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({
      siteId, slug: page.slug, title: page.title, seoTitle: page.seoTitle,
      seoDescription: page.seoDescription, canonicalPath: page.canonicalPath,
      revisionId: revision.id, content: revision.content,
    }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ message: "Content temporarily unavailable" }, { status: 503 });
  }
}
