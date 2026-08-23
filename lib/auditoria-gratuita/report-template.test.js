'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderReportHtml } = require('./report-template');

function baseArgs(overrides) {
  return Object.assign(
    {
      name: 'Ana',
      metrics: {
        stages: { ventas: { dineroQueSeVa: 6000, recuperable: 1800 } },
        totalMensualRecuperable: 1800,
        totalAnualRecuperable: 21600,
      },
      report: { sintesis: 'La mayor fuga está en ventas.' },
      whatsappUrl: 'https://wa.me/51999999999?text=hola',
    },
    overrides,
  );
}

test('renders the name, total, a stage card, and the synthesis text', () => {
  const html = renderReportHtml(baseArgs({}));
  assert.match(html, /Ana/);
  assert.match(html, /S\/\s?1,800/);
  assert.match(html, /Ventas<\/p>/);
  assert.match(html, /La mayor fuga está en ventas\./);
});

test('escapes HTML in the name so a malicious answer cannot inject markup', () => {
  const html = renderReportHtml(baseArgs({ name: '<script>alert(1)</script>' }));
  assert.doesNotMatch(html, /<script>alert/);
});

test('renders without throwing when there is no ventas/cierre stage (leads unknown)', () => {
  const html = renderReportHtml(baseArgs({
    metrics: { stages: { fidelizacion: { dineroQueSeVa: 500, recuperable: 150 } }, totalMensualRecuperable: 150, totalAnualRecuperable: 1800 },
    report: { sintesis: 'Sintesis.' },
  }));
  assert.match(html, /Fidelización<\/p>/);
});

test('renders one stage card per stage present in metrics', () => {
  const html = renderReportHtml(baseArgs({
    metrics: {
      stages: {
        ventas: { dineroQueSeVa: 6000, recuperable: 1800 },
        cierre: { dineroQueSeVa: 1000, recuperable: 300 },
        entrega: { dineroQueSeVa: 800, recuperable: 240 },
        fidelizacion: { dineroQueSeVa: 400, recuperable: 120 },
      },
      totalMensualRecuperable: 2460,
      totalAnualRecuperable: 29520,
    },
    report: { sintesis: 'Sintesis.' },
  }));
  assert.match(html, /Ventas<\/p>/);
  assert.match(html, /Cierre<\/p>/);
  assert.match(html, /Entrega<\/p>/);
  assert.match(html, /Fidelización<\/p>/);
});

test('renders a video invite CTA linking to the video page by default', () => {
  const html = renderReportHtml(baseArgs({}));
  assert.match(html, /href="\/mas-pacientes\/video"/);
  assert.match(html, /Ver el video/);
});

test('renders the video invite CTA linking to a custom videoUrl when provided', () => {
  const html = renderReportHtml(baseArgs({ videoUrl: '/otra-pagina' }));
  assert.match(html, /href="\/otra-pagina"/);
});

test('still renders the WhatsApp link as a low-key fallback under the video CTA', () => {
  const html = renderReportHtml(baseArgs({}));
  assert.match(html, /href="https:\/\/wa\.me\/51999999999\?text=hola"/);
});
