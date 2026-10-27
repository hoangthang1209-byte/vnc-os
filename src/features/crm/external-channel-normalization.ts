/**
 * Server-side provider event normalization contracts.
 * These functions are pure and perform NO network request or persistence.
 * Verify provider signature/OAuth authorization BEFORE calling normalize.
 * Never use untrusted sender display names as verified contact identities.
 */
export const EXTERNAL_LEAD_CHANNELS = [
  "GMAIL",
  "FACEBOOK_LEAD_ADS",
  "FACEBOOK_MESSENGER",
  "INSTAGRAM_DM",
  "ZALO_OA",
  "WHATSAPP_BUSINESS",
  "TIKTOK_LEAD_ADS",
  "LINKEDIN_LEAD_GEN",
] as const;

export type ExternalLeadChannel = (typeof EXTERNAL_LEAD_CHANNELS)[number];

export type VerifiedExternalInbound = {
  channel: ExternalLeadChannel;
  /** Stable provider event/message/lead id for replay-safe ingestion. */
  externalId: string;
  /** Provider account, page or mailbox identifier, not user-provided. */
  accountId: string;
  /** Text from customer message, not yet necessarily a qualified lead. */
  message: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  occurredAt: string | null;
};

const stringValue = (v: unknown, limit: number) =>
  typeof v === "string" ? v.trim().slice(0, limit) : "";

export function normalizeVerifiedExternalEvent(
  channel: ExternalLeadChannel,
  input: {
    eventId?: unknown;
    accountId?: unknown;
    text?: unknown;
    contactName?: unknown;
    email?: unknown;
    phone?: unknown;
    occurredAt?: unknown;
  },
): VerifiedExternalInbound | null {
  const externalId = stringValue(input.eventId, 256);
  const accountId = stringValue(input.accountId, 256);
  if (!EXTERNAL_LEAD_CHANNELS.includes(channel) || !externalId || !accountId) return null;
  const email = stringValue(input.email, 254);
  const phone = stringValue(input.phone, 40);
  // Existing canonical intake requires a contact route; platform sender IDs
  // alone must NOT be converted into fake phone/email or silently dropped.
  return {
    channel,
    externalId,
    accountId,
    message: stringValue(input.text, 4000),
    contactName: stringValue(input.contactName, 200) || null,
    email: email || null,
    phone: phone || null,
    occurredAt: typeof input.occurredAt === "string" &&
      !Number.isNaN(Date.parse(input.occurredAt))
      ? new Date(input.occurredAt).toISOString() : null,
  };
}

/**
 * Identity-free social messages are conversation events, not valid Lead records
 * yet. Preserve them in a future secure conversation inbox until the user
 * supplies a verified contact channel or explicitly requests a quote.
 */
export function isReadyForCanonicalLeadIntake(event: VerifiedExternalInbound) {
  return Boolean(event.email || event.phone);
}

/** Namespace message IDs per provider and account to prevent cross-account collision. */
export function externalLeadSourceRef(event: VerifiedExternalInbound) {
  return [event.channel, event.accountId, event.externalId].map(encodeURIComponent).join(":");
}
