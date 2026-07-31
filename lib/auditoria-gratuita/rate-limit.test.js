'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkRateLimit, _resetForTests, MAX_REQUESTS_PER_WINDOW, WINDOW_MS } = require('./rate-limit');

test('allows requests up to the limit, then blocks', () => {
  _resetForTests();
  const now = Date.now();
  for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
    const result = checkRateLimit('1.2.3.4', now);
    assert.equal(result.allowed, true);
  }
  const blocked = checkRateLimit('1.2.3.4', now);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test('tracks different keys independently', () => {
  _resetForTests();
  const now = Date.now();
  for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
    checkRateLimit('1.2.3.4', now);
  }
  const otherKey = checkRateLimit('5.6.7.8', now);
  assert.equal(otherKey.allowed, true);
});

test('allows requests again once the window has passed', () => {
  _resetForTests();
  const now = Date.now();
  for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
    checkRateLimit('1.2.3.4', now);
  }
  const laterResult = checkRateLimit('1.2.3.4', now + WINDOW_MS + 1);
  assert.equal(laterResult.allowed, true);
});
