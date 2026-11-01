import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Server-side corroboration of editor attestations using VNC OS Media Library.
 * A checkbox or HTTPS URL alone is never sufficient to approve product media.
 */
export async function verifiedCatalogMedia(media: unknown): Promise<boolean> {
  if (!Array.isArray(media) || media.length < 1 || media.length > 20) return false;
  const ids = media.map(m => m && typeof m === "object" ? (m as {mediaAssetId?:unknown}).mediaAssetId : null);
  if (ids.some(id => typeof id !== "string" || !id)) return false;
  const uniqueIds = [...new Set(ids as string[])];
  if (uniqueIds.length !== media.length) return false;
  const assets = await prisma.mediaAsset.findMany({
    where: {
      id: { in: uniqueIds },
      visibility: "PUBLIC",
      lifecycleStatus: "ACTIVE",
      rightsStatus: { in: ["OWNED", "LICENSED", "CUSTOMER_PROVIDED", "PARTNER_PROVIDED"] },
      rightsOwner: { not: null },
      rightsNotes: { not: null },
      usageRestriction: null,
    },
    select: { id:true,url:true,rightsOwner:true,rightsNotes:true,rightsExpiresAt:true },
  });
  const byId = new Map(assets.map(a => [a.id,a]));
  return media.every(raw => {
    const m = raw as {mediaAssetId:string;url:string};
    const a = byId.get(m.mediaAssetId);
    return !!a && a.url === m.url && !!a.rightsOwner?.trim() &&
      !!a.rightsNotes?.trim() && (!a.rightsExpiresAt || a.rightsExpiresAt > new Date());
  });
}
