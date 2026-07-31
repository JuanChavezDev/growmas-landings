'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendReportWhatsapp } = require('./whatsapp');

test('sends the template with name and report link as params', async (t) => {
  let capturedInit;
  t.mock.method(global, 'fetch', async (url, init) => {
    capturedInit = init;
    return { ok: true, json: async () => ({ id: 'wamid_123' }) };
  });

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://growmas.io/auditoria-gratuita/reporte?d=abc',
  });

  const body = JSON.parse(capturedInit.body);
  assert.equal(body.to, '+51999999999');
  assert.equal(body.templateName, 'auditoria_lista');
  assert.deepEqual(body.params, ['Ana', 'https://growmas.io/auditoria-gratuita/reporte?d=abc']);
  assert.deepEqual(result, { ok: true });
});

test('returns { ok: false, error } instead of throwing when YCloud errors', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 400, text: async () => 'template not approved' }));

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://x',
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /400/);
});

test('returns { ok: false, error } instead of throwing on a network error', async (t) => {
  t.mock.method(global, 'fetch', async () => {
    throw new Error('DNS lookup failed');
  });

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://x',
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /DNS lookup failed/);
});
