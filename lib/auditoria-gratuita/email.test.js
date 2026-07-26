'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendReportEmail } = require('./email');

test('sends a POST to Resend with the report link in the body', async (t) => {
  let capturedUrl;
  let capturedInit;
  t.mock.method(global, 'fetch', async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return { ok: true, json: async () => ({ id: 'email_123' }) };
  });

  const result = await sendReportEmail({
    apiKey: 'test-key',
    to: 'lead@example.com',
    name: 'Ana',
    reportUrl: 'https://growmas.io/auditoria-gratuita/reporte?d=abc',
  });

  assert.equal(capturedUrl, 'https://api.resend.com/emails');
  assert.equal(capturedInit.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(capturedInit.body);
  assert.deepEqual(body.to, ['lead@example.com']);
  assert.match(body.html, /https:\/\/growmas\.io\/auditoria-gratuita\/reporte\?d=abc/);
  assert.deepEqual(result, { id: 'email_123' });
});

test('throws when Resend responds with a non-2xx status', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 422, text: async () => 'invalid domain' }));

  await assert.rejects(
    () => sendReportEmail({ apiKey: 'test-key', to: 'lead@example.com', name: 'Ana', reportUrl: 'https://x' }),
    /Resend error 422/,
  );
});
