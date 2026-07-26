'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt, fallbackNarrative, generateNarrative } = require('./narrative');

const SAMPLE_METRICS = {
  stages: {
    ventas: { dineroQueSeVa: 6000, recuperable: 1800 },
    fidelizacion: { dineroQueSeVa: 2500, recuperable: 750 },
  },
  totalMensualRecuperable: 2550,
  totalAnualRecuperable: 30600,
  sinDatosDeLeads: false,
};

test('buildPrompt includes the exact precomputed numbers and forbids inventing new ones', () => {
  const messages = buildPrompt('Ana', SAMPLE_METRICS);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.match(messages[0].content, /6000/);
  assert.match(messages[0].content, /1800/);
  assert.match(messages[0].content, /2550/);
  assert.match(messages[0].content, /Ana/);
  assert.match(messages[0].content, /NO los recalcules/i);
});

test('fallbackNarrative produces a section for every stage present in metrics, using its numbers', () => {
  const result = fallbackNarrative(SAMPLE_METRICS);
  assert.equal(typeof result.intro, 'string');
  assert.match(result.secciones.ventas, /6000/);
  assert.match(result.secciones.ventas, /1800/);
  assert.match(result.secciones.fidelizacion, /2500/);
  assert.equal(typeof result.cierre_final, 'string');
});

test('generateNarrative falls back when the Claude client throws', async () => {
  const failingClient = {
    messages: {
      create: async () => {
        throw new Error('network down');
      },
    },
  };
  const result = await generateNarrative(failingClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, fallbackNarrative(SAMPLE_METRICS));
});

test('generateNarrative falls back when the response is not valid JSON', async () => {
  const badClient = {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'not json at all' }],
      }),
    },
  };
  const result = await generateNarrative(badClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, fallbackNarrative(SAMPLE_METRICS));
});

test('generateNarrative returns the parsed narrative on a well-formed response', async () => {
  const goodNarrative = { intro: 'Hola', secciones: { ventas: 'x', fidelizacion: 'y' }, cierre_final: 'z' };
  const goodClient = {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify(goodNarrative) }],
      }),
    },
  };
  const result = await generateNarrative(goodClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, goodNarrative);
});
