'use strict';

const { escapeHtml } = require('./report-template');

function buildEmailHtml(name, reportUrl) {
  const safeName = escapeHtml(name || '');
  const safeUrl = escapeHtml(reportUrl || '');
  return `
  <div style="background:#0A0A0F;padding:32px 16px;font-family:'DM Sans',system-ui,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#111118;border-radius:16px;padding:32px;color:#fff;">
      <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Hola ${safeName},</p>
      <p style="font-size:16px;line-height:1.6;color:#C4C4CC;margin:0 0 24px;">
        Ya analizamos tus respuestas. Tu auditoría personalizada está lista, con el estimado de cuánto dinero
        podrías estar recuperando cada mes en tu negocio.
      </p>
      <p style="text-align:center;margin:0 0 8px;">
        <a href="${safeUrl}" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#D946EF);color:#fff;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;text-decoration:none;">
          Ver mi auditoría →
        </a>
      </p>
    </div>
  </div>`;
}

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
      html: buildEmailHtml(name, reportUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

function buildLeadNotificationHtml({ name, whatsapp, email, totalMensualRecuperable, reportUrl }) {
  const safeName = escapeHtml(name || '');
  const safeWhatsapp = escapeHtml(whatsapp || '');
  const safeEmail = escapeHtml(email || '');
  const safeUrl = escapeHtml(reportUrl || '');
  const waDigits = String(whatsapp || '').replace(/[^\d]/g, '');
  const waLink = escapeHtml(`https://wa.me/${waDigits}`);
  return `
  <div style="background:#0A0A0F;padding:32px 16px;font-family:'DM Sans',system-ui,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#111118;border-radius:16px;padding:32px;color:#fff;">
      <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">🔔 Nuevo lead en mas-pacientes</p>
      <p style="font-size:22px;font-weight:700;line-height:1.4;margin:0 0 20px;color:#DCB6FF;">
        S/ ${totalMensualRecuperable}/mes recuperable
      </p>
      <p style="font-size:15px;line-height:1.8;color:#C4C4CC;margin:0 0 20px;">
        <strong style="color:#fff;">Nombre:</strong> ${safeName}<br>
        <strong style="color:#fff;">WhatsApp:</strong> <a href="${waLink}" style="color:#DCB6FF;">${safeWhatsapp}</a><br>
        <strong style="color:#fff;">Email:</strong> ${safeEmail}
      </p>
      <p style="text-align:center;margin:0;">
        <a href="${safeUrl}" style="display:inline-block;background:linear-gradient(135deg,#B45CFF,#E07BC0);color:#0A0A0F;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;">
          Ver su reporte completo →
        </a>
      </p>
    </div>
  </div>`;
}

async function sendLeadNotification({ apiKey, to, name, whatsapp, email, totalMensualRecuperable, reportUrl }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Growmas <auditoria@mail.growmas.io>',
      to: [to],
      subject: `🔔 Nuevo lead: ${name} (S/ ${totalMensualRecuperable}/mes)`,
      html: buildLeadNotificationHtml({ name, whatsapp, email, totalMensualRecuperable, reportUrl }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

module.exports = { sendReportEmail, sendLeadNotification };
