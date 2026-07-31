'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSubmission } = require('./validate');

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

test('accepts a fully valid submission', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({}),
  });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data.name, 'Ana');
  assert.equal(result.data.answers.tasa_cierre, 4);
});

test('rejects missing name, invalid email, and empty whatsapp together', () => {
  const result = validateSubmission({
    name: '',
    whatsapp: '',
    email: 'not-an-email',
    answers: fullAnswers({}),
  });
  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.errors.length, 3);
});

test('accepts leads_mes as "no lo sé" and stores it as null', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ leads_mes: 'no_lo_se' }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.answers.leads_mes, null);
});

test('rejects an out-of-range scale10 answer', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ tasa_cierre: 11 }),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('tasa_cierre')));
});

test('does not require servicio-branch answers when tipo_entrega is producto', () => {
  const answers = fullAnswers({});
  delete answers.tasa_asistencia; // never provided, and shouldn't be required
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers,
  });
  assert.equal(result.ok, true);
});

test('rejects a non-integer number answer', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ clientes_mes: 7.5 }),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('clientes_mes')));
});

test('rejects a number answer above the plausibility ceiling', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ clientes_mes: 5000000 }),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('clientes_mes')));
});

test('accepts a number answer exactly at the plausibility ceiling', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ clientes_mes: 1000000 }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.answers.clientes_mes, 1000000);
});
