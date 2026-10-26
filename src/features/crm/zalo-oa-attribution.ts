/**
 * Attribution contract for verified Zalo OA webhooks.
 * Does not authenticate Zalo events: verify provider authenticity before calling.
 * Unknown OA IDs are quarantined, never assigned to a guessed brand.
 */
export const ZALO_OA_SOURCE_SITES = {
  "1814500354229784667": "vietnamclothing.vn",
} as const;

export function resolveVerifiedZaloOaSource(oaId: unknown): string | null {
  if (typeof oaId !== "string" || !/^[0-9]{8,24}$/.test(oaId)) return null;
  return Object.prototype.hasOwnProperty.call(ZALO_OA_SOURCE_SITES, oaId)
    ? ZALO_OA_SOURCE_SITES[oaId as keyof typeof ZALO_OA_SOURCE_SITES]
    : null;
}
