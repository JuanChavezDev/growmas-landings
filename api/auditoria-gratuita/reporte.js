'use strict';

const { decodeReportData } = require('../../lib/auditoria-gratuita/report-codec');
const { renderReportHtml, escapeHtml } = require('../../lib/auditoria-gratuita/report-template');

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Auditoría no encontrada</title></head>
<body style="background:#0A0A0F;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;">
<div><h1>No encontramos esta auditoría</h1><p><a href="/auditoria-gratuita" style="color:#A855F7;">Empezar una nueva auditoría gratuita</a></p></div>
</body></html>`;

function createReporteHandler(overrides) {
  const deps = Object.assign(
    { businessWhatsappNumber: process.env.BUSINESS_WHATSAPP_NUMBER },
    overrides,
  );

  return function handler(req, res) {
    const encoded = req.query && req.query.d;

    if (!encoded) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(NOT_FOUND_HTML);
      return;
    }

    let payload;
    try {
      payload = decodeReportData(encoded);
    } catch (err) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(NOT_FOUND_HTML);
      return;
    }

    const message = encodeURIComponent(
      `Hola, ya llené mi auditoría (${payload.name}) y quiero agendar una llamada para revisar mis resultados.`,
    );
    const whatsappUrl = `https://wa.me/${deps.businessWhatsappNumber}?text=${message}`;

    const html = renderReportHtml({
      name: payload.name,
      metrics: payload.metrics,
      report: payload.report,
      whatsappUrl,
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  };
}

module.exports = { createReporteHandler };
module.exports.default = createReporteHandler();
