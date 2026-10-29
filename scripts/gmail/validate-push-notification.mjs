#!/usr/bin/env node
/**
 * Validate a Gmail Pub/Sub notification envelope without logging email/PII.
 * Takes a single JSON envelope on stdin. No OAuth, network, ACK or watch side effects.
 * Supports base64 pubsub.message.data payload { emailAddress, historyId }.
 * Usage: cat sample.json | node scripts/gmail/validate-push-notification.mjs
 */
const raw = await new Promise((resolve, reject) => {
  let text = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (part) => {
    text += part;
    if (text.length > 64 * 1024) reject(new Error("Payload too large"));
  });
  process.stdin.on("end", () => resolve(text));
  process.stdin.on("error", reject);
});
try {
  const envelope = JSON.parse(raw);
  const data = envelope?.message?.data;
  if (typeof data !== "string" || !/^[a-zA-Z0-9+/]+={0,2}$/.test(data)) throw new Error("Missing/invalid PubSub base64 data");
  const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  if (typeof payload.emailAddress !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.emailAddress)) throw new Error("Invalid mailbox");
  if (typeof payload.historyId !== "string" || !/^\d+$/.test(payload.historyId)) throw new Error("Invalid history ID");
  console.log(JSON.stringify({ valid: true, hasMessageId: typeof envelope.message.messageId === "string", hasHistoryId: true }));
} catch (error) {
  console.error(JSON.stringify({ valid: false, error: error.message }));
  process.exitCode = 1;
}
