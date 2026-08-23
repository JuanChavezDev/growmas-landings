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
    sintesis: { type: 'string' },
  },
  required: ['sintesis'],
  additionalProperties: false,
};

function buildPrompt(name, metrics) {
  const stagesSummary = Object.entries(metrics.stages || {})
    .map(([key, s]) => `- ${STAGE_LABELS[key] || key}: pierde S/ ${s.dineroQueSeVa}/mes, recuperable S/ ${s.recuperable}/mes`)
    .join('\n');

  const content = `Eres un consultor de negocios escribiendo el diagnóstico corto de un reporte para ${name || 'el dueño de un negocio'}.

Datos ya calculados (NO los recalcules, NO inventes otros números, úsalos exactamente):
${stagesSummary}
Total recuperable al mes: S/ ${metrics.totalMensualRecuperable}
Total recuperable al año: S/ ${metrics.totalAnualRecuperable}
${metrics.sinDatosDeLeads ? 'El negocio no tiene visibilidad de cuántos leads le llega al mes.' : ''}

Escribe en español latinoamericano neutro: nada de modismos de un solo país (nada de "al toque", "chévere", "pucha", ni jerga española como "vale" o "tío"), tiene que entenderse igual de bien en cualquier país de Latinoamérica. Tono directo y cercano, nunca corporativo ni genérico. No muestres las respuestas crudas del cuestionario, sintetiza. No menciones precios, planes ni compromisos de tiempo mínimo — eso se conversa en una llamada, no en este reporte.

Escribe "sintesis": máximo 2 frases cortas que identifiquen cuál es la fuga más grande (la etapa con mayor "recuperable") y la reencuadren como un problema de sistema, no de esfuerzo ni de falta de pacientes/clientes. Directo al punto, sin relleno, sin listar todas las etapas.`;

  return [{ role: 'user', content }];
}

function fallbackNarrative(metrics) {
  const stages = metrics.stages || {};
  const entries = Object.entries(stages).sort((a, b) => (b[1].recuperable || 0) - (a[1].recuperable || 0));
  const biggestLabel = entries.length ? (STAGE_LABELS[entries[0][0]] || entries[0][0]) : 'tu proceso';

  return {
    sintesis: `La mayor fuga está en ${biggestLabel.toLowerCase()} — no es falta de clientes, es falta de sistema.`,
  };
}

function isWellFormedNarrative(parsed) {
  return (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.sintesis === 'string'
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
