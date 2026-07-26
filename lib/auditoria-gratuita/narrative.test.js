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

test('generateNarrative sends the exact model and disables thinking', async () => {
  const goodNarrative = { intro: 'Hola', secciones: { ventas: 'x', fidelizacion: 'y' }, cierre_final: 'z' };
  let capturedArgs = null;
  const goodClient = {
    messages: {
      create: async (args) => {
        capturedArgs = args;
        return {
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: JSON.stringify(goodNarrative) }],
        };
      },
    },
  };
  await generateNarrative(goodClient, 'Ana', SAMPLE_METRICS);
  assert.equal(capturedArgs.model, 'claude-opus-5');
  assert.deepEqual(capturedArgs.thinking, { type: 'disabled' });
});

test('generateNarrative retries with a fresh call and returns the successful result on fail-then-succeed', async () => {
  const goodNarrative = { intro: 'Hola', secciones: { ventas: 'x', fidelizacion: 'y' }, cierre_final: 'z' };
  let callCount = 0;
  const flakyClient = {
    messages: {
      create: async () => {
        callCount += 1;
        if (callCount === 1) throw new Error('transient failure');
        return {
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: JSON.stringify(goodNarrative) }],
        };
      },
    },
  };
  const result = await generateNarrative(flakyClient, 'Ana', SAMPLE_METRICS);
  assert.equal(callCount, 2);
  assert.deepEqual(result, goodNarrative);
});
