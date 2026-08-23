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
      report: { intro: 'Encontramos esto.', secciones: { ventas: 'Texto de ventas.' }, cierre_final: 'Agenda tu llamada.' },
      whatsappUrl: 'https://wa.me/51999999999?text=hola',
    },
    overrides,
  );
}

test('renders the name, total, a stage section, and the CTA link', () => {
  const html = renderReportHtml(baseArgs({}));
  assert.match(html, /Ana/);
  assert.match(html, /S\/\s?1,800/);
  assert.match(html, /Texto de ventas\./);
  assert.match(html, /href="https:\/\/wa\.me\/51999999999\?text=hola"/);
});

test('escapes HTML in the name so a malicious answer cannot inject markup', () => {
  const html = renderReportHtml(baseArgs({ name: '<script>alert(1)</script>' }));
  assert.doesNotMatch(html, /<script>alert/);
});

test('renders without throwing when there is no ventas/cierre stage (leads unknown)', () => {
  const html = renderReportHtml(baseArgs({
    metrics: { stages: { fidelizacion: { dineroQueSeVa: 500, recuperable: 150 } }, totalMensualRecuperable: 150, totalAnualRecuperable: 1800 },
    report: { intro: 'Intro', secciones: { fidelizacion: 'Texto.' }, cierre_final: 'Cierre.' },
  }));
  assert.match(html, /Fidelización/);
});

test('skips rendering an empty stage-text paragraph when the narrative has no text for that stage', () => {
  const html = renderReportHtml(baseArgs({
    metrics: { stages: { cierre: { dineroQueSeVa: 400, recuperable: 120 } }, totalMensualRecuperable: 120, totalAnualRecuperable: 1440 },
    report: { intro: 'Intro', secciones: {}, cierre_final: 'Cierre.' },
  }));
  assert.match(html, /Cierre<\/span>/);
  assert.doesNotMatch(html, /<p class="stage-text"><\/p>/);
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

test('renders a proportional bar fill width for each stage', () => {
  const html = renderReportHtml(baseArgs({
    metrics: {
      stages: { ventas: { dineroQueSeVa: 6000, recuperable: 1800 }, cierre: { dineroQueSeVa: 1000, recuperable: 300 } },
      totalMensualRecuperable: 2100,
      totalAnualRecuperable: 25200,
    },
    report: { intro: 'Intro', secciones: { ventas: 'x', cierre: 'y' }, cierre_final: 'z' },
  }));
  assert.match(html, /width:100%/);
  assert.match(html, /width:17%/);
});
