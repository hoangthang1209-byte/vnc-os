import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gmailPubsubDeliveryKey } from './pubsub-idempotency-key.mjs';

test('identical delivery yields identical key', () => {
  const data = { subscription: 'projects/vnc-os-integrations/subscriptions/vnc-gmail-inbound-sub', messageId: '1234' };
  assert.equal(gmailPubsubDeliveryKey(data), gmailPubsubDeliveryKey(data));
  assert.match(gmailPubsubDeliveryKey(data), /^[a-f0-9]{64}$/);
});
test('same message id in another subscription is isolated', () => {
  const a = gmailPubsubDeliveryKey({ subscription: 'projects/p/subscriptions/a', messageId: '1234' });
  const b = gmailPubsubDeliveryKey({ subscription: 'projects/p/subscriptions/b', messageId: '1234' });
  assert.notEqual(a, b);
});
test('invalid subscription or message id is rejected', () => {
  assert.throws(() => gmailPubsubDeliveryKey({ subscription: 'invalid', messageId: '12' }));
  assert.throws(() => gmailPubsubDeliveryKey({ subscription: 'projects/p/subscriptions/a', messageId: '' }));
});
