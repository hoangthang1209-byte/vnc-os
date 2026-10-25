import { createHash } from 'node:crypto';

/** Pure identity key for an authenticated subscription delivery; no persistence or ACK. */
export function gmailPubsubDeliveryKey(input) {
  const subscription = input?.subscription;
  const messageId = input?.messageId;
  if (typeof subscription !== 'string' || !/^projects\/[A-Za-z0-9_-]+\/subscriptions\/[A-Za-z0-9_-]+$/.test(subscription)) throw new TypeError('Invalid subscription');
  if (typeof messageId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(messageId)) throw new TypeError('Invalid Pub/Sub message id');
  return createHash('sha256').update(subscription + '\0' + messageId).digest('hex');
}
