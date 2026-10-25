/** Trusted backend integration only. The source value is allowlisted and normalized. */
export const VNC_INBOUND_SITE_CHANNELS = {
  "attd.vn": "WEBSITE_ATTD",
  "vietnamclothing.vn": "WEBSITE_VIETNAMCLOTHING",
  "aothunthongdiep.com": "WEBSITE_AOTHUNTHONGDIEP",
} as const;

export type VncInboundSite = keyof typeof VNC_INBOUND_SITE_CHANNELS;

export function resolveVncInboundSite(value: unknown): {
  site: VncInboundSite;
  channel: (typeof VNC_INBOUND_SITE_CHANNELS)[VncInboundSite];
} | null {
  if (typeof value !== "string") return null;
  const site = value.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(VNC_INBOUND_SITE_CHANNELS, site)) return null;
  const normalized = site as VncInboundSite;
  return { site: normalized, channel: VNC_INBOUND_SITE_CHANNELS[normalized] };
}

/** Copy bounded marketing metadata; never trust website-provided employee ownership. */
export function cleanInboundAttribution(input: Record<string, unknown>) {
  const get = (key: string, max: number) =>
    typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  const landingPage = get("landingPage", 1000);
  const referrer = get("referrer", 1000);
  // Reject unsafe URL schemes and untrusted origins in attribution.
  const safeUrl = (value: string) => {
    if (!value) return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") return "";
      // Avoid retaining credentials, tracking fragments or hidden PII in source URLs.
      if (url.username || url.password) return "";
      url.hash = "";
      return url.toString();
    } catch {
      return "";
    }
  };
  return {
    landingPage: safeUrl(landingPage),
    referrer: safeUrl(referrer),
    utmSource: get("utmSource", 150),
    utmMedium: get("utmMedium", 150),
    utmCampaign: get("utmCampaign", 200),
  };
}
