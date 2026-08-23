'use strict';

const QUESTIONS = [
  { id: 'clientes_mes', stage: 'base', type: 'number', min: 0, prompt: '¿Cuántos clientes atiendes o cierras al mes?' },
  { id: 'ticket_promedio', stage: 'base', type: 'number', min: 0, prompt: '¿Cuál es tu ticket promedio por venta/cliente? (S/)' },
  { id: 'canal_adquisicion', stage: 'adquisicion', type: 'choice', options: ['redes_organico', 'recomendaciones', 'publicidad_paga', 'no_lo_se'], prompt: '¿De dónde viene la mayoría de tus clientes nuevos?' },
  { id: 'leads_mes', stage: 'adquisicion', type: 'number_or_unknown', min: 0, prompt: '¿Cuántos leads o contactos nuevos te escribieron el mes pasado?' },
  { id: 'tiempo_respuesta', stage: 'ventas', type: 'choice', options: ['minutos', 'mismo_dia', 'dia_siguiente', 'a_veces_mas_de_un_dia'], prompt: 'Cuando alguien te escribe, ¿en cuánto tiempo respondes en promedio?' },
  { id: 'tasa_cierre', stage: 'ventas', type: 'scale10', prompt: 'De cada 10 que preguntan, ¿cuántos terminan comprando?' },
  { id: 'hace_seguimiento', stage: 'cierre', type: 'choice', options: ['tengo_proceso', 'a_veces', 'casi_nunca'], prompt: 'Cuando alguien muestra interés pero no compra de inmediato, ¿le haces seguimiento?' },
  {
    id: 'tasa_seguimiento',
    stage: 'cierre',
    type: 'scale10',
    prompt: 'De esos que no compran de inmediato, ¿a cuántos de cada 10 logras contactar de nuevo?',
    showIf: (a) => a.hace_seguimiento === 'tengo_proceso' || a.hace_seguimiento === 'a_veces',
  },
  { id: 'tipo_entrega', stage: 'entrega', type: 'choice', options: ['producto', 'servicio', 'ambos'], prompt: '¿Tu negocio entrega principalmente un producto, un servicio, o ambos?' },
  {
    id: 'tasa_asistencia',
    stage: 'entrega',
    type: 'scale10',
    prompt: 'De cada 10 citas o reservas que agendas, ¿cuántas se presentan realmente?',
    showIf: (a) => a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tiene_recordatorio',
    stage: 'entrega',
    type: 'choice',
    options: ['automatico', 'manual_a_veces', 'nada'],
    prompt: '¿Tienes algo automático que le recuerde o confirme la cita al cliente antes del día?',
    showIf: (a) => a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tasa_upsell',
    stage: 'entrega',
    type: 'scale10',
    prompt: 'De cada 10 clientes que te compran, ¿a cuántos les ofreces o vendes algo adicional en el momento?',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'precio_adicional',
    stage: 'entrega',
    type: 'number',
    min: 0,
    prompt: '¿Cuál es el precio promedio de ese producto o combo adicional? (S/)',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tiene_sistema_upsell',
    stage: 'entrega',
    type: 'choice',
    options: ['automatico', 'depende_persona', 'nada'],
    prompt: '¿Tienes algún sistema automático para ofrecer eso, o depende de que alguien se acuerde?',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  { id: 'tasa_recompra', stage: 'fidelizacion', type: 'scale10', prompt: 'De cada 10 clientes que ya te compraron, ¿cuántos vuelven a comprarte?' },
  { id: 'tiene_reactivacion', stage: 'fidelizacion', type: 'choice', options: ['automatico', 'manual_a_veces', 'nada'], prompt: '¿Tienes algo para traer de vuelta a los clientes que dejaron de comprarte?' },
];

function getVisibleQuestions(answers) {
  const safeAnswers = answers || {};
  return QUESTIONS.filter((q) => (typeof q.showIf === 'function' ? q.showIf(safeAnswers) : true));
}

function getAllQuestionIds() {
  return QUESTIONS.map((q) => q.id);
}

module.exports = { QUESTIONS, getVisibleQuestions, getAllQuestionIds };
