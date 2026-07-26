'use strict';

const CONFIG = {
  tasaRecuperacionRealista: 0.30,
  tasaConversionSeguimiento: 0.25,
};

function round(n) {
  return Math.round(n * 100) / 100;
}

function calculateMetrics(answers) {
  const clientesMes = Number(answers.clientes_mes) || 0;
  const ticket = Number(answers.ticket_promedio) || 0;
  const leadsMes = answers.leads_mes === null || answers.leads_mes === undefined ? null : Number(answers.leads_mes);
  const tasaCierre = Number(answers.tasa_cierre) || 0;
  const tasaSeguimiento = Number(answers.tasa_seguimiento) || 0;
  const tipoEntrega = answers.tipo_entrega;
  const tasaAsistencia = Number(answers.tasa_asistencia) || 0;
  const tasaUpsell = Number(answers.tasa_upsell) || 0;
  const precioAdicional = Number(answers.precio_adicional) || 0;
  const tasaRecompra = Number(answers.tasa_recompra) || 0;

  const stages = {};

  if (leadsMes !== null) {
    const leadsPerdidos = (leadsMes * (10 - tasaCierre)) / 10;
    const dineroVentas = leadsPerdidos * ticket;
    stages.ventas = {
      dineroQueSeVa: round(dineroVentas),
      recuperable: round(dineroVentas * CONFIG.tasaRecuperacionRealista),
    };

    const sinSeguimiento = (leadsPerdidos * (10 - tasaSeguimiento)) / 10;
    const dineroCierre = sinSeguimiento * ticket;
    stages.cierre = {
      dineroQueSeVa: round(dineroCierre),
      recuperable: round(dineroCierre * CONFIG.tasaConversionSeguimiento),
    };
  }

  let dineroEntrega = 0;
  if (tipoEntrega === 'servicio' || tipoEntrega === 'ambos') {
    dineroEntrega += (clientesMes * (10 - tasaAsistencia)) / 10 * ticket;
  }
  if (tipoEntrega === 'producto' || tipoEntrega === 'ambos') {
    dineroEntrega += (clientesMes * (10 - tasaUpsell)) / 10 * precioAdicional;
  }
  if (tipoEntrega) {
    stages.entrega = {
      dineroQueSeVa: round(dineroEntrega),
      recuperable: round(dineroEntrega * CONFIG.tasaRecuperacionRealista),
    };
  }

  const noVuelven = (clientesMes * (10 - tasaRecompra)) / 10;
  const dineroFidelizacion = noVuelven * ticket;
  stages.fidelizacion = {
    dineroQueSeVa: round(dineroFidelizacion),
    recuperable: round(dineroFidelizacion * CONFIG.tasaRecuperacionRealista),
  };

  const totalMensualRecuperable = round(
    Object.values(stages).reduce((sum, s) => sum + s.recuperable, 0),
  );

  return {
    stages,
    totalMensualRecuperable,
    totalAnualRecuperable: round(totalMensualRecuperable * 12),
    sinDatosDeLeads: leadsMes === null,
  };
}

module.exports = { calculateMetrics, CONFIG };
