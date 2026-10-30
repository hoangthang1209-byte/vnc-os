import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatedStudioProduct } from "@/features/content-studio/product-feed";

/**
 * Website-scoped, read-only product catalog feed.
 * Does not expose drafts, private notes, unapproved images, or other sites.
 */
export async function GET() {
  try {
    const pages = await prisma.studioPage.findMany({
      where: {
        siteId: "vietnamclothing.vn",
        slug: { startsWith: "/products/" },
        publishedRevisionId: { not: null },
        site: { isActive: true },
      },
      select: {
        slug: true, publishedRevisionId: true,
        revisions: {
          where: { status: "APPROVED", approvedById: { not: null } },
          select: { id: true, content: true },
        },
      },
      take: 250,
    });
    const products = pages.flatMap(page => {
      const revision = page.revisions.find(r => r.id === page.publishedRevisionId);
      if (!revision) return [];
      const d = validatedStudioProduct(page.slug, revision.content);
      if (!d) return [];
      return [{
        site: "vietnamclothing.vn", status: "PUBLISHED" as const,
        publicApproved: true, mediaRightsApproved: true,
        slug: d.slug, category: d.category,
        title: d.title, summary: d.summary, description: d.description,
        vi: d.vi, media: d.media,
      }];
    });
    return NextResponse.json({
      site: "vietnamclothing.vn", schemaVersion: 1,
      source: "VNC OS Content Studio approved revisions", products,
    }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } });
  } catch {
    return NextResponse.json({ message: "Public catalog feed unavailable" }, { status: 503 });
  }
}
