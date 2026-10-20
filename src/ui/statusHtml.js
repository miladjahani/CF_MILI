// ============================================================================
// miliconfig v3.1 - صفحه وضعیت و اشتراک اختصاصی کاربر (ارسالی به کاربر)
// بازطراحی‌شده: حلقه مصرف، شمارنده‌های نرم، جستجوی نود، صفحه‌بندی و پس‌زمینه زنده
// تمام مقادیر کاربر با escapeHtml امن‌سازی می‌شوند (رفع باگ XSS نام کاربری)
// ============================================================================

import { BRAND_NAME, BRAND_UPPER, REGION_MAP, SUPPORT_CHANNEL_LABEL, SUPPORT_CHANNEL_URL } from '../config/defaults.js';
import { LOCATIONS } from '../config/locations.js';
import { SHIELD_LOGO_SVG, FAVICON_DATA_URI, deEmoji } from './icons.js';
import { escapeHtml, formatBytes, safeJsonForScript } from '../core/utils.js';
import { BASE_UI_CSS, THEME_COLOR_META, VIEWPORT_META } from './baseCss.js';
import { FX_CSS, FX_MARKUP, FX_RUNTIME_JS } from './fx.js';

export function renderUserStatusPageHtml(user, nodes = [], originUrl = '') {
  const urlObj = new URL(originUrl || 'https://miliconfig.workers.dev');
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  const rawToken = user.config?.d && String(user.config.d).trim()
    ? String(user.config.d).trim().replace(/^\/+|\/+$/g, '')
    : user.uuid;
  const userToken = String(rawToken || '').replace(/^\/+|\/+$/g, '') || String(user.uuid || '');

  const baseSubUrl = `${baseUrl}/${userToken}/sub`;
  const statusUrl = `${baseUrl}/status/${encodeURIComponent(user.id || userToken)}`;
  const totalNodes = nodes.length;

  const usedBytes = Number(user.usedBytes || 0);
  // مصرف واقعی تفکیک‌شده (از همان اولین اتصال) — با پشتیبانی از داده‌های قدیمی
  const uploadBytes = Math.max(0, Number(user.uploadBytes || 0));
  const downloadBytes = Math.max(0, Number(user.downloadBytes || 0)) || Math.max(0, usedBytes - uploadBytes);
  const lifetimeBytes = Number(user.lifetimeBytes || 0);
  const limitGb = Number(user.dataLimitGb || 0);
  const limitBytes = limitGb > 0 ? limitGb * 1073741824 : 0;
  const usagePercent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;
  const remainingBytes = limitBytes > 0 ? Math.max(0, limitBytes - usedBytes) : 0;

  let expireLabel = 'بدون انقضا';
  let expireDaysLeft = null;
  if (user.expireAt > 0) {
    const diffDays = Math.ceil((user.expireAt - Date.now()) / 86400000);
    expireDaysLeft = diffDays;
    expireLabel = diffDays > 0 ? `${diffDays} روز باقی‌مانده` : 'منقضی شده';
  } else if (user.startOnFirstUse && user.expireDays > 0) {
    expireLabel = `${user.expireDays} روز (شروع با اولین اتصال)`;
  }

  const isActive = Boolean(user.enabled);
  const statusText = isActive
    ? (user.startOnFirstUse && !user.firstConnectedAt ? 'شروع با اولین اتصال' : 'فعال و آنلاین')
    : 'غیرفعال';

  // لوکیشن‌های واقعی: هر کارت یک ساب‌لینک با خروجی ثابت همان لوکیشن می‌سازد
  const locationsList = LOCATIONS.map(loc => ({
    code: loc.code,
    title: `${loc.flag} ${loc.name}`,
    url: `${baseSubUrl}?locs=${loc.code}`
  }));

  const protoCombos = [
    { title: 'اتصال هوشمند (همه نودها × همه پروتکل‌ها)', badge: 'Base64', url: baseSubUrl },
    { title: 'فقط پروتکل VLESS (WebSocket + TLS)', badge: 'VLESS', url: `${baseSubUrl}?proto=vless` },
    { title: 'فقط پروتکل Trojan (WebSocket + TLS)', badge: 'Trojan', url: `${baseSubUrl}?proto=trojan` },
    { title: 'فقط پروتکل xhttp (ضد فیلتر پیشرفته)', badge: 'xhttp', url: `${baseSubUrl}?proto=xhttp` },
    { title: 'فقط نودهای لبه CDN (Multi-Location)', badge: 'Edge', url: `${baseSubUrl}?scope=edge` },
    { title: 'فقط سرور اصلی (بدون CDN)', badge: 'Origin', url: `${baseSubUrl}?scope=origin` },
    { title: 'کانفیگ اختصاصی Clash Meta / Mihomo', badge: 'YAML', url: `${baseSubUrl}?target=clash` },
    { title: 'کانفیگ اختصاصی Sing-box / Hiddify', badge: 'JSON', url: `${baseSubUrl}?target=singbox` },
    { title: 'کانفیگ اختصاصی Surge', badge: 'INI', url: `${baseSubUrl}?target=surge` },
    { title: 'کانفیگ اختصاصی Quantumult X', badge: 'QuanX', url: `${baseSubUrl}?target=quanx` },
    { title: 'کانفیگ اختصاصی Loon', badge: 'Loon', url: `${baseSubUrl}?target=loon` },
    { title: 'متن خام لینک‌ها (Raw Plaintext)', badge: 'RAW', url: `${baseSubUrl}?target=raw` }
  ];

  const scopeOptions = [
    { title: `همه نودهای کاربر (${totalNodes} نود)`, badge: 'پیش‌فرض کاربر', url: baseSubUrl },
    { title: `۱۰ نود اول (1+${BRAND_NAME} تا 10+${BRAND_NAME})`, badge: 'سبک و سریع', url: `${baseSubUrl}?limit=10` },
    { title: 'فقط نودهای لبه CDN', badge: 'Multi-Location', url: `${baseSubUrl}?scope=edge` },
    { title: 'فقط سرور اصلی (بدون CDN)', badge: 'Direct Origin', url: `${baseSubUrl}?scope=origin` }
  ];

  const xrayClients = [
    { name: 'v2rayNG', os: 'Android', badge: 'Base64 (V2Ray)', href: 'https://github.com/2dust/v2rayNG/releases', note: 'پرکاربردترین کلاینت اندروید؛ فرگمنت، sni و vless را کامل پشتیبانی می‌کند.' },
    { name: 'Exclusive', os: 'Android', badge: 'Base64 (V2Ray)', href: 'https://github.com/GFW-knocker/MahsaNG/releases', note: 'کلاینت اندروید؛ از ساب‌لینک استاندارد Base64 استفاده می‌کند.' },
    { name: 'Amnezia VPN', os: 'Android · iOS · دسکتاپ', badge: 'Base64 (V2Ray)', href: 'https://amnezia.org/en/downloads', note: '' },
    { name: 'Streisand', os: 'iOS · macOS', badge: 'Base64 (V2Ray)', href: 'https://apps.apple.com/app/streisand/id6450534064', note: '' },
    { name: 'Shadowrocket', os: 'iOS', badge: 'Base64 (V2Ray)', href: 'https://apps.apple.com/app/shadowrocket/id932747118', note: '' },
    { name: 'V2Box', os: 'Android · iOS', badge: 'Base64 (V2Ray)', href: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690', note: '' },
    { name: 'v2rayN / Nekoray', os: 'Windows · Linux · macOS', badge: 'Base64 (V2Ray)', href: 'https://github.com/2dust/v2rayN/releases', note: '' }
  ];

  const safeNodesJson = safeJsonForScript(nodes);
  const userName = escapeHtml(user.username || BRAND_NAME);

  const copyButton = (value, message, label) =>
    `<button type="button" class="copy-btn" data-copy="${escapeHtml(value)}" data-copy-msg="${escapeHtml(message)}">${label || '📋 کپی'}</button>`;

  const clientRow = (client, idx) => `
        <div class="client-item fx-reveal" style="--fx-i:${Math.min(idx, 6)}">
          <div class="client-top">
            <div class="client-name-row">
              <span class="client-name">${escapeHtml(client.name)}</span>
              <span class="client-os">${escapeHtml(client.os)}</span>
              <span class="tag-green">${escapeHtml(client.badge)}</span>
            </div>
            ${client.href ? `<a class="dl-btn" href="${escapeHtml(client.href)}" target="_blank" rel="noopener">⬇ دانلود کلاینت</a>` : ''}
          </div>
          <div class="url-copy-box">
            ${copyButton(baseSubUrl, `لینک ${client.name} کپی شد`)}
            <div class="url-text">${escapeHtml(baseSubUrl)}</div>
          </div>
          ${client.note ? `<div class="client-note">${escapeHtml(client.note)}</div>` : ''}
        </div>`;

  return deEmoji(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${VIEWPORT_META}">
  <meta name="theme-color" content="${THEME_COLOR_META}">
  <title>وضعیت اشتراک ${userName} — ${BRAND_UPPER}</title>
  <link rel="icon" href="${FAVICON_DATA_URI}">
  <style>
    :root {
      --bg-0: #060c06;
      --card: rgba(14, 25, 14, 0.86);
      --card-inner: rgba(8, 15, 8, 0.9);
      --border: rgba(163, 230, 53, 0.16);
      --border-hi: rgba(181, 255, 77, 0.46);
      --neon: #b5ff4d;
      --neon-dim: rgba(181, 255, 77, 0.13);
      --text: #f3f8f1;
      --muted: #93a88a;
      --danger: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Vazirmatn", Tahoma, sans-serif;
      background: radial-gradient(circle at 20% 0%, rgba(132, 204, 22, 0.16) 0%, transparent 50%), var(--bg-0);
      color: var(--text);
      padding: 16px 14px calc(96px + env(safe-area-inset-bottom, 0px));
      line-height: 1.65;
      overflow-x: hidden;
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ================= کارت هیرو ================= */
    .status-hero {
      background: var(--card);
      border: 1px solid var(--border-hi);
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(14px);
    }
    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .hero-user { display: flex; align-items: center; gap: 12px; }
    .hero-logo { width: 50px; height: 50px; flex-shrink: 0; }
    .hero-logo svg { width: 100%; height: 100%; }
    .hero-name { font-size: 1.16rem; font-weight: 900; overflow-wrap: anywhere; }
    .hero-brand {
      font-size: 0.72rem;
      color: var(--neon);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 13px;
      border-radius: 999px;
      font-size: 0.77rem;
      font-weight: 800;
      background: var(--neon-dim);
      border: 1px solid var(--border-hi);
      color: var(--neon);
    }
    .pill-off {
      background: rgba(248, 113, 113, 0.14);
      border-color: rgba(248, 113, 113, 0.4);
      color: var(--danger);
    }

    /* حلقه مصرف + آمار */
    .hero-body {
      display: grid;
      grid-template-columns: 168px 1fr;
      gap: 18px;
      align-items: center;
    }
    @media (max-width: 560px) {
      .hero-body { grid-template-columns: 1fr; }
    }
    .ring-wrap { display: flex; justify-content: center; }
    .usage-ring {
      width: 158px;
      height: 158px;
      flex-shrink: 0;
    }
    .ring-val { font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1.2; }
    .ring-cap { font-size: 0.7rem; color: var(--muted); }
    .ring-sub { font-size: 0.66rem; color: var(--neon); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .stat-box {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 11px 12px;
    }
    .stat-label { font-size: 0.73rem; color: var(--muted); margin-bottom: 3px; }
    .stat-val { font-size: 0.95rem; font-weight: 800; overflow-wrap: anywhere; }

    .url-copy-box {
      background: #050a05;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 12px;
    }
    .url-text {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.78rem;
      color: #d7e8cf;
      direction: ltr;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
    .copy-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 12px;
      padding: 9px 15px;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 800;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-shrink: 0;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, color 0.3s ease, background 0.3s ease;
    }
    .copy-btn:hover { border-color: var(--neon); color: var(--neon); background: var(--neon-dim); transform: translate3d(0, -2px, 0); }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin: 10px 4px 2px;
      font-size: 0.94rem;
      font-weight: 900;
    }
    .section-head .sub-meta { font-size: 0.75rem; font-weight: 500; color: var(--muted); }

    /* ================= آکاردئون با انیمیشن روان ================= */
    .acc-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      overflow: hidden;
      transition: border-color 0.4s ease, box-shadow 0.4s ease;
    }
    .acc-card.open { border-color: var(--border-hi); box-shadow: 0 12px 34px rgba(0, 0, 0, 0.4); }
    .acc-header {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      font-family: inherit;
      text-align: right;
      transition: background 0.3s ease;
    }
    .acc-header:hover { background: rgba(163, 230, 53, 0.05); }
    .acc-title-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .acc-title { font-size: 0.95rem; font-weight: 900; }
    .acc-count { font-size: 0.76rem; color: var(--muted); }
    .acc-arrow {
      font-size: 0.9rem;
      color: var(--muted);
      transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease;
    }
    .acc-card.open .acc-arrow { transform: rotate(180deg); color: var(--neon); }
    .acc-body {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease, padding 0.42s ease;
      padding: 0 18px;
    }
    .acc-card.open .acc-body {
      opacity: 1;
      padding: 0 18px 18px;
      border-top: 1px solid rgba(163, 230, 53, 0.1);
    }
    .acc-body[hidden] { display: none; }
    .client-desc { font-size: 0.82rem; color: var(--muted); margin: 12px 0 14px; }
    .client-note { font-size: 0.76rem; color: var(--muted); margin-top: 6px; }
    .client-item { padding: 14px 0; border-top: 1px solid rgba(255, 255, 255, 0.06); }
    .client-item:first-of-type { border-top: none; }
    .client-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .client-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .client-name { font-size: 0.96rem; font-weight: 900; color: #fff; overflow-wrap: anywhere; }
    .client-os { font-size: 0.75rem; color: var(--muted); }
    .tag-green {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--neon);
      background: rgba(163, 230, 53, 0.12);
      border: 1px solid rgba(163, 230, 53, 0.34);
    }
    .dl-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      font-size: 0.77rem;
      font-weight: 700;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, color 0.3s ease;
    }
    .dl-btn:hover { border-color: var(--neon); color: var(--neon); transform: translate3d(0, -2px, 0); }

    .loc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(210px, 100%), 1fr)); gap: 10px; margin-top: 12px; }
    .loc-card {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 15px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .loc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .loc-name { font-size: 0.85rem; font-weight: 800; }
    .loc-code {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.7rem;
      color: var(--neon);
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid var(--border-hi);
      border-radius: 999px;
      padding: 1px 8px;
    }

    .search-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .search-input {
      flex: 1 1 190px;
      min-width: 0;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 11px 13px;
      color: var(--text);
      font-family: inherit;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .search-input:focus { border-color: var(--neon); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.12); }
    .node-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 12px;
      border-radius: 13px;
      background: var(--card-inner);
      border: 1px solid var(--border);
      margin-top: 8px;
      transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .node-row:hover { border-color: var(--border-hi); transform: translate3d(0, -2px, 0); }
    .node-tag {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--neon);
      direction: ltr;
      overflow-wrap: anywhere;
    }
    .node-proto { font-size: 0.73rem; color: var(--muted); }
    .empty-note { padding: 16px 4px; color: var(--muted); font-size: 0.84rem; text-align: center; }

    .fab-refresh {
      position: fixed;
      bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      left: calc(20px + env(safe-area-inset-left, 0px));
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: rgba(6, 12, 6, 0.94);
      border: 1px solid var(--border-hi);
      color: var(--text);
      font-size: 1.15rem;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease, border-color 0.3s ease;
    }
    .fab-refresh:hover { color: var(--neon); transform: rotate(120deg); }

    .page-foot {
      position: relative;
      z-index: 1;
      margin-top: 4px;
      padding: 15px 16px;
      border-radius: 18px;
      background: var(--card);
      border: 1px dashed var(--border-hi);
      font-size: 0.82rem;
      color: var(--muted);
      text-align: center;
      overflow-wrap: anywhere;
    }
    .page-foot a { color: var(--neon); font-weight: 800; text-decoration: none; }
    .page-foot a:hover { text-decoration: underline; }

    @media (max-width: 620px) {
      body { padding: 12px 10px calc(92px + env(safe-area-inset-bottom, 0px)); }
      .status-hero { padding: 16px; border-radius: 20px; }
      .acc-header { padding: 14px; }
      .acc-body, .acc-card.open .acc-body { padding-left: 14px; padding-right: 14px; }
      .url-copy-box { flex-wrap: wrap; }
      .url-text { flex: 1 1 100%; white-space: normal; overflow-wrap: anywhere; font-size: 0.73rem; }
      .url-copy-box .copy-btn { flex: 1 1 100%; }
      .node-row { flex-wrap: wrap; }
      .node-row .copy-btn { flex: 1 1 100%; }
      .fab-refresh { width: 48px; height: 48px; font-size: 1.02rem; }
    }
${FX_CSS}
${BASE_UI_CSS}
  </style>
</head>
<body>
  ${FX_MARKUP}

  <div class="container">
    <!-- کارت اصلی وضعیت کاربر -->
    <section class="status-hero fx-card fx-shine fx-fade" style="--fx-i:0">
      <div class="hero-top">
        <div class="hero-user">
          <div class="hero-logo fx-float">${SHIELD_LOGO_SVG}</div>
          <div>
            <div class="hero-name">${userName}</div>
            <div class="hero-brand">${BRAND_UPPER} Subscription Portal</div>
          </div>
        </div>
        <span class="pill ${isActive ? '' : 'pill-off'}">
          <span class="live-dot fx-live-dot" style="background:currentColor;box-shadow:none;width:7px;height:7px;border-radius:50%;"></span>
          ${escapeHtml(statusText)}
        </span>
      </div>

      <div class="hero-body">
        <div class="ring-wrap">
          <div class="usage-ring fx-ring fx-ring-pulse" id="usageRing" style="--fx-p:0">
            <div class="fx-ring-inner">
              <div class="ring-val" id="ringPercent">${limitBytes > 0 ? usagePercent + '%' : '∞'}</div>
              <div class="ring-cap">مصرف سهمیه</div>
              <div class="ring-sub">${limitBytes > 0 ? escapeHtml(formatBytes(remainingBytes)) + ' باقی‌مانده' : 'نامحدود'}</div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box fx-card">
            <div class="stat-label">مصرف فعلی</div>
            <div class="stat-val" id="statUsed">${escapeHtml(formatBytes(usedBytes))}</div>
            <div class="stat-label" style="margin-top:6px;">↑ آپلود ${escapeHtml(formatBytes(uploadBytes))}</div>
            <div class="stat-label">↓ دانلود ${escapeHtml(formatBytes(downloadBytes))}</div>
          </div>
          <div class="stat-box fx-card">
            <div class="stat-label">سهمیه حجم</div>
            <div class="stat-val">${limitGb > 0 ? `${escapeHtml(String(limitGb))} GB` : '∞ نامحدود'}</div>
          </div>
          <div class="stat-box fx-card">
            <div class="stat-label">تعداد نود در ساب</div>
            <div class="stat-val" id="statNodes" data-count-to="${totalNodes}">0</div>
          </div>
          <div class="stat-box fx-card">
            <div class="stat-label">وضعیت انقضا</div>
            <div class="stat-val">${escapeHtml(expireLabel)}</div>
          </div>
          <div class="stat-box fx-card">
            <div class="stat-label">عمر کل مصرف</div>
            <div class="stat-val" id="statLifetime">${escapeHtml(formatBytes(lifetimeBytes))}</div>
          </div>
          <div class="stat-box fx-card">
            <div class="stat-label">درخواست‌های ثبت‌شده</div>
            <div class="stat-val" id="statReqs" data-count-to="${Number(user.requestCount || 0)}">0</div>
          </div>
        </div>
      </div>

      <div class="stat-label" style="margin-top:14px;">لینک شخصی صفحه وضعیت شما:</div>
      <div class="url-copy-box">
        ${copyButton(statusUrl, 'لینک صفحه وضعیت کپی شد', '🔗 کپی لینک وضعیت')}
        <div class="url-text">${escapeHtml(statusUrl)}</div>
      </div>
    </section>

    <!-- شروع سریع -->
    <div class="section-head">
      <span>🚀 شروع سریع</span>
      <span class="sub-meta">یک لینک برای همه کلاینت‌ها</span>
    </div>
    <div class="acc-card open fx-card fx-reveal" id="accQuickStart" style="--fx-i:0">
      <button type="button" class="acc-header" onclick="toggleAcc('accQuickStart')" aria-expanded="true">
        <div class="acc-title-wrap">
          <span class="acc-title">اتصال هوشمند (ساب‌لینک اصلی)</span>
          <span class="acc-count">1 لینک</span>
          <span class="tag-green">پیشنهادی</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">سریع‌ترین نود بر اساس پینگ واقعی، مناسب هر کلاینتی؛ کافی است همین لینک را در کلاینت وارد کنید.</p>
        <div class="url-copy-box">
          ${copyButton(baseSubUrl, 'ساب‌لینک هوشمند کپی شد')}
          <div class="url-text">${escapeHtml(baseSubUrl)}</div>
        </div>
        <div class="search-row">
          <button type="button" class="copy-btn" data-copy="${escapeHtml(baseSubUrl + '?target=clash')}" data-copy-msg="لینک Clash کپی شد">🟣 Clash</button>
          <button type="button" class="copy-btn" data-copy="${escapeHtml(baseSubUrl + '?target=singbox')}" data-copy-msg="لینک Sing-box کپی شد">🟢 Sing-box</button>
          <button type="button" class="copy-btn" data-copy="${escapeHtml(baseSubUrl + '?target=raw')}" data-copy-msg="لینک متن خام کپی شد">📄 متن خام</button>
        </div>
      </div>
    </div>

    <!-- محدوده نودها -->
    <div class="section-head">
      <span>🎯 محدوده نودها</span>
      <span class="sub-meta">${totalNodes} نود با فرمت number+${BRAND_NAME}</span>
    </div>
    <div class="acc-card fx-card fx-reveal" id="accScope" style="--fx-i:1">
      <button type="button" class="acc-header" onclick="toggleAcc('accScope')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">فقط بخشی از نودها را می‌خواهید؟</span>
          <span class="acc-count">${scopeOptions.length} گزینه · ${totalNodes} نود در کل</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">با پارامترهای لینک، تعداد نودها یا محدوده خروجی را دقیقاً همان‌طور که می‌خواهید بگیرید:</p>
        ${scopeOptions
          .map(
            (option, i) => `
        <div class="client-item fx-reveal" style="--fx-i:${i}">
          <div class="client-top">
            <span class="client-name">${escapeHtml(option.title)}</span>
            <span class="tag-green">${escapeHtml(option.badge)}</span>
          </div>
          <div class="url-copy-box">
            ${copyButton(option.url, 'کپی شد')}
            <div class="url-text">${escapeHtml(option.url)}</div>
          </div>
        </div>`
          )
          .join('')}
      </div>
    </div>

    <!-- لوکیشن‌ها -->
    <div class="section-head">
      <span>🌍 لوکیشن‌ها</span>
      <span class="sub-meta">هر کشور، یک ساب‌لینک جدا</span>
    </div>
    <div class="acc-card fx-card fx-reveal" id="accLocations" style="--fx-i:2">
      <button type="button" class="acc-header" onclick="toggleAcc('accLocations')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">ساب‌لینک لوکیشن‌محور</span>
          <span class="acc-count">${locationsList.length} لوکیشن</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">خروجی ثابت هر لوکیشن روی همان آی‌پی تأییدشده تنظیم می‌شود (مناسب انتخاب سریع‌ترین مسیر و عبور از تحریم):</p>
        <div class="loc-grid">
          ${locationsList
            .map(
              (loc, i) => `
          <div class="loc-card fx-card fx-reveal" style="--fx-i:${Math.min(i, 6)}">
            <div class="loc-top">
              <span class="loc-name">${escapeHtml(loc.title)}</span>
              <span class="loc-code">${escapeHtml(loc.code)}</span>
            </div>
            ${copyButton(loc.url, `لینک لوکیشن ${loc.code} کپی شد`, '📋 کپی لینک')}
          </div>`
            )
            .join('')}
        </div>
      </div>
    </div>

    <!-- خانواده ۱: Xray / Base64 -->
    <div class="section-head">
      <span>🛡️ ساب‌لینک اختصاصی هر کلاینت</span>
      <span class="sub-meta">16 کلاینت در 5 خانواده</span>
    </div>

    <div class="acc-card open fx-card fx-reveal" id="accXray" style="--fx-i:3">
      <button type="button" class="acc-header" onclick="toggleAcc('accXray')" aria-expanded="true">
        <div class="acc-title-wrap">
          <span class="acc-title">خانواده Xray / متن ساده — Base64</span>
          <span class="acc-count">${xrayClients.length} کلاینت</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">v2rayNG، Exclusive، Amnezia، Streisand، Shadowrocket، V2Box و FoXray ساب‌لینک Base64 (یا متن ساده) می‌خوانند.</p>
        ${xrayClients.map((client, idx) => clientRow(client, idx)).join('')}
      </div>
    </div>

    <!-- خانواده ۲: sing-box -->
    <div class="acc-card fx-card fx-reveal" id="accSingbox" style="--fx-i:4">
      <button type="button" class="acc-header" onclick="toggleAcc('accSingbox')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">خانواده sing-box — JSON</span>
          <span class="acc-count">5 کلاینت</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">مناسب Hiddify، Sing-box (نسخه 1.12 به بالا)، Karing، NekoBox و Exclave:</p>
        <div class="client-item">
          <div class="client-top">
            <div class="client-name-row">
              <span class="client-name">Hiddify / Sing-box</span>
              <span class="client-os">همه پلتفرم‌ها</span>
              <span class="tag-green">JSON (Sing-box)</span>
            </div>
            <a class="dl-btn" href="https://github.com/hiddify/hiddify-app/releases" target="_blank" rel="noopener">⬇ دانلود کلاینت</a>
          </div>
          <div class="url-copy-box">
            ${copyButton(`${baseSubUrl}?target=singbox`, 'لینک Sing-box کپی شد')}
            <div class="url-text">${escapeHtml(`${baseSubUrl}?target=singbox`)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- خانواده ۳: Clash / Mihomo -->
    <div class="acc-card fx-card fx-reveal" id="accClash" style="--fx-i:5">
      <button type="button" class="acc-header" onclick="toggleAcc('accClash')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">خانواده Clash / Mihomo — فقط YAML</span>
          <span class="acc-count">2 کلاینت</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <p class="client-desc">مناسب Clash Meta for Android (CMFA)، Clash Verge Rev، FlClash و Stash:</p>
        <div class="client-item">
          <div class="client-top">
            <div class="client-name-row">
              <span class="client-name">Clash Meta / Verge / FlClash</span>
              <span class="client-os">Android · Windows · macOS</span>
              <span class="tag-green">YAML (Mihomo)</span>
            </div>
            <a class="dl-btn" href="https://github.com/MetaCubeX/ClashMetaForAndroid/releases" target="_blank" rel="noopener">⬇ دانلود کلاینت</a>
          </div>
          <div class="url-copy-box">
            ${copyButton(`${baseSubUrl}?target=clash`, 'لینک Clash کپی شد')}
            <div class="url-text">${escapeHtml(`${baseSubUrl}?target=clash`)}</div>
          </div>
        </div>
        ${
          user.config?.jk === 'yes'
            ? `<div class="client-item">
          <div class="client-top">
            <div class="client-name-row">
              <span class="client-name">CLASH زنجیره اینترنت خانگی</span>
              <span class="client-os">Mihomo 1.19.25+</span>
              <span class="tag-green">Residential IP</span>
            </div>
          </div>
          <div class="url-copy-box">
            ${copyButton(`${baseSubUrl}?target=vg`, 'لینک CLASH خانگی کپی شد')}
            <div class="url-text">${escapeHtml(`${baseSubUrl}?target=vg`)}</div>
          </div>
        </div>`
            : ''
        }
      </div>
    </div>

    <!-- خانواده ۴: هسته‌ها و ابزارها -->
    <div class="acc-card fx-card fx-reveal" id="accTools" style="--fx-i:6">
      <button type="button" class="acc-header" onclick="toggleAcc('accTools')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">هسته‌ها و ابزارها (Surge / QuanX / Loon)</span>
          <span class="acc-count">3 کلاینت</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        ${[
          { name: 'Surge', badge: 'INI', target: 'surge' },
          { name: 'Quantumult X', badge: 'QuanX', target: 'quanx' },
          { name: 'Loon', badge: 'Loon', target: 'loon' }
        ]
          .map(
            (tool, i) => `
        <div class="client-item fx-reveal" style="--fx-i:${i}">
          <div class="client-top"><span class="client-name">${escapeHtml(tool.name)}</span><span class="tag-green">${escapeHtml(tool.badge)}</span></div>
          <div class="url-copy-box">
            ${copyButton(`${baseSubUrl}?target=${tool.target}`, `لینک ${tool.name} کپی شد`)}
            <div class="url-text">${escapeHtml(`${baseSubUrl}?target=${tool.target}`)}</div>
          </div>
        </div>`
          )
          .join('')}
      </div>
    </div>

    <!-- ساب‌لینک به تفکیک پروتکل -->
    <div class="section-head">
      <span>🔗 ساب‌لینک به تفکیک پروتکل و ترنسپورت</span>
      <span class="sub-meta">${protoCombos.length} ترکیب</span>
    </div>
    <div class="acc-card fx-card fx-reveal" id="accCombos" style="--fx-i:7">
      <button type="button" class="acc-header" onclick="toggleAcc('accCombos')" aria-expanded="false">
        <div class="acc-title-wrap">
          <span class="acc-title">لیست ترکیب‌های نود × پروتکل</span>
          <span class="acc-count">${protoCombos.length} لینک</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        ${protoCombos
          .map(
            (combo, i) => `
        <div class="client-item fx-reveal" style="--fx-i:${Math.min(i, 7)}">
          <div class="client-top">
            <span class="client-name">${escapeHtml(combo.title)}</span>
            <span class="tag-green">${escapeHtml(combo.badge)}</span>
          </div>
          <div class="url-copy-box">
            ${copyButton(combo.url, 'کپی شد')}
            <div class="url-text">${escapeHtml(combo.url)}</div>
          </div>
        </div>`
          )
          .join('')}
      </div>
    </div>

    <!-- لیست کانفیگ‌های خروجی -->
    <div class="section-head">
      <span>⚡ نودها</span>
      <span class="sub-meta">${totalNodes} نود · نام‌گذاری number+${BRAND_NAME}</span>
    </div>
    <div class="acc-card open fx-card fx-reveal" id="accNodes" style="--fx-i:8">
      <button type="button" class="acc-header" onclick="toggleAcc('accNodes')" aria-expanded="true">
        <div class="acc-title-wrap">
          <span class="acc-title">لیست کانفیگ‌های خروجی (1+${BRAND_NAME} تا ${totalNodes}+${BRAND_NAME})</span>
          <span class="acc-count">${totalNodes} کانفیگ</span>
        </div>
        <span class="acc-arrow">⌄</span>
      </button>
      <div class="acc-body">
        <div class="search-row">
          <input type="search" id="nodeSearch" class="search-input" placeholder="🔍 جستجوی نام یا پروتکل نود…" autocomplete="off" oninput="renderNodes()">
          <button type="button" class="copy-btn" id="copyAllBtn" style="flex:0 0 auto;">📋 کپی همه (${totalNodes})</button>
        </div>
        <div id="nodesContainer"></div>
        <div class="search-row" id="nodesMoreRow" hidden>
          <button type="button" class="copy-btn" style="flex:1 1 100%;" onclick="showMoreNodes()">نمایش نودهای بیشتر</button>
        </div>
        <div class="empty-note" id="nodesEmpty" hidden>نودی با این جستجو پیدا نشد.</div>
      </div>
    </div>
  </div>

  <div class="page-foot fx-reveal">
    ❓ سؤال یا مشکلی دارید؟ پشتیبانی ${BRAND_NAME} در ${SUPPORT_CHANNEL_LABEL} پاسخگوی شماست:
    <a href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer">${SUPPORT_CHANNEL_URL}</a>
  </div>

  <button type="button" class="fab-refresh" onclick="window.location.reload()" title="بروزرسانی وضعیت" aria-label="بروزرسانی وضعیت">⇄</button>

  <script>
${FX_RUNTIME_JS}
  </script>
  <script>
    var ALL_NODES = ${safeNodesJson};
    var NODE_PAGE_SIZE = 30;
    var NODES_SHOWN = NODE_PAGE_SIZE;

    function esc(v) {
      return window.MiliFx ? MiliFx.esc(v) : String(v == null ? '' : v);
    }

    function showToast(msg) {
      if (window.MiliFx) MiliFx.toast(msg);
    }

    function copyText(text, msg) {
      if (window.MiliFx) MiliFx.copy(text, msg);
    }

    function copyAllNodes() {
      copyText(ALL_NODES.join('\\n'), 'همه کانفیگ‌ها کپی شدند');
    }

    function toggleAcc(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var isOpen = el.classList.contains('open');
      setAccOpen(el, !isOpen);
    }

    function setAccOpen(el, open) {
      var body = el.querySelector('.acc-body');
      var header = el.querySelector('.acc-header');
      if (!body) return;
      if (open) {
        el.classList.add('open');
        body.hidden = false;
        body.style.maxHeight = body.scrollHeight + 40 + 'px';
        window.setTimeout(function () {
          if (el.classList.contains('open')) body.style.maxHeight = 'none';
        }, 560);
      } else {
        if (body.style.maxHeight === 'none') body.style.maxHeight = body.scrollHeight + 'px';
        void body.offsetHeight;
        el.classList.remove('open');
        body.style.maxHeight = '0px';
        body.hidden = true;
      }
      if (header) header.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (window.MiliFx && open) MiliFx.reveal(el);
    }

    function initAccordions() {
      document.querySelectorAll('.acc-card').forEach(function (el) {
        var body = el.querySelector('.acc-body');
        if (!body) return;
        if (el.classList.contains('open')) {
          body.hidden = false;
          body.style.maxHeight = 'none';
        } else {
          body.hidden = true;
          body.style.maxHeight = '0px';
        }
      });
    }

    function nodeLabel(link, index) {
      var hashIdx = link.indexOf('#');
      var name = hashIdx > -1 ? decodeURIComponent(link.substring(hashIdx + 1)) : ((index + 1) + '+${BRAND_NAME}');
      var proto = String(link.split('://')[0] || '').toUpperCase();
      return { name: name, proto: proto || 'VLINK' };
    }

    function filteredNodes() {
      var query = '';
      var input = document.getElementById('nodeSearch');
      if (input) query = String(input.value || '').trim().toLowerCase();
      var out = [];
      for (var i = 0; i < ALL_NODES.length; i++) {
        var meta = nodeLabel(ALL_NODES[i], i);
        if (query && meta.name.toLowerCase().indexOf(query) === -1 && meta.proto.toLowerCase().indexOf(query) === -1) continue;
        out.push({ link: ALL_NODES[i], index: i, name: meta.name, proto: meta.proto });
      }
      return out;
    }

    function renderNodes() {
      var container = document.getElementById('nodesContainer');
      if (!container) return;
      var list = filteredNodes();
      var slice = list.slice(0, NODES_SHOWN);
      var empty = document.getElementById('nodesEmpty');
      var moreRow = document.getElementById('nodesMoreRow');
      var copyAllBtn = document.getElementById('copyAllBtn');

      container.innerHTML = slice
        .map(function (item) {
          return '<div class="node-row">' +
            '<div><div class="node-tag">' + esc(item.name) + '</div><div class="node-proto">' + esc(item.proto) + ' · Cloudflare Edge</div></div>' +
            '<button type="button" class="copy-btn" data-copy="' + esc(item.link) + '" data-copy-msg="کانفیگ ' + esc(item.name) + ' کپی شد">📋 کپی کانفیگ</button>' +
            '</div>';
        })
        .join('');

      if (empty) empty.hidden = list.length !== 0;
      if (moreRow) moreRow.hidden = list.length <= NODES_SHOWN;
      if (copyAllBtn) copyAllBtn.textContent = '📋 کپی همه (' + list.length + ')';
      if (window.MiliFx) MiliFx.reveal(container);
    }

    function showMoreNodes() {
      NODES_SHOWN += NODE_PAGE_SIZE;
      renderNodes();
    }

    // کپی با واگذاری رویداد (بدون inline onclick و بدون خطای کوتیشن در لینک‌ها)
    document.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest ? event.target.closest('[data-copy]') : null;
      if (!btn) return;
      event.preventDefault();
      copyText(btn.getAttribute('data-copy'), btn.getAttribute('data-copy-msg') || 'کپی شد');
    });
    document.getElementById('copyAllBtn').addEventListener('click', copyAllNodes);

    initAccordions();
    renderNodes();

    // شمارنده‌های نرم و حلقه مصرف
    if (window.MiliFx) {
      MiliFx.ring(document.getElementById('usageRing'), ${limitBytes > 0 ? usagePercent : 100});
      var usedEl = document.getElementById('statUsed');
      if (usedEl) MiliFx.countUp(usedEl, ${usedBytes}, function (v) { return formatBytesRuntime(v); });
      var lifeEl = document.getElementById('statLifetime');
      if (lifeEl) MiliFx.countUp(lifeEl, ${lifetimeBytes}, function (v) { return formatBytesRuntime(v); });
      document.querySelectorAll('[data-count-to]').forEach(function (el) {
        MiliFx.countUp(el, Number(el.getAttribute('data-count-to')) || 0, function (v) { return String(Math.round(v)); });
      });
      MiliFx.reveal(document);
    }

    function formatBytesRuntime(bytes) {
      var b = Number(bytes) || 0;
      if (b <= 0) return '0 B';
      var units = ['B', 'KB', 'MB', 'GB', 'TB'];
      var i = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
      var value = b / Math.pow(1024, i);
      return (value >= 100 || i === 0 ? Math.round(value) : value.toFixed(2)) + ' ' + units[i];
    }

    // اندازه‌گیری مجدد ارتفاع آکاردئون‌های باز هنگام تغییر اندازه صفحه
    window.addEventListener('resize', function () {
      document.querySelectorAll('.acc-card.open .acc-body').forEach(function (body) {
        body.style.maxHeight = 'none';
      });
    });
  </script>
</body>
</html>`);
}
