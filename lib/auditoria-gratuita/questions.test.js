'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getVisibleQuestions, getAllQuestionIds } = require('./questions');

test('getAllQuestionIds returns every question id, including branch-only ones', () => {
  const ids = getAllQuestionIds();
  assert.ok(ids.includes('tasa_asistencia'));
  assert.ok(ids.includes('tasa_upsell'));
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids');
});

test('getVisibleQuestions hides servicio-only questions when tipo_entrega is producto', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'producto' }).map((q) => q.id);
  assert.ok(!visible.includes('tasa_asistencia'));
  assert.ok(!visible.includes('tiene_recordatorio'));
  assert.ok(visible.includes('tasa_upsell'));
});

test('getVisibleQuestions hides producto-only questions when tipo_entrega is servicio', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'servicio' }).map((q) => q.id);
  assert.ok(!visible.includes('tasa_upsell'));
  assert.ok(!visible.includes('precio_adicional'));
  assert.ok(visible.includes('tasa_asistencia'));
});

test('getVisibleQuestions shows both branches when tipo_entrega is ambos', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'ambos' }).map((q) => q.id);
  assert.ok(visible.includes('tasa_asistencia'));
  assert.ok(visible.includes('tasa_upsell'));
});

test('getVisibleQuestions shows no entrega-branch questions before tipo_entrega is answered', () => {
  const visible = getVisibleQuestions({}).map((q) => q.id);
  assert.ok(!visible.includes('tasa_asistencia'));
  assert.ok(!visible.includes('tasa_upsell'));
  assert.ok(visible.includes('tipo_entrega'));
});
