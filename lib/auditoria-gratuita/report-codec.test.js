'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeReportData, decodeReportData } = require('./report-codec');

test('round-trips a report payload', () => {
  const payload = {
    name: 'Ana',
    metrics: { stages: { ventas: { dineroQueSeVa: 100, recuperable: 30 } }, totalMensualRecuperable: 30, totalAnualRecuperable: 360 },
    report: { intro: 'hola', secciones: { ventas: 'texto' }, cierre_final: 'cierre' },
  };
  const encoded = encodeReportData(payload);
  assert.equal(typeof encoded, 'string');
  const decoded = decodeReportData(encoded);
  assert.deepEqual(decoded, payload);
});

test('throws on garbage input instead of returning something silently wrong', () => {
  assert.throws(() => decodeReportData('not-valid-base64url-gzip-data'));
});
