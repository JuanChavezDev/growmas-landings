'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSubmitHandler } = require('./submit');

function fullAnswers(overrides) {
  return Object.assign(
    {
      clientes_mes: 100,
      ticket_promedio: 50,
      canal_adquisicion: 'redes_organico',
      leads_mes: 200,
      tiempo_respuesta: 'mismo_dia',
      tasa_cierre: 4,
      hace_seguimiento: 'tengo_proceso',
      tasa_seguimiento: 6,
      tipo_entrega: 'producto',
      tasa_upsell: 5,
      precio_adicional: 20,
      tiene_sistema_upsell: 'automatico',
      tasa_recompra: 5,
      tiene_reactivacion: 'manual_a_veces',
    },
    overrides,
  );
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('returns a reportUrl and calls email + whatsapp on a valid submission', async () => {
  const emailCalls = [];
  const whatsappCalls = [];
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('offline in test'); } } },
    sendReportEmail: async (args) => { emailCalls.push(args); return { id: 'email_1' }; },
    sendReportWhatsapp: async (args) => { whatsappCalls.push(args); return { ok: true }; },
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = {
    method: 'POST',
    body: { name: 'Ana', whatsapp: '+51999999999', email: 'ana@example.com', answers: fullAnswers({}) },
  };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.reportUrl, /^https:\/\/growmas\.io\/auditoria-gratuita\/reporte\?d=/);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0].to, 'ana@example.com');
  assert.equal(whatsappCalls.length, 1);
  assert.equal(whatsappCalls[0].to, '+51999999999');
});

test('returns 400 with errors and calls neither email nor whatsapp on invalid input', async () => {
  const emailCalls = [];
  const whatsappCalls = [];
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('unused'); } } },
    sendReportEmail: async (args) => { emailCalls.push(args); },
    sendReportWhatsapp: async (args) => { whatsappCalls.push(args); },
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = { method: 'POST', body: { name: '', whatsapp: '', email: 'bad', answers: {} } };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(emailCalls.length, 0);
  assert.equal(whatsappCalls.length, 0);
});

test('still returns a reportUrl when the email dependency throws (email is non-blocking)', async () => {
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('offline in test'); } } },
    sendReportEmail: async () => { throw new Error('resend is down'); },
    sendReportWhatsapp: async () => ({ ok: true }),
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = {
    method: 'POST',
    body: { name: 'Ana', whatsapp: '+51999999999', email: 'ana@example.com', answers: fullAnswers({}) },
  };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.reportUrl, /reporte\?d=/);
});

test('rejects non-POST methods with 405', async () => {
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('unused'); } } },
    sendReportEmail: async () => {},
    sendReportWhatsapp: async () => ({ ok: true }),
    resendApiKey: 'k',
    ycloudApiKey: 'k',
    ycloudTemplateName: 't',
    siteUrl: 'https://growmas.io',
  });

  const req = { method: 'GET', body: {} };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});
