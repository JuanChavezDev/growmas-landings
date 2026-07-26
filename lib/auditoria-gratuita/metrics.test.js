'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMetrics } = require('./metrics');

test('calculates ventas, cierre, entrega (producto), and fidelizacion when leads_mes is known', () => {
  const metrics = calculateMetrics({
    clientes_mes: 100,
    ticket_promedio: 50,
    leads_mes: 200,
    tasa_cierre: 4,
    tasa_seguimiento: 2,
    tipo_entrega: 'producto',
    tasa_upsell: 5,
    precio_adicional: 20,
    tasa_recompra: 5,
  });

  assert.equal(metrics.sinDatosDeLeads, false);
  assert.equal(metrics.stages.ventas.dineroQueSeVa, 6000);
  assert.equal(metrics.stages.ventas.recuperable, 1800);
  assert.equal(metrics.stages.cierre.dineroQueSeVa, 4800);
  assert.equal(metrics.stages.cierre.recuperable, 1200);
  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1000);
  assert.equal(metrics.stages.entrega.recuperable, 300);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 2500);
  assert.equal(metrics.stages.fidelizacion.recuperable, 750);
  assert.equal(metrics.totalMensualRecuperable, 4050);
  assert.equal(metrics.totalAnualRecuperable, 48600);
});

test('omits ventas and cierre when leads_mes is null, and flags sinDatosDeLeads', () => {
  const metrics = calculateMetrics({
    clientes_mes: 50,
    ticket_promedio: 100,
    leads_mes: null,
    tipo_entrega: 'servicio',
    tasa_asistencia: 7,
    tasa_recompra: 10,
  });

  assert.equal(metrics.sinDatosDeLeads, true);
  assert.equal(metrics.stages.ventas, undefined);
  assert.equal(metrics.stages.cierre, undefined);
  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1500);
  assert.equal(metrics.stages.entrega.recuperable, 450);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 0);
  assert.equal(metrics.stages.fidelizacion.recuperable, 0);
  assert.equal(metrics.totalMensualRecuperable, 450);
});

test('sums both entrega branches when tipo_entrega is ambos', () => {
  const metrics = calculateMetrics({
    clientes_mes: 20,
    ticket_promedio: 30,
    leads_mes: null,
    tipo_entrega: 'ambos',
    tasa_asistencia: 5,
    tasa_upsell: 0,
    precio_adicional: 40,
    tasa_recompra: 0,
  });

  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1100);
  assert.equal(metrics.stages.entrega.recuperable, 330);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 600);
  assert.equal(metrics.stages.fidelizacion.recuperable, 180);
  assert.equal(metrics.totalMensualRecuperable, 510);
  assert.equal(metrics.totalAnualRecuperable, 6120);
});
