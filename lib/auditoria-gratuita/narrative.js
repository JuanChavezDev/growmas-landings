'use strict';

const STAGE_LABELS = {
  ventas: 'Ventas',
  cierre: 'Cierre',
  entrega: 'Entrega',
  fidelizacion: 'Fidelización',
};

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string' },
    secciones: {
      type: 'object',
      properties: {
        ventas: { type: 'string' },
        cierre: { type: 'string' },
        entrega: { type: 'string' },
        fidelizacion: { type: 'string' },
      },
      additionalProperties: false,
    },
    cierre_final: { type: 'string' },
  },
  required: ['intro', 'secciones', 'cierre_final'],
  additionalProperties: false,
};

function buildPrompt(name, metrics) {
  const stagesSummary = Object.entries(metrics.stages || {})
    .map(([key, s]) => `- ${STAGE_LABELS[key] || key}: pierde S/ ${s.dineroQueSeVa}/mes, recuperable S/ ${s.recuperable}/mes`)
    .join('\n');

  const content = `Eres un consultor de negocios escribiendo un reporte corto y profesional para ${name || 'el dueño de un negocio'}.

Datos ya calculados (NO los recalcules, NO inventes otros números, úsalos exactamente):
${stagesSummary}
Total recuperable al mes: S/ ${metrics.totalMensualRecuperable}
Total recuperable al año: S/ ${metrics.totalAnualRecuperable}
${metrics.sinDatosDeLeads ? 'El negocio no tiene visibilidad de cuántos leads le llega al mes.' : ''}

Escribe en español, tono directo y cercano, nunca corporativo ni genérico. No muestres las respuestas crudas del cuestionario, sintetiza. No menciones precios, planes ni compromisos de tiempo mínimo — eso se conversa en una llamada, no en este reporte. Sé breve.

Completa "secciones" solo para las etapas listadas arriba; para cualquier otra etapa deja el texto vacío ("").`;

  return [{ role: 'user', content }];
}

function fallbackNarrative(metrics) {
  const secciones = {};
  for (const [key, s] of Object.entries(metrics.stages || {})) {
    secciones[key] = `En esta etapa se estima que se te están yendo S/ ${s.dineroQueSeVa} al mes, de los cuales podrías recuperar alrededor de S/ ${s.recuperable} con un sistema adecuado.`;
  }
  return {
    intro: 'Analizamos tus respuestas y esto es lo que encontramos en tu negocio.',
    secciones,
    cierre_final: 'Estos números son una estimación basada en tus propias respuestas. El siguiente paso es agendar una llamada para ver exactamente cómo recuperar ese dinero.',
  };
}

function isWellFormedNarrative(parsed) {
  return (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.intro === 'string' &&
    parsed.secciones &&
    typeof parsed.secciones === 'object' &&
    typeof parsed.cierre_final === 'string'
  );
}

async function generateNarrative(anthropicClient, name, metrics) {
  const messages = buildPrompt(name, metrics);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropicClient.messages.create({
        model: 'claude-opus-5',
        max_tokens: 2048,
        thinking: { type: 'disabled' },
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: REPORT_SCHEMA },
        },
        messages,
      });

      if (response.stop_reason === 'refusal') throw new Error('Claude refused the request');

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock) throw new Error('No text block in Claude response');

      const parsed = JSON.parse(textBlock.text);
      if (!isWellFormedNarrative(parsed)) throw new Error('Malformed narrative shape');
      return parsed;
    } catch (err) {
      console.error('generateNarrative attempt failed:', err.message);
      if (attempt === 1) break;
    }
  }

  return fallbackNarrative(metrics);
}

module.exports = { buildPrompt, fallbackNarrative, generateNarrative, REPORT_SCHEMA };
