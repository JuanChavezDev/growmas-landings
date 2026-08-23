'use strict';

const STAGE_META = {
  ventas: {
    label: 'Ventas',
    color: '#C081FF',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12c0 4.418-4.03 8-9 8-1.5 0-2.9-.32-4.14-.9L3 20l1.3-3.9A7.93 7.93 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"/></svg>',
  },
  cierre: {
    label: 'Cierre',
    color: '#A78BFA',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>',
  },
  entrega: {
    label: 'Entrega',
    color: '#E36FC2',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9.5 14.5l5 5M14.5 14.5l-5 5"/></svg>',
  },
  fidelizacion: {
    label: 'Fidelización',
    color: '#FF8A8A',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  },
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

function formatNumber(n) {
  return Math.round(n).toLocaleString('es-PE');
}

function renderReportHtml({ name, metrics, report, whatsappUrl, videoUrl }) {
  const safeName = escapeHtml(name || '');
  const stages = metrics.stages || {};
  const safeVideoUrl = escapeHtml(videoUrl || '/mas-pacientes/video');
  const safeWhatsappUrl = escapeHtml(whatsappUrl || '');
  const sintesis = report && report.sintesis ? escapeHtml(report.sintesis) : '';

  const stageCards = Object.keys(stages)
    .map((key) => {
      const stage = stages[key];
      const meta = STAGE_META[key] || { label: key, color: '#C081FF', icon: '' };
      return `
      <div class="stage-card">
        <div class="stage-icon" style="color:${meta.color}">${meta.icon}</div>
        <p class="stage-label">${escapeHtml(meta.label)}</p>
        <p class="stage-amount">${formatSoles(stage.recuperable)}</p>
      </div>`;
    })
    .join('\n');

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
  main { max-width:520px; margin:0 auto; padding:clamp(32px,6vw,56px) clamp(20px,5vw,28px); }
  .eyebrow { font-size:15px; color:#C9C6D4; text-align:center; margin-bottom:4px; }
  .total-number { font-size:clamp(32px,7vw,40px); font-weight:500; color:#fff; text-align:center; margin:4px 0; }
  .total-number .grad-num { background:linear-gradient(135deg,#C081FF,#E36FC2); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .total-number .per-mes { font-size:18px; color:#9C9AA8; font-weight:400; }
  .total-caption { font-size:13px; color:#7A7788; text-align:center; margin-bottom:28px; }
  .stage-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:24px; }
  .stage-card { background:#14111C; border:1px solid #2E2A3B; border-radius:10px; padding:14px 10px; text-align:center; }
  .stage-icon { margin-bottom:6px; display:flex; align-items:center; justify-content:center; }
  .stage-label { font-size:11px; color:#9C9AA8; margin-bottom:4px; }
  .stage-amount { font-size:16px; color:#fff; font-weight:500; }
  .sintesis { font-size:14px; color:#C9C6D4; text-align:center; max-width:420px; margin:0 auto 28px; line-height:1.6; }
  .video-invite { background:linear-gradient(160deg,#1A0F2E,#14101F); border:1px solid #3A2E52; border-radius:12px; padding:26px 24px; text-align:center; }
  .video-invite h2 { font-size:17px; font-weight:500; color:#fff; margin-bottom:8px; }
  .video-invite p.video-text { font-size:13px; color:#9C9AA8; max-width:340px; margin:0 auto 20px; line-height:1.5; }
  .cta { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#C081FF,#E36FC2); color:#1A0B2E; border:none; font-size:14px; font-weight:500; padding:13px 26px; border-radius:10px; text-decoration:none; margin-bottom:10px; box-shadow:0 10px 40px rgba(192,129,255,.3); }
  .whatsapp-fallback { font-size:12px; color:#6F6C7D; }
  .whatsapp-fallback span { color:#9C9AA8; text-decoration:underline; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">${safeName ? `${safeName}, esto es lo que encontramos` : 'Esto es lo que encontramos'}</p>
  <div class="total-number">S/ <span class="grad-num">${formatNumber(metrics.totalMensualRecuperable)}</span><span class="per-mes">/mes</span></div>
  <p class="total-caption">${formatSoles(metrics.totalAnualRecuperable)} al año, según tus respuestas</p>

  <div class="stage-grid">
    ${stageCards}
  </div>

  <p class="sintesis">${sintesis}</p>

  <div class="video-invite">
    <h2>¿Cómo recupero ese dinero?</h2>
    <p class="video-text">En 12 minutos te muestro el sistema exacto para cerrar estas fugas — sin contratar a nadie, sin cambiar cómo ya trabajas.</p>
    <a class="cta" href="${safeVideoUrl}">▶ Ver el video (12 min) →</a>
    <p class="whatsapp-fallback">¿Prefieres hablar directo? <a href="${safeWhatsappUrl}" style="color:inherit;text-decoration:none;"><span>Escríbenos por WhatsApp</span></a></p>
  </div>
</main>
</body>
</html>`;
}

module.exports = { renderReportHtml, formatSoles, formatNumber, escapeHtml };
