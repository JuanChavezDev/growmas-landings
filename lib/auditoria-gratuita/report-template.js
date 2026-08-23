'use strict';

const STAGE_LABELS = {
  ventas: 'Ventas',
  cierre: 'Cierre',
  entrega: 'Entrega',
  fidelizacion: 'Fidelización',
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function formatSoles(n) {
  return 'S/ ' + Math.round(n).toLocaleString('es-PE');
}

function renderReportHtml({ name, metrics, report, whatsappUrl, videoUrl }) {
  const safeName = escapeHtml(name || '');
  const stages = metrics.stages || {};
  const safeVideoUrl = escapeHtml(videoUrl || '/mas-pacientes/video');

  const maxRecuperable = Math.max(1, ...Object.values(stages).map((s) => s.recuperable || 0));

  const stageRows = Object.keys(stages)
    .map((key) => {
      const stage = stages[key];
      const label = STAGE_LABELS[key] || key;
      const text = report && report.secciones && report.secciones[key] ? report.secciones[key] : '';
      const textHtml = text ? `\n        <p class="stage-text">${escapeHtml(text)}</p>` : '';
      const barPct = Math.max(6, Math.round((stage.recuperable / maxRecuperable) * 100));
      return `
      <div class="stage-card">
        <div class="stage-head">
          <span class="stage-label">${escapeHtml(label)}</span>
          <span class="stage-amount">${formatSoles(stage.recuperable)}/mes</span>
        </div>
        <div class="stage-bar-track"><div class="stage-bar-fill" style="width:${barPct}%"></div></div>${textHtml}
      </div>`;
    })
    .join('\n');

  const intro = report && report.intro ? escapeHtml(report.intro) : '';
  const cierreFinal = report && report.cierre_final ? escapeHtml(report.cierre_final) : '';
  const safeWhatsappUrl = escapeHtml(whatsappUrl || '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu auditoría · Growmas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1251797755579746');
fbq('track', 'PageView');
fbq('track', 'Lead');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1251797755579746&ev=PageView&noscript=1"
/></noscript>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1251797755579746&ev=Lead&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0A0F; color:#fff; font-family:'DM Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  main { max-width:680px; margin:0 auto; padding:clamp(32px,6vw,64px) clamp(20px,5vw,32px); }
  h1 { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(24px,4vw,32px); margin-bottom:20px; line-height:1.25; }
  .total-box { background:linear-gradient(135deg,#8B5CF6,#D946EF); border-radius:16px; padding:24px; text-align:center; margin-bottom:32px; }
  .total-box .amount { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(28px,5vw,40px); }
  .total-box .caption { font-size:14px; opacity:.9; margin-top:6px; }
  .intro, .cierre { font-size:15.5px; line-height:1.7; color:#C4C4CC; margin-bottom:24px; }
  .stage-card { background:#111118; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:20px; margin-bottom:14px; }
  .stage-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:12px; }
  .stage-label { font-family:Sora,sans-serif; font-weight:700; font-size:14px; }
  .stage-amount { font-family:Sora,sans-serif; font-weight:800; font-size:14px; color:#F97316; white-space:nowrap; }
  .stage-bar-track { height:6px; background:rgba(255,255,255,.07); border-radius:3px; overflow:hidden; margin-bottom:10px; }
  .stage-bar-fill { height:100%; background:linear-gradient(90deg,#F97316,#FB923C); border-radius:3px; }
  .stage-text { font-size:14.5px; line-height:1.6; color:#B4B4BC; }
  .video-invite { background:linear-gradient(160deg,#1A1130,#12081F); border:1px solid rgba(217,70,239,.25); border-radius:18px; padding:28px 24px; text-align:center; margin-top:32px; }
  .video-invite h2 { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(19px,3vw,23px); margin-bottom:10px; }
  .video-invite p { font-size:15px; line-height:1.6; color:#C4C4CC; max-width:480px; margin:0 auto 20px; }
  .cta { display:inline-flex; align-items:center; gap:10px; background:linear-gradient(135deg,#8B5CF6,#D946EF); color:#fff; padding:18px 32px; border-radius:14px; font-weight:700; font-size:16px; text-decoration:none; box-shadow:0 10px 40px rgba(217,70,239,.35); }
  .whatsapp-fallback { display:block; font-size:13px; color:#7A7A85; text-decoration:underline; margin-top:16px; }
</style>
</head>
<body>
<main>
  <h1>${safeName ? `${safeName}, esto es lo que encontramos.` : 'Esto es lo que encontramos.'}</h1>
  <div class="total-box">
    <div class="amount">${formatSoles(metrics.totalMensualRecuperable)}/mes</div>
    <div class="caption">Podrías estar recuperando esto cada mes (${formatSoles(metrics.totalAnualRecuperable)} al año)</div>
  </div>
  <p class="intro">${intro}</p>
  ${stageRows}
  <p class="cierre">${cierreFinal}</p>
  <div class="video-invite">
    <h2>¿Cómo recupero ese dinero?</h2>
    <p>En un video de 7 minutos te muestro exactamente cómo — con tu propio negocio como ejemplo, sin contratar a nadie ni cambiar lo que ya haces.</p>
    <a class="cta" href="${safeVideoUrl}">▶ Ver el video (7 min) →</a>
    <a class="whatsapp-fallback" href="${safeWhatsappUrl}">¿Prefieres hablar directo? Escríbenos por WhatsApp</a>
  </div>
</main>
</body>
</html>`;
}

module.exports = { renderReportHtml, formatSoles, escapeHtml };
