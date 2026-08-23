'use strict';

const { renderVideoPageHtml } = require('../../lib/auditoria-gratuita/video-template');

function createVideoHandler(overrides) {
  const deps = Object.assign(
    { businessWhatsappNumber: process.env.BUSINESS_WHATSAPP_NUMBER },
    overrides,
  );

  return function handler(req, res) {
    const message = encodeURIComponent('Hola, vi el video y quiero agendar mi Auditoría Gratis.');
    const whatsappUrl = `https://wa.me/${deps.businessWhatsappNumber}?text=${message}`;

    const html = renderVideoPageHtml({ whatsappUrl });

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(html);
  };
}

module.exports = { createVideoHandler };
module.exports.default = createVideoHandler();
