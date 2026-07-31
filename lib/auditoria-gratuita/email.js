'use strict';

async function sendReportEmail({ apiKey, to, name, reportUrl }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Growmas <auditoria@mail.growmas.io>',
      to: [to],
      subject: `Tu auditoría está lista, ${name}`,
      html: `<p>Hola ${name},</p><p>Tu auditoría personalizada ya está lista. Puedes verla aquí:</p><p><a href="${reportUrl}">${reportUrl}</a></p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

module.exports = { sendReportEmail };
