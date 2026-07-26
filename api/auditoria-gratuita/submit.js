'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { validateSubmission } = require('../../lib/auditoria-gratuita/validate');
const { calculateMetrics } = require('../../lib/auditoria-gratuita/metrics');
const { generateNarrative } = require('../../lib/auditoria-gratuita/narrative');
const { encodeReportData } = require('../../lib/auditoria-gratuita/report-codec');
const { sendReportEmail: defaultSendReportEmail } = require('../../lib/auditoria-gratuita/email');
const { sendReportWhatsapp: defaultSendReportWhatsapp } = require('../../lib/auditoria-gratuita/whatsapp');

function createSubmitHandler(overrides) {
  const deps = Object.assign(
    {
      anthropicClient: new Anthropic(),
      sendReportEmail: defaultSendReportEmail,
      sendReportWhatsapp: defaultSendReportWhatsapp,
      resendApiKey: process.env.RESEND_API_KEY,
      ycloudApiKey: process.env.YCLOUD_API_KEY,
      ycloudTemplateName: process.env.YCLOUD_TEMPLATE_NAME,
      siteUrl: process.env.SITE_URL || 'https://growmas.io',
    },
    overrides,
  );

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ errors: ['Method not allowed'] });
      return;
    }

    const { ok, errors, data } = validateSubmission(req.body);
    if (!ok) {
      res.status(400).json({ errors });
      return;
    }

    const { name, whatsapp, email, answers } = data;
    const metrics = calculateMetrics(answers);
    const report = await generateNarrative(deps.anthropicClient, name, metrics);

    const encoded = encodeReportData({ name, metrics, report });
    const reportUrl = `${deps.siteUrl}/auditoria-gratuita/reporte?d=${encoded}`;

    try {
      await deps.sendReportEmail({ apiKey: deps.resendApiKey, to: email, name, reportUrl });
    } catch (err) {
      console.error('sendReportEmail failed:', err.message);
    }

    try {
      await deps.sendReportWhatsapp({
        apiKey: deps.ycloudApiKey,
        templateName: deps.ycloudTemplateName,
        to: whatsapp,
        name,
        reportUrl,
      });
    } catch (err) {
      console.error('sendReportWhatsapp failed:', err.message);
    }

    res.status(200).json({ reportUrl });
  };
}

module.exports = { createSubmitHandler };
module.exports.default = createSubmitHandler();
