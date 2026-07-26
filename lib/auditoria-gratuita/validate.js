'use strict';

const { getVisibleQuestions } = require('./questions');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSubmission(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Cuerpo de la solicitud inválido.'], data: null };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) errors.push('El nombre es obligatorio.');

  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  if (!whatsapp) errors.push('El WhatsApp es obligatorio.');

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !EMAIL_RE.test(email)) errors.push('El email no es válido.');

  const rawAnswers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const visible = getVisibleQuestions(rawAnswers);
  const answers = {};

  for (const q of visible) {
    const value = rawAnswers[q.id];
    if (q.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < q.min || !Number.isInteger(n) || n > 1_000_000) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = n;
    } else if (q.type === 'number_or_unknown') {
      if (value === null || value === 'no_lo_se' || value === undefined) {
        answers[q.id] = null;
      } else {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n) || n > 1_000_000) {
          errors.push(`Respuesta inválida para "${q.id}".`);
          continue;
        }
        answers[q.id] = n;
      }
    } else if (q.type === 'scale10') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = n;
    } else if (q.type === 'choice') {
      if (!q.options.includes(value)) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = value;
    }
  }

  if (errors.length > 0) return { ok: false, errors, data: null };
  return { ok: true, errors: [], data: { name, whatsapp, email, answers } };
}

module.exports = { validateSubmission };
