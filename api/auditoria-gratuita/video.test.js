'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createVideoHandler } = require('./video');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('renders the video page with a WhatsApp link built from the business number', () => {
  const handler = createVideoHandler({ businessWhatsappNumber: '51999999999' });
  const req = { method: 'GET' };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
  assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.match(res.body, /wa\.me\/51999999999/);
  assert.match(res.body, /vsl\.mp4/);
});
