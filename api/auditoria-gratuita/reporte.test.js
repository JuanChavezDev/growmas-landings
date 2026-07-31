'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createReporteHandler } = require('./reporte');
const { encodeReportData } = require('../../lib/auditoria-gratuita/report-codec');

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

test('renders the report HTML when the query param decodes successfully', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const encoded = encodeReportData({
    name: 'Ana',
    metrics: { stages: { ventas: { dineroQueSeVa: 100, recuperable: 30 } }, totalMensualRecuperable: 30, totalAnualRecuperable: 360 },
    report: { intro: 'Intro', secciones: { ventas: 'Texto.' }, cierre_final: 'Cierre.' },
  });

  const req = { method: 'GET', query: { d: encoded } };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
  assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
  assert.match(res.body, /Ana/);
  assert.match(res.body, /wa\.me\/51999999999/);
});

test('renders a friendly 404-style page when d is missing', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const req = { method: 'GET', query: {} };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.match(res.body, /no encontramos/i);
});

test('renders a friendly 404-style page when d does not decode', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const req = { method: 'GET', query: { d: 'not-valid-data' } };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.match(res.body, /no encontramos/i);
});
