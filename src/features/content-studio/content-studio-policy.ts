export const CONTENT_SITES = {
  "vietnamclothing.vn": { domain: "vietnamclothing.vn", locale: "en", name: "Vietnam Clothing" },
  "attd.vn": { domain: "attd.vn", locale: "vi", name: "ATTD" },
} as const;

export type ContentSiteId = keyof typeof CONTENT_SITES;
export function isContentSiteId(value: unknown): value is ContentSiteId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CONTENT_SITES, value);
}
export function validateStudioSlug(value: unknown): string {
  if (typeof value !== "string" || value.length > 160 || !/^(?:\/|\/[a-z0-9]+(?:[-/][a-z0-9]+)*)$/.test(value)) {
    throw new Error("Invalid site page path");
  }
  return value;
}
export function validateStudioBlocks(value: unknown): Array<{ type: string; data: Record<string, unknown> }> {
  if (!Array.isArray(value) || value.length > 60) throw new Error("Expected up to 60 content blocks");
  return value.map((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) throw new Error("Invalid content block");
    const type = (block as Record<string, unknown>).type;
    const data = (block as Record<string, unknown>).data;
    if (!["hero", "richText", "image", "gallery", "faq", "cta", "process"].includes(String(type))) throw new Error("Unsupported block type");
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid block data");
    if (JSON.stringify(data).length > 20_000) throw new Error("Block exceeds limit");
    return { type: String(type), data: data as Record<string, unknown> };
  });
}
export function canPublishStudioRevision(status: string, approvalBy: string | null): boolean {
  return status === "APPROVED" && Boolean(approvalBy);
}
