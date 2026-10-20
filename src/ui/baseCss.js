// ============================================================================
// miliconfig v3.1 - لایه پایه مشترک رابط کاربری (موبایل + ویندوز)
// این ماژول در انتهای <style> هر سه صفحه تزریق می‌شود تا:
//   ۱. کنترل‌های بومی مرورگر (select/scrollbar/checkbox) در ویندوز و اندروید تیره شوند.
//   ۲. روی موبایل، فونت ورودی‌ها ۱۶px (ضد زوم خودکار iOS)، هدف لمس ۴۴px و
//      Safe-Area آیفون (ناچ) رعایت شود.
//   ۳. متن‌های طولانی (UUID و لینک ساب) در صفحات باریک سرریز نکنند.
// ============================================================================

export const VIEWPORT_META = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
export const THEME_COLOR_META = '#060b06';

export const BASE_UI_CSS = `
    /* آیکون‌های SVG اختصاصی — همیشه با اندازه ثابت تا چیدمان نشکند */
    svg.ic {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      display: inline-block;
      vertical-align: -3px;
    }
    /* ================= miliconfig base: موبایل + ویندوز ================= */
    html {
      color-scheme: dark;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      scrollbar-color: rgba(163, 230, 53, 0.35) rgba(4, 8, 4, 0.7);
    }
    * { -webkit-tap-highlight-color: transparent; }
    *:focus-visible {
      outline: 2px solid var(--neon);
      outline-offset: 2px;
    }
    /* اسکرول‌بار تیره در کروم/اج ویندوز */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: rgba(4, 8, 4, 0.7); }
    ::-webkit-scrollbar-thumb {
      background: rgba(163, 230, 53, 0.32);
      border: 2px solid transparent;
      background-clip: padding-box;
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(163, 230, 53, 0.5);
      background-clip: padding-box;
    }
    /*
      کنترل‌های بومی مرورگر (منوی کشویی select، اسکرول‌بار، پیکر تاریخ و ...)
      با color-scheme تیره می‌شوند. رنگ/فونت خودِ option را دستی عوض نمی‌کنیم تا
      منوی کشویی روی اندروید/iOS هم بومی و سالم باز شود و متن آن ناپدید نشود.
    */
    button, input, select, textarea, option { color-scheme: dark; }
    input::placeholder, textarea::placeholder { color: rgba(143, 166, 134, 0.75); }
    /* متن‌های طولانی (UUID / لینک ساب) نباید چیدمان را بشکنند */
    .kv-val, .url-text, .uc-uuid, .node-tag, .hero-heading, .sb-brand-title, .clock-time {
      overflow-wrap: anywhere;
    }
    .kv-val, .url-text, .uc-uuid, .uc-stats, .field-box { min-width: 0; }
    /* Safe-Area آیفون برای دکمه شناور */
    .fab-refresh {
      bottom: calc(22px + env(safe-area-inset-bottom, 0px));
      left: calc(22px + env(safe-area-inset-left, 0px));
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    @media (hover: none) {
      /* جلوگیری از گیر کردن حالت hover بعد از لمس روی موبایل */
      .btn-neon:hover, .btn-ghost:hover, .copy-btn:hover, .sb-btn:hover,
      .dl-btn:hover, .fab-refresh:hover, .sb-item:hover {
        transform: none;
      }
    }
    /* ================= miliconfig mobile ================= */
    @media (max-width: 900px) {
      /* فونت ۱۶px ورودی‌ها => جلوگیری از زوم خودکار iOS */
      .mili-input, .mili-select, .mili-textarea, .token-input,
      input[type="text"], input[type="number"], input[type="search"], textarea, select {
        font-size: 16px;
      }
      /* هدف لمس استاندارد ۴۴ پیکسل */
      .btn-neon, .btn-ghost, .copy-btn, .dl-btn, .top-pill, .sb-btn, .menu-toggle, .sb-close {
        min-height: 44px;
      }
      .btn-neon, .btn-ghost { padding: 12px 16px; }
      .copy-btn { padding: 11px 14px; }
      .toast-box, .toast { top: calc(12px + env(safe-area-inset-top, 0px)); max-width: calc(100% - 24px); }
      /* روی صفحه‌های لمسی نیازی به فاصله اضافه فوکوس نیست */
      *:focus-visible { outline-offset: 0; }
    }
`;
