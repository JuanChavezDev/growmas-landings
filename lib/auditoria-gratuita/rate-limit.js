'use strict';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map();

function checkRateLimit(key, now = Date.now()) {
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - timestamps[0]) };
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
}

function _resetForTests() {
  hits.clear();
}

module.exports = { checkRateLimit, _resetForTests, WINDOW_MS, MAX_REQUESTS_PER_WINDOW };
