'use strict';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function renderVideoPageHtml({ whatsappUrl }) {
  const safeWhatsappUrl = escapeHtml(whatsappUrl || '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>El sistema MAS · GROW+</title>
<meta name="robots" content="noindex, nofollow">
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
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1251797755579746&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0A0F; color:#fff; font-family:'DM Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  main { max-width:1040px; margin:0 auto; padding:clamp(22px,4vh,40px) clamp(20px,5vw,32px) clamp(24px,4vh,40px); text-align:center; }
  h1 { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(24px,4vw,38px); color:#fff; line-height:1.2; letter-spacing:-0.01em; max-width:920px; margin:0 auto 10px; animation:promiseGlow 3.4s ease-in-out infinite; }
  @keyframes promiseGlow {
    0%, 100% { text-shadow:0 0 22px rgba(180,92,255,.55), 0 0 46px rgba(180,92,255,.18); }
    50% { text-shadow:0 0 34px rgba(224,123,192,.75), 0 0 60px rgba(224,123,192,.28); }
  }
  .lede { font-size:clamp(13px,1.5vw,16px); color:#fff; opacity:.82; max-width:640px; margin:0 auto 16px; line-height:1.45; }
  .video-frame-outer { display:inline-block; max-width:100%; margin:0 auto 16px; border-radius:20px; padding:4px; background:linear-gradient(135deg,#B45CFF,#E07BC0); box-shadow:0 0 60px rgba(180,92,255,.32), 0 20px 60px rgba(0,0,0,.5); }
  .video-frame { border-radius:16px; overflow:hidden; background:#000; line-height:0; }
  .video-frame video { display:block; width:auto; height:auto; max-width:min(820px, 82vw); max-height:38vh; }
  .divider { height:1px; background:#26232F; margin:0 auto 12px; max-width:480px; }
  .closer { font-size:clamp(14px,1.5vw,16px); color:#E4E1EC; max-width:480px; margin:0 auto 10px; line-height:1.4; }
  .cta { display:inline-flex; align-items:center; gap:10px; background:linear-gradient(135deg,#25D366,#1EBE5B); color:#06210F; border:none; font-size:17px; font-weight:700; padding:17px 36px; border-radius:14px; text-decoration:none; box-shadow:0 14px 40px rgba(37,211,102,.4), 0 4px 14px rgba(37,211,102,.3); transition:transform .2s ease, box-shadow .2s ease; }
  .cta:hover { transform:translateY(-2px); box-shadow:0 18px 50px rgba(37,211,102,.5), 0 4px 14px rgba(37,211,102,.35); }
  .cta-caption { font-size:12px; color:#8A8794; max-width:340px; margin:8px auto 0; line-height:1.4; }
</style>
</head>
<body>
<main>
  <h1>El sistema para que cada paciente que ya conseguiste, valga más</h1>
  <p class="lede">En los próximos 12 minutos te muestro cómo funciona, dónde suele estar el cuello de botella que nadie ve, y cómo lo resolvemos con el Sistema MAS.</p>

  <div class="video-frame-outer">
    <div class="video-frame">
      <video controls controlsList="nodownload" preload="metadata" poster="/mas-pacientes/vsl-poster.jpg">
        <source src="/mas-pacientes/vsl.mp4" type="video/mp4">
      </video>
    </div>
  </div>

  <div class="divider"></div>

  <p class="closer">Cada mes que pasa sin resolver esto, es dinero que se te sigue escapando.</p>

  <a class="cta" href="${safeWhatsappUrl}">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#06210F"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2 22l5.4-1.42a9.87 9.87 0 004.64 1.18h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z"/></svg>
    Agendar mi Auditoría Gratis →
  </a>
  <p class="cta-caption">Te respondemos al instante — así se siente tener el sistema trabajando para ti.</p>
</main>
<script>
(function () {
  var video = document.querySelector('.video-frame video');
  if (!video) return;

  var milestonesFired = { 25: false, 50: false, 75: false, 100: false };
  var startedFired = false;

  function trackVideoEvent(eventName, extra) {
    console.log('[video-tracking]', eventName, extra || '');
  }

  video.addEventListener('play', function () {
    if (!startedFired) {
      startedFired = true;
      trackVideoEvent('video_start');
    }
  });

  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    var pct = (video.currentTime / video.duration) * 100;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !milestonesFired[m]) {
        milestonesFired[m] = true;
        trackVideoEvent('video_progress_' + m, { percent: m });
      }
    });
  });

  video.addEventListener('ended', function () {
    trackVideoEvent('video_complete');
  });
})();
</script>
</body>
</html>`;
}

module.exports = { renderVideoPageHtml, escapeHtml };
