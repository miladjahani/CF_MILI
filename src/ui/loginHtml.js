// ============================================================================
// miliconfig v3.1 - صفحه ورود / لندینگ درگاه (تم سبز نئونی miliconfig)
// بازطراحی‌شده با پس‌زمینه زنده (Canvas + Aurora) و انیمیشن‌های روان
// ============================================================================

import {
  BRAND_NAME,
  BRAND_UPPER,
  SUPPORT_CHANNEL_LABEL,
  SUPPORT_CHANNEL_URL,
  VERSION
} from '../config/defaults.js';
import { SHIELD_LOGO_SVG, FAVICON_DATA_URI } from './icons.js';
import { BASE_UI_CSS, THEME_COLOR_META, VIEWPORT_META } from './baseCss.js';
import { FX_CSS, FX_MARKUP, FX_RUNTIME_JS } from './fx.js';

export function renderLoginGatewayHtml(options = {}) {
  const hasCustomPath = Boolean(options.customPath && String(options.customPath).trim());

  const features = [
    { icon: '🛡️', title: 'هسته VLESS / Trojan / xhttp', sub: 'WebSocket + ECH روی لبه کلودفلر' },
    { icon: '🗄️', title: 'دیتابیس D1 چندکاربره', sub: 'ساخت خودکار جداول، بدون خطای ۱۱۰۱' },
    { icon: '⚡', title: 'نام‌گذاری number+' + BRAND_NAME, sub: '۱+' + BRAND_NAME + ' تا N+' + BRAND_NAME + ' به ترتیب پینگ' },
    { icon: '☁️', title: 'استقرار روی Pages و Workers', sub: 'یک خروجی، دو بستر، بدون هیچ سکرت' }
  ];

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${VIEWPORT_META}">
  <meta name="theme-color" content="${THEME_COLOR_META}">
  <meta name="description" content="مرکز کنترل زیرساخت پروکسی ${BRAND_NAME} روی Cloudflare — پنل مدیریت، ساب‌لینک اختصاصی و صفحه وضعیت کاربر">
  <title>${BRAND_UPPER} ${VERSION} — مرکز کنترل زیرساخت پروکسی</title>
  <link rel="icon" href="${FAVICON_DATA_URI}">
  <style>
    :root {
      --bg-deep: #050905;
      --bg-card: rgba(12, 22, 12, 0.82);
      --bg-input: rgba(7, 13, 7, 0.94);
      --border-soft: rgba(163, 230, 53, 0.2);
      --border-strong: rgba(181, 255, 77, 0.55);
      --neon: #b5ff4d;
      --neon-2: #84cc16;
      --text-main: #f2f8ef;
      --text-muted: #93a889;
      --danger: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Vazirmatn", Tahoma, sans-serif;
      background: radial-gradient(circle at 50% -10%, rgba(132, 204, 22, 0.16) 0%, transparent 55%), var(--bg-deep);
      color: var(--text-main);
      position: relative;
      overflow-x: hidden;
      line-height: 1.7;
      padding: 26px 18px calc(34px + env(safe-area-inset-bottom, 0px));
    }
    .page {
      position: relative;
      z-index: 1;
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    /* ================= هدر برند ================= */
    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      padding: 14px 18px;
      border-radius: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      backdrop-filter: blur(16px);
    }
    .brand-info { display: flex; align-items: center; gap: 13px; }
    .brand-logo { width: 50px; height: 50px; flex-shrink: 0; }
    .brand-logo svg { width: 100%; height: 100%; }
    .brand-title {
      font-size: 1.2rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      direction: ltr;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--neon);
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .brand-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 13px;
      border-radius: 999px;
      background: rgba(163, 230, 53, 0.12);
      border: 1px solid rgba(163, 230, 53, 0.35);
      font-size: 0.78rem;
      color: var(--neon);
      font-weight: 700;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--neon);
      box-shadow: 0 0 10px var(--neon);
    }

    /* ================= چیدمان اصلی ================= */
    .layout {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 940px) {
      .layout { grid-template-columns: 1fr; }
    }

    /* ================= هیرو ================= */
    .hero {
      position: relative;
      overflow: hidden;
      padding: 30px 26px 26px;
      border-radius: 26px;
      background:
        linear-gradient(150deg, rgba(16, 30, 16, 0.94) 0%, rgba(8, 15, 8, 0.9) 100%);
      border: 1px solid var(--border-soft);
      box-shadow: 0 26px 70px rgba(0, 0, 0, 0.6);
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.7rem;
      letter-spacing: 0.2em;
      color: var(--neon);
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .hero-eyebrow::before {
      content: "";
      width: 26px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--neon));
    }
    .hero-title {
      font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.15rem);
      font-weight: 900;
      line-height: 1.45;
      margin-bottom: 12px;
    }
    .hero-title .grad {
      background: linear-gradient(100deg, #eaffb0 0%, #b5ff4d 40%, #84cc16 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .hero-text {
      font-size: 0.93rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      max-width: 60ch;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }
    @media (max-width: 520px) {
      .feature-grid { grid-template-columns: 1fr; }
    }
    .feature-card {
      padding: 13px 14px;
      border-radius: 16px;
      background: rgba(8, 15, 8, 0.72);
      border: 1px solid rgba(163, 230, 53, 0.14);
    }
    .feature-icon { font-size: 1.05rem; }
    .feature-title {
      font-size: 0.85rem;
      font-weight: 800;
      margin: 6px 0 2px;
    }
    .feature-sub {
      font-size: 0.73rem;
      color: var(--text-muted);
    }
    .terminal {
      border-radius: 16px;
      background: rgba(4, 8, 4, 0.9);
      border: 1px solid rgba(163, 230, 53, 0.16);
      padding: 13px 15px;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.76rem;
      direction: ltr;
      color: #9fb894;
      line-height: 1.8;
      overflow: hidden;
    }
    .terminal .u { color: var(--neon); }
    .terminal .ok { color: #d9ff9b; }

    /* ================= کارت ورود ================= */
    .gateway-card {
      position: relative;
      padding: 26px 24px;
      border-radius: 26px;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      box-shadow: 0 26px 80px rgba(0, 0, 0, 0.7), 0 0 44px rgba(163, 230, 53, 0.07);
      backdrop-filter: blur(18px);
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 18px;
    }
    .card-title { font-size: 1.04rem; font-weight: 900; }
    .card-hint { font-size: 0.74rem; color: var(--text-muted); }
    .desc-text {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-bottom: 18px;
    }
    .desc-text strong { color: #dff5c8; }
    .mode-switch {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 5px;
      border-radius: 14px;
      background: rgba(5, 10, 5, 0.8);
      border: 1px solid var(--border-soft);
      margin-bottom: 16px;
    }
    .mode-btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 0.83rem;
      font-weight: 800;
      padding: 9px 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.34s ease, color 0.34s ease, transform 0.34s ease;
    }
    .mode-btn.active {
      background: linear-gradient(135deg, rgba(198, 255, 102, 0.95) 0%, rgba(132, 204, 22, 0.95) 100%);
      color: #071204;
      box-shadow: 0 6px 20px rgba(163, 230, 53, 0.28);
    }
    .mode-btn:not(.active):hover { color: var(--neon); }

    .input-group { margin-bottom: 14px; }
    .input-label {
      display: block;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 7px;
    }
    .input-wrap { position: relative; }
    .token-input {
      width: 100%;
      padding: 14px 16px 14px 46px;
      border-radius: 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-soft);
      color: var(--text-main);
      font-size: 0.92rem;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      direction: ltr;
      text-align: left;
      outline: none;
      transition: border-color 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
    }
    .token-input:focus {
      border-color: var(--neon);
      background: rgba(10, 18, 10, 0.98);
      box-shadow: 0 0 0 4px rgba(181, 255, 77, 0.13);
    }
    .token-input.invalid {
      border-color: rgba(248, 113, 113, 0.65);
      box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.12);
    }
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
      opacity: 0.75;
      pointer-events: none;
    }
    .btn-row {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 10px;
      margin-top: 4px;
    }
    @media (max-width: 480px) {
      .btn-row { grid-template-columns: 1fr; }
    }
    .btn {
      padding: 13px 16px;
      border-radius: 14px;
      font-size: 0.9rem;
      font-weight: 800;
      cursor: pointer;
      border: 1px solid transparent;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.3s ease, color 0.3s ease, background 0.3s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #c6ff66 0%, #84cc16 100%);
      color: #071204;
      box-shadow: 0 8px 26px rgba(163, 230, 53, 0.3);
    }
    .btn-primary:hover { transform: translate3d(0, -2px, 0); box-shadow: 0 12px 32px rgba(163, 230, 53, 0.42); }
    .btn-secondary {
      background: rgba(163, 230, 53, 0.08);
      border-color: var(--border-soft);
      color: var(--text-main);
    }
    .btn-secondary:hover { border-color: var(--neon); color: var(--neon); transform: translate3d(0, -2px, 0); }
    .btn[disabled] { opacity: 0.62; cursor: progress; transform: none; }

    .msg-box {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.83rem;
      display: none;
      animation: fxFadeUp 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .msg-error {
      display: block;
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.35);
      color: var(--danger);
    }
    .msg-info {
      display: block;
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid rgba(163, 230, 53, 0.32);
      color: var(--neon);
    }
    .kbd-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .kbd {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 6px;
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid var(--border-soft);
      color: #dff5c8;
    }

    /* ================= پشتیبانی + فوتر ================= */
    .support-band {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      padding: 18px 20px;
      border-radius: 22px;
      background: linear-gradient(120deg, rgba(163, 230, 53, 0.12) 0%, rgba(8, 15, 8, 0.86) 62%);
      border: 1px dashed var(--border-strong);
    }
    .support-text { font-size: 0.88rem; }
    .support-text b { color: var(--neon); }
    .support-text a { color: var(--neon); text-decoration: none; overflow-wrap: anywhere; }
    .support-text a:hover { text-decoration: underline; }
    .btn-support {
      background: linear-gradient(135deg, #c6ff66 0%, #84cc16 100%);
      color: #071204;
      border-radius: 14px;
      padding: 12px 20px;
      font-weight: 900;
      font-size: 0.88rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 26px rgba(163, 230, 53, 0.28);
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
    }
    .btn-support:hover { transform: translate3d(0, -2px, 0); box-shadow: 0 14px 34px rgba(163, 230, 53, 0.4); }
    .foot-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .chip {
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(163, 230, 53, 0.08);
      border: 1px solid var(--border-soft);
      color: #cfe6bd;
    }
    @media (max-width: 620px) {
      body { padding: 16px 12px calc(26px + env(safe-area-inset-bottom, 0px)); }
      .gateway-card, .hero { padding: 20px 16px; border-radius: 22px; }
      .brand-bar { padding: 12px 14px; }
      .brand-title { font-size: 1.05rem; }
      .btn { min-height: 46px; }
      .terminal { font-size: 0.7rem; }
    }
${FX_CSS}
${BASE_UI_CSS}
  </style>
</head>
<body>
  ${FX_MARKUP}

  <div class="page">
    <header class="brand-bar fx-fade" style="--fx-i:0">
      <div class="brand-info">
        <div class="brand-logo fx-float">${SHIELD_LOGO_SVG}</div>
        <div>
          <div class="brand-title">${BRAND_UPPER}</div>
          <div class="brand-sub">Cloudflare D1 Control ${VERSION}</div>
        </div>
      </div>
      <div class="brand-actions">
        <span class="live-pill"><span class="live-dot fx-live-dot"></span> لبه کلودفلر فعال</span>
        <span class="chip">Pages + Workers</span>
      </div>
    </header>

    <main class="layout">
      <!-- هیرو -->
      <section class="hero fx-card fx-shine fx-fade" style="--fx-i:1">
        <div class="hero-eyebrow">Real-time proxy control center</div>
        <h1 class="hero-title">
          مرکز کنترل زیرساخت پروکسی <span class="grad">${BRAND_NAME}</span>
          روی لبه سراسری Cloudflare
        </h1>
        <p class="hero-text">
          کاربران دیتابیس D1، نودهای <b>VLESS / Trojan / xhttp / ECH</b>، ساب‌لینک اختصاصی هر کلاینت و صفحه وضعیت هر کاربر
          را از یک پنل زنده مدیریت کنید. خروجی نودها با نام‌گذاری اختصاصی <b>number+${BRAND_NAME}</b> ساخته می‌شود.
        </p>

        <div class="feature-grid">
          ${features
            .map(
              (f, i) => `<div class="feature-card fx-card fx-reveal" style="--fx-i:${i}">
            <div class="feature-icon">${f.icon}</div>
            <div class="feature-title">${f.title}</div>
            <div class="feature-sub">${f.sub}</div>
          </div>`
            )
            .join('')}
        </div>

        <div class="terminal">
          <div><span class="u">root@${BRAND_NAME}:~$</span> status --engine=cloudflare-d1</div>
          <div><span class="ok">✓</span> protocols: VLESS-WS · Trojan-WS · xhttp · ECH</div>
          <div><span class="ok">✓</span> naming: 1+${BRAND_NAME}, 2+${BRAND_NAME} ... N+${BRAND_NAME}</div>
          <div><span class="ok">✓</span> deploy: <span class="fx-typing">pages.dev + workers.dev · zero-secret</span></div>
        </div>
      </section>

      <!-- کارت ورود -->
      <section class="gateway-card fx-card fx-fade" style="--fx-i:2">
        <div class="card-head">
          <div>
            <div class="card-title">ورود به مرکز کنترل</div>
            <div class="card-hint">شناسه مدیر، مسیر سفارشی یا شناسه کاربر</div>
          </div>
          <span class="live-pill"><span class="live-dot fx-live-dot"></span> امن</span>
        </div>

        <p class="desc-text">
          برای ورود به <strong>پنل مدیریت ${BRAND_NAME}</strong> کلید مدیر (${hasCustomPath ? 'مسیر سفارشی D یا UUID' : 'UUID مدیر یا مسیر سفارشی'})
          را وارد کنید، یا با انتخاب حالت «وضعیت کاربر» شناسه کاربری را ببینید و ساب‌لینک اختصاصی خود را بگیرید.
        </p>

        <div class="mode-switch" role="tablist" aria-label="انتخاب مقصد">
          <button type="button" class="mode-btn active" id="modeAdmin" role="tab" aria-selected="true" onclick="setMode('admin')">⚡ پنل مدیریت</button>
          <button type="button" class="mode-btn" id="modeStatus" role="tab" aria-selected="false" onclick="setMode('status')">👁 صفحه وضعیت کاربر</button>
        </div>

        <div class="input-group">
          <label class="input-label" for="uuidInput">شناسه دسترسی:</label>
          <div class="input-wrap">
            <span class="input-icon">🔑</span>
            <input type="text" id="uuidInput" class="token-input" placeholder="351c9981-04b6-4103-aa4b-864aa9c91469" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" autofocus aria-describedby="msgBox">
          </div>
          <p class="field-hint login-hint">
            مدیریت: کلید/مسیر ادمین را وارد کنید (متغیر <code>u</code> در Cloudflare — با <code>npm run cf:bind</code> چاپ می‌شود).
            کاربر: UUID یا توکن کاربر را وارد کنید. اگر دیتابیس وصل نباشد، کلید پیش‌فرض همان UUID نمونهٔ بالا است.
          </p>
        </div>

        <div class="btn-row">
          <button type="button" class="btn btn-primary" id="primaryBtn" onclick="submitAccess()">
            <span id="primaryBtnLabel">⚡ ورود به پنل</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="pasteClipboard()">
            <span>📋 چسباندن شناسه</span>
          </button>
        </div>

        <div id="msgBox" class="msg-box" role="alert"></div>

        <div class="kbd-row">
          <span><span class="kbd">Enter</span> ورود</span>
          <span><span class="kbd">Shift</span> + <span class="kbd">Enter</span> وضعیت</span>
          <span><span class="kbd">Ctrl</span> + <span class="kbd">K</span> پاک‌کردن</span>
        </div>
      </section>
    </main>

    <section class="support-band fx-card fx-reveal" style="--fx-i:0">
      <div class="support-text">
        ❓ راهنمایی، آموزش نصب کلاینت یا رفع مشکل؟ پشتیبانی ${BRAND_NAME} در ${SUPPORT_CHANNEL_LABEL} فعال است:
        <a href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer">${SUPPORT_CHANNEL_URL}</a>
      </div>
      <a class="btn-support" href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer">💬 عضویت در کانال پشتیبانی</a>
    </section>

    <div class="foot-row">
      <span class="chip">Cloudflare Pages</span>
      <span class="chip">Cloudflare Workers</span>
      <span class="chip">D1 Auto-Migration</span>
      <span class="chip">Zero Error 1101</span>
      <span class="chip">${BRAND_UPPER} ${VERSION}</span>
    </div>
  </div>

  <script>
${FX_RUNTIME_JS}
  </script>
  <script>
    var ACCESS_MODE = 'admin';

    function setMode(mode) {
      ACCESS_MODE = mode === 'status' ? 'status' : 'admin';
      var adminBtn = document.getElementById('modeAdmin');
      var statusBtn = document.getElementById('modeStatus');
      var label = document.getElementById('primaryBtnLabel');
      var isAdmin = ACCESS_MODE === 'admin';
      adminBtn.classList.toggle('active', isAdmin);
      statusBtn.classList.toggle('active', !isAdmin);
      adminBtn.setAttribute('aria-selected', isAdmin ? 'true' : 'false');
      statusBtn.setAttribute('aria-selected', isAdmin ? 'false' : 'true');
      label.textContent = isAdmin ? '⚡ ورود به پنل' : '👁 مشاهده وضعیت';
      showMessage('', '');
      var input = document.getElementById('uuidInput');
      input.classList.remove('invalid');
      if (!reduceMotionAllowed()) return;
      var card = document.querySelector('.gateway-card');
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 'fxFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both';
    }

    function reduceMotionAllowed() {
      try { return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { return true; }
    }

    function showMessage(text, type) {
      var box = document.getElementById('msgBox');
      if (!box) return;
      box.className = 'msg-box' + (type ? ' msg-' + type : '');
      box.textContent = text || '';
      if (!text) box.style.display = 'none';
    }

    function cleanToken() {
      return (document.getElementById('uuidInput').value || '').trim().replace(/^\\/+|\\/+$/g, '');
    }

    function getCleanToken() {
      var val = cleanToken();
      var input = document.getElementById('uuidInput');
      if (!val) {
        input.classList.add('invalid');
        showMessage('لطفاً شناسه دسترسی یا UUID را وارد کنید.', 'error');
        input.focus();
        return '';
      }
      input.classList.remove('invalid');
      showMessage('', '');
      return val;
    }

    function navigateTo(token) {
      var primary = document.getElementById('primaryBtn');
      primary.disabled = true;
      showMessage(ACCESS_MODE === 'admin' ? 'در حال باز کردن پنل مدیریت…' : 'در حال باز کردن صفحه وضعیت…', 'info');
      var target = ACCESS_MODE === 'admin'
        ? '/' + encodeURIComponent(token)
        : '/status/' + encodeURIComponent(token);
      window.setTimeout(function () { window.location.href = target; }, 220);
    }

    function submitAccess() {
      var token = getCleanToken();
      if (!token) return;
      navigateTo(token);
    }

    function enterAdmin() { setMode('admin'); submitAccess(); }
    function enterStatus() { setMode('status'); submitAccess(); }

    function pasteClipboard() {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showMessage('مرورگر شما اجازه چسباندن خودکار نمی‌دهد؛ شناسه را دستی وارد کنید.', 'info');
        document.getElementById('uuidInput').focus();
        return;
      }
      navigator.clipboard.readText().then(function (text) {
        var cleaned = String(text || '').trim();
        if (!cleaned) {
          showMessage('کلیپ‌بورد خالی است.', 'info');
          return;
        }
        document.getElementById('uuidInput').value = cleaned;
        document.getElementById('uuidInput').focus();
        showMessage('شناسه از کلیپ‌بورد وارد شد.', 'info');
      }).catch(function () {
        showMessage('دسترسی به کلیپ‌بورد رد شد؛ شناسه را دستی وارد کنید.', 'info');
      });
    }

    document.getElementById('uuidInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (e.shiftKey) { setMode('status'); }
        else { setMode('admin'); }
        submitAccess();
      }
    });
    document.getElementById('uuidInput').addEventListener('input', function () {
      this.classList.remove('invalid');
      showMessage('', '');
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('uuidInput').value = '';
        document.getElementById('uuidInput').focus();
      }
    });
  </script>
</body>
</html>`;
}
