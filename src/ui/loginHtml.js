// ============================================================================
// miliconfig v3.1 - درگاه ورود ادمین
// تجربه ورود به سبک edgetunnel: ابتدا یک صفحه ساده nginx دیده می‌شود،
// بعد از ۳ ثانیه محو/تار می‌شود و پنجره ورود روی آن ظاهر می‌شود.
// بدون ایموجی، بدون Canvas و بدون افکت سنگین — فقط CSS سبک.
// ============================================================================

import {
  BRAND_NAME,
  BRAND_UPPER,
  SUPPORT_CHANNEL_LABEL,
  SUPPORT_CHANNEL_URL,
  VERSION
} from '../config/defaults.js';
import { SHIELD_LOGO_SVG, FAVICON_DATA_URI, ICON, deEmoji } from './icons.js';
import { THEME_COLOR_META, VIEWPORT_META } from './baseCss.js';

export function renderLoginGatewayHtml(options = {}) {
  const adminPath = options.adminPath || '/admin';
  const error = options.error ? String(options.error) : '';
  const delay = Number(options.delay) >= 0 ? Number(options.delay) : 3000;

  return deEmoji(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${VIEWPORT_META}">
  <meta name="theme-color" content="${THEME_COLOR_META}">
  <meta name="robots" content="noindex, nofollow">
  <title>${BRAND_UPPER}</title>
  <link rel="icon" href="${FAVICON_DATA_URI}">
  <style>
    :root {
      --bg: #05080a;
      --ink: #eaf3e4;
      --soft: #93a58e;
      --accent: #b5ff4d;
      --line: rgba(255, 255, 255, 0.08);
      --ease: cubic-bezier(.22, .61, .36, 1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { color-scheme: dark; }
    body {
      min-height: 100dvh;
      background: var(--bg);
      color: var(--ink);
      font-family: "Vazirmatn", system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .ic { width: 18px; height: 18px; }

    /* ---------- ۱. صفحه جعلی nginx ---------- */
    .nginx {
      position: fixed;
      inset: 0;
      background: #f4f4f4;
      color: #2b2b2b;
      padding: 44px 26px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      transition: filter .9s var(--ease), opacity .9s var(--ease), transform .9s var(--ease);
      z-index: 2;
    }
    .nginx h1 {
      font-size: clamp(1.6rem, 5vw, 2.2rem);
      font-weight: 700;
      color: #2b2b2b;
      margin-bottom: 18px;
      letter-spacing: 0;
    }
    .nginx p { max-width: 640px; font-size: 0.95rem; line-height: 1.85; color: #434343; margin-bottom: 14px; }
    .nginx a { color: #22509b; text-decoration: none; }
    .nginx a:hover { text-decoration: underline; }
    .nginx .nginx-logo {
      margin-top: 26px;
      font-size: 1.9rem;
      letter-spacing: .12em;
      font-weight: 700;
      color: #8a8a8a;
    }
    .nginx .nginx-sub { font-size: .78rem; color: #8a8a8a; margin-top: 6px; letter-spacing: .06em; }
    body.veiled .nginx {
      filter: blur(14px) saturate(.4);
      opacity: 0;
      transform: scale(1.06);
      pointer-events: none;
    }

    /* ---------- ۲. پنجره ورود ---------- */
    .stage {
      position: relative;
      z-index: 3;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 22px;
      opacity: 0;
      transition: opacity .55s var(--ease) .18s;
      pointer-events: none;
    }
    body.veiled .stage { opacity: 1; pointer-events: auto; }
    .stage::before {
      content: "";
      position: fixed;
      inset: 0;
      background:
        radial-gradient(720px 420px at 76% -6%, rgba(163, 230, 53, 0.13), transparent 62%),
        radial-gradient(620px 380px at 12% 106%, rgba(56, 189, 248, 0.07), transparent 60%),
        #05080a;
      z-index: -1;
    }
    .login-window {
      width: min(392px, 100%);
      border-radius: 22px;
      border: 1px solid var(--line);
      background: rgba(13, 19, 15, 0.86);
      backdrop-filter: blur(26px) saturate(150%);
      -webkit-backdrop-filter: blur(26px) saturate(150%);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      padding: 22px;
      transform: translateY(10px) scale(.985);
      transition: transform .5s var(--ease);
    }
    body.veiled .login-window { transform: none; }
    .lw-bar { display: flex; align-items: center; gap: 6px; margin-bottom: 18px; }
    .lw-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255, 255, 255, 0.16); }
    .lw-dot.g { background: #a3e635; }
    .lw-dot.y { background: #fbbf24; }
    .lw-dot.r { background: #f87171; }
    .lw-logo { width: 52px; height: 52px; margin: 2px auto 10px; display: grid; place-items: center; }
    .lw-logo svg { width: 52px; height: 52px; }
    .lw-brand { text-align: center; font-size: 1.02rem; font-weight: 800; letter-spacing: .04em; }
    .lw-sub { text-align: center; font-size: .72rem; color: var(--soft); margin: 4px 0 18px; }
    .lw-label { display: block; font-size: .72rem; color: var(--soft); margin-bottom: 6px; }
    .lw-field {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 11px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(4, 8, 6, 0.9);
      transition: border-color .18s var(--ease), box-shadow .18s var(--ease);
    }
    .lw-field:focus-within { border-color: rgba(181, 255, 77, 0.55); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.12); }
    .lw-field .ic { color: var(--soft); }
    .lw-field input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ink);
      font: inherit;
      font-size: 16px;
      padding: 11px 0;
      letter-spacing: .06em;
    }
    .lw-eye { border: 0; background: transparent; color: var(--soft); cursor: pointer; display: inline-flex; padding: 4px; }
    .lw-eye:hover { color: var(--ink); }
    .lw-submit {
      width: 100%;
      margin-top: 14px;
      padding: 11px 14px;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      font-size: .86rem;
      color: #10160b;
      background: linear-gradient(180deg, #cbff78, #a3e635);
      box-shadow: 0 10px 26px rgba(163, 230, 53, 0.22);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: transform .16s var(--ease), filter .16s var(--ease);
    }
    .lw-submit:hover { transform: translateY(-1px); filter: brightness(1.04); }
    .lw-error {
      margin-top: 12px;
      font-size: .74rem;
      color: #fca5a5;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.28);
      border-radius: 10px;
      padding: 8px 10px;
      display: ${error ? 'block' : 'none'};
    }
    .lw-foot {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: .68rem;
      color: var(--soft);
    }
    .lw-foot a { color: var(--soft); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
    .lw-foot a:hover { color: var(--accent); }
    .lw-ver { direction: ltr; letter-spacing: .1em; opacity: .7; }
    @media (max-width: 420px) {
      .nginx { padding: 30px 18px; }
      .login-window { padding: 18px; border-radius: 18px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .nginx, .stage, .login-window { transition: opacity .01ms; }
    }
  </style>
</head>
<body>
  <!-- صفحه ساده سرویس (فریب نمای اولیه) -->
  <div class="nginx" id="nginxSplash">
    <h1>Welcome to nginx!</h1>
    <p>
      If you see this page, the nginx web server is successfully installed and
      working. Further configuration is required.
    </p>
    <p>
      For online documentation and support please refer to
      <a href="https://nginx.org/" rel="noopener">nginx.org</a>.<br>
      Commercial support is available at <a href="https://nginx.com/" rel="noopener">nginx.com</a>.
    </p>
    <p><em>Thank you for using nginx.</em></p>
    <div class="nginx-logo">nginx</div>
    <div class="nginx-sub">HTTP Server &middot; ${VERSION}</div>
  </div>

  <!-- پنجره ورود سیستم -->
  <div class="stage">
    <form class="login-window" method="post" action="${adminPath}/login" autocomplete="off">
      <div class="lw-bar">
        <span class="lw-dot r"></span><span class="lw-dot y"></span><span class="lw-dot g"></span>
      </div>
      <div class="lw-logo">${SHIELD_LOGO_SVG}</div>
      <div class="lw-brand">${BRAND_UPPER}</div>
      <div class="lw-sub">ورود به مرکز کنترل ${BRAND_NAME}</div>

      <label class="lw-label" for="adminPassword">رمز عبور ادمین</label>
      <div class="lw-field">
        ${ICON('lock')}
        <input id="adminPassword" name="password" type="password" inputmode="text" autocomplete="current-password" placeholder="رمز عبور" required autofocus>
        <button type="button" class="lw-eye" id="pwToggle" aria-label="نمایش رمز">${ICON('eye')}</button>
      </div>

      <button class="lw-submit" type="submit">${ICON('logout')} ورود به پنل</button>
      <div class="lw-error" id="lwError" role="alert">${error || 'رمز عبور نادرست است.'}</div>

      <div class="lw-foot">
        <a href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer">${ICON('message')} ${SUPPORT_CHANNEL_LABEL}</a>
        <span class="lw-ver">v${VERSION}</span>
      </div>
    </form>
  </div>

  <script>
    (function () {
      var body = document.body;
      var delay = ${Number.isFinite(delay) ? Math.max(0, delay) : 3000};
      function reveal() {
        body.classList.add('veiled');
        var input = document.getElementById('adminPassword');
        if (input) window.setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 260);
      }
      window.setTimeout(reveal, delay);
      // کلیک روی صفحه nginx (اختیاری) بلافاصله پنجره ورود را نشان می‌دهد
      var splash = document.getElementById('nginxSplash');
      if (splash) splash.addEventListener('click', reveal, { once: true });

      var toggle = document.getElementById('pwToggle');
      var input = document.getElementById('adminPassword');
      if (toggle && input) {
        toggle.addEventListener('click', function () {
          input.type = input.type === 'password' ? 'text' : 'password';
          input.focus({ preventScroll: true });
        });
      }
      var errorBox = document.getElementById('lwError');
      if (errorBox && errorBox.textContent.trim()) {
        window.setTimeout(function () {
          errorBox.style.display = 'block';
          var win = document.querySelector('.login-window');
          if (win) {
            win.style.transition = 'transform .12s ease';
            win.style.transform = 'translateX(6px)';
            window.setTimeout(function () { win.style.transform = 'none'; }, 130);
          }
        }, 260);
      }
    })();
  </script>
</body>
</html>`);
}
