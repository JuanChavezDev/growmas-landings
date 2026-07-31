'use strict';

async function sendReportWhatsapp({ apiKey, templateName, to, name, reportUrl }) {
  try {
    const res = await fetch('https://api.ycloud.com/v2/whatsapp/messages/sendTemplate', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        templateName,
        templateLanguage: 'es',
        params: [name, reportUrl],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `YCloud error ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { sendReportWhatsapp };
