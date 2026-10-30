/** Site-isolated public product export. Public approval is a reviewer attestation,
 * not proof that underlying media rights have been independently verified.
 */
const CATEGORY = new Set(["entertainment","promotional","corporate","sourcing","apparel"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Obj = Record<string, unknown>;
function obj(x: unknown): x is Obj { return !!x && typeof x === "object" && !Array.isArray(x); }
function nonempty(x: unknown): x is string { return typeof x === "string" && x.trim().length > 0; }
function approvedMedia(input: unknown): Array<{url:string;alt:string;approved:true;visibility:"PUBLIC";usageRightsApproved:true}> {
  if (!Array.isArray(input)) return [];
  return input.filter((m): m is {url:string;alt:string;approved:true;visibility:"PUBLIC";usageRightsApproved:true} => {
    if (!obj(m) || !nonempty(m.url) || !nonempty(m.alt) || m.approved !== true || m.visibility !== "PUBLIC" || m.usageRightsApproved !== true) return false;
    try { const u = new URL(m.url); return u.protocol === "https:" && Boolean(u.hostname) && !u.username && !u.password; }
    catch { return false; }
  });
}
export function validatedStudioProduct(pagePath: string, content: unknown): Obj | null {
  if (!pagePath.startsWith("/products/") || !obj(content) || !Array.isArray(content.blocks)) return null;
  const slug = pagePath.slice("/products/".length);
  if (!SLUG.test(slug)) return null;
  const blocks = content.blocks;
  if (blocks.length !== 1 || !obj(blocks[0]) || blocks[0].type !== "product" || !obj(blocks[0].data)) return null;
  const d = blocks[0].data as Obj;
  if (d.slug !== slug || !CATEGORY.has(String(d.category)) || !nonempty(d.title) || !nonempty(d.summary) || !nonempty(d.description)) return null;
  if (!obj(d.vi) || !nonempty(d.vi.title) || !nonempty(d.vi.summary) || !nonempty(d.vi.description)) return null;
  if (d.publicApproved !== true || d.mediaRightsApproved !== true) return null;
  const approved = approvedMedia(d.media);
  if (!Array.isArray(d.media) || approved.length !== d.media.length || approved.length === 0) return null;
  return { ...d, slug, media: approved };
}
