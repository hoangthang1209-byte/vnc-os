import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

/** Approved image choices from the existing VNC OS Media Library. */
export async function GET() {
  const session = await getAdminSessionFromCookies();
  if (!session.authenticated) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (!can(session, "cms.manage")) return NextResponse.json({ message: "CMS permission required" }, { status: 403 });
  try {
    const records = await prisma.mediaAsset.findMany({
      where: {
        visibility: "PUBLIC", lifecycleStatus: "ACTIVE",
        rightsStatus: { in: ["OWNED","LICENSED","CUSTOMER_PROVIDED","PARTNER_PROVIDED"] },
        rightsOwner: { not: null }, rightsNotes: { not: null }, usageRestriction: null,
        mimeType: { startsWith: "image/" },
      },
      select: { id:true,title:true,filename:true,url:true,altText:true,rightsOwner:true,rightsNotes:true,rightsExpiresAt:true },
      orderBy: { updatedAt: "desc" }, take: 200,
    });
    const assets = records.filter(a => a.rightsOwner?.trim() && a.rightsNotes?.trim() &&
      (!a.rightsExpiresAt || a.rightsExpiresAt > new Date()) && a.url.startsWith("https://"));
    return NextResponse.json({ assets: assets.map(a => ({ id:a.id,title:a.title||a.filename,url:a.url,alt:a.altText||a.title||a.filename })) },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Media Library unavailable" }, { status: 503 });
  }
}
