/** Strict parsing for the data layer of a verified Google Pub/Sub Gmail notification.
 * IMPORTANT: The enclosing Pub/Sub push JWT must be authenticated by the HTTP
 * handler BEFORE this function is called. A decoded payload is not proof of origin.
 * Gmail push signals mailbox changes; use history.list to obtain message IDs.
 */
export type GmailHistorySignal = {
  mailbox: string;
  historyId: string;
};

export function parseVerifiedGmailPushData(
  data: unknown,
  allowedMailboxes: ReadonlySet<string>,
): GmailHistorySignal | null {
  if (typeof data !== "string" || data.length > 8192 || !/^[A-Za-z0-9_=-]+$/.test(data)) {
    return null;
  }
  try {
    const decoded = Buffer.from(data, "base64").toString("utf8");
    if (decoded.length > 4096) return null;
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    if (typeof value.emailAddress !== "string" || typeof value.historyId !== "string") return null;
    const mailbox = value.emailAddress.trim().toLowerCase();
    if (!allowedMailboxes.has(mailbox) || !/^[0-9]{1,32}$/.test(value.historyId)) return null;
    return { mailbox, historyId: value.historyId };
  } catch {
    return null;
  }
}

export const VNC_GMAIL_PILOT_MAILBOX = "support@vietnamclothing.vn";
