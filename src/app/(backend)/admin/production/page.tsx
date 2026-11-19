import { redirect } from "next/navigation";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Điều hành sản xuất V9");

/**
 * The former read-only production dashboard is superseded by Operations V9.
 * Preserve bookmarked URLs and the legacy ?search= deep link without
 * dropping users into a separate/duplicate production homepage.
 *
 * Writable production plan, board and item-stage timeline routes stay intact.
 */
export default async function LegacyProductionDashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : params.search?.[0];
  const query = new URLSearchParams({ view: "production" });
  if (search?.trim()) query.set("search", search.trim());
  redirect(`/admin/operations-v9?${query.toString()}`);
}
