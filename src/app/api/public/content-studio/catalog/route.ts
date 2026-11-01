import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatedStudioProduct } from "@/features/content-studio/product-feed";
import { verifiedCatalogMedia } from "@/features/content-studio/media-rights-gate";

/**
 * Website-scoped, read-only product catalog feed.
 * Does not expose drafts, private notes, unapproved images, or other sites.
 */
export async function GET(request: NextRequest) {
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
    const productGroups = await Promise.all(pages.map(async page => {
      const revision = page.revisions.find(r => r.id === page.publishedRevisionId);
      if (!revision) return [];
      const d = validatedStudioProduct(page.slug, revision.content);
      if (!d || !(await verifiedCatalogMedia(d.media))) return [];
      return [{
        site: "vietnamclothing.vn", status: "PUBLISHED" as const,
        publicApproved: true, mediaRightsApproved: true,
        slug: d.slug, category: d.category, categoryId: d.categoryId,
        title: d.title, summary: d.summary, description: d.description,
        vi: d.vi, media: d.media,
      }];
    }));
    const products = productGroups.flat();
    const origin = request.headers.get("origin") || "";
    const previewAllowed = /^https:\/\/vnc-merchandise-preview(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
    const productionAllowed = origin === "https://vietnamclothing.vn" || origin === "https://www.vietnamclothing.vn";
    const headers = new Headers({ "Cache-Control": "public, max-age=0, s-maxage=60", "Vary": "Origin" });
    if (previewAllowed || productionAllowed) headers.set("Access-Control-Allow-Origin", origin);
    return NextResponse.json({
      site: "vietnamclothing.vn", schemaVersion: 1,
      source: "VNC OS Content Studio approved revisions", products,
    }, { headers });
  } catch {
    return NextResponse.json({ message: "Public catalog feed unavailable" }, { status: 503 });
  }
}
