// ============================================================================
// miliconfig v3.1 - لایه مشترک جلوه‌های بصری (FX) برای هر سه صفحه رابط کاربری
// ----------------------------------------------------------------------------
// این ماژول سه چیز را به همه صفحات تزریق می‌کند:
//   ۱. FX_CSS      : استایل‌های انیمیشن (پس‌زمینه زنده، ورود نرم، هاور، مودال، توست، اسکلتون)
//   ۲. FX_MARKUP   : لایه پس‌زمینه (اورورا + گرید متحرک + بوم ذرات + اسکن‌لاین + وینیت)
//   ۳. FX_RUNTIME_JS: موتور انیمیشن (Canvas ذرات، شمارنده‌ها، Reveal، Ripple، توست، کپی)
// همه جلوه‌ها به prefers-reduced-motion احترام می‌گذارند و روی موبایل سبک‌تر اجرا می‌شوند.
// ============================================================================

export const FX_CSS = `
    /* ================= miliconfig FX: پس‌زمینه زنده و انیمیشن‌ها ================= */
    .fx-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
      contain: strict;
      background: transparent;
    }
    .fx-aurora {
      position: absolute;
      inset: -18% -12%;
      filter: blur(58px);
      opacity: 0.62;
    }
    .fx-blob {
      position: absolute;
      border-radius: 50%;
      will-change: transform, opacity;
    }
    .fx-blob-1 {
      width: 46vmax;
      height: 46vmax;
      top: -14vmax;
      right: -10vmax;
      background: radial-gradient(circle, rgba(163, 230, 53, 0.5) 0%, rgba(132, 204, 22, 0.14) 48%, transparent 70%);
      animation: fxDriftA 26s cubic-bezier(0.42, 0, 0.58, 1) infinite alternate;
    }
    .fx-blob-2 {
      width: 40vmax;
      height: 40vmax;
      bottom: -16vmax;
      left: -12vmax;
      background: radial-gradient(circle, rgba(34, 197, 94, 0.42) 0%, rgba(21, 128, 61, 0.12) 50%, transparent 72%);
      animation: fxDriftB 32s cubic-bezier(0.42, 0, 0.58, 1) infinite alternate;
    }
    .fx-blob-3 {
      width: 30vmax;
      height: 30vmax;
      top: 42%;
      left: 46%;
      background: radial-gradient(circle, rgba(181, 255, 77, 0.32) 0%, transparent 68%);
      animation: fxDriftC 38s cubic-bezier(0.42, 0, 0.58, 1) infinite alternate;
    }
    @keyframes fxDriftA {
      0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.9; }
      50%  { transform: translate3d(-6vmax, 4vmax, 0) scale(1.12); opacity: 0.7; }
      100% { transform: translate3d(4vmax, -3vmax, 0) scale(0.96); opacity: 0.85; }
    }
    @keyframes fxDriftB {
      0%   { transform: translate3d(0, 0, 0) scale(1.04); opacity: 0.8; }
      50%  { transform: translate3d(7vmax, -5vmax, 0) scale(0.94); opacity: 0.95; }
      100% { transform: translate3d(-4vmax, 3vmax, 0) scale(1.1); opacity: 0.72; }
    }
    @keyframes fxDriftC {
      0%   { transform: translate3d(-6vmax, 2vmax, 0) scale(0.9); opacity: 0.55; }
      100% { transform: translate3d(6vmax, -4vmax, 0) scale(1.16); opacity: 0.8; }
    }
    .fx-grid {
      position: absolute;
      inset: -60px;
      background-image:
        linear-gradient(rgba(163, 230, 53, 0.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(163, 230, 53, 0.055) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: radial-gradient(circle at 50% 34%, #000 0%, rgba(0, 0, 0, 0.55) 46%, transparent 78%);
      -webkit-mask-image: radial-gradient(circle at 50% 34%, #000 0%, rgba(0, 0, 0, 0.55) 46%, transparent 78%);
      animation: fxGridPan 34s linear infinite;
    }
    @keyframes fxGridPan {
      0%   { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(46px, 46px, 0); }
    }
    .fx-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0.9;
    }
    .fx-spot {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        520px circle at var(--fx-mx, 50%) var(--fx-my, 20%),
        rgba(181, 255, 77, 0.09),
        rgba(132, 204, 22, 0.035) 42%,
        transparent 66%
      );
      transition: opacity 0.5s ease;
    }
    .fx-scan {
      position: absolute;
      left: 0;
      right: 0;
      height: 38vh;
      background: linear-gradient(180deg, transparent, rgba(181, 255, 77, 0.055), transparent);
      animation: fxScan 9.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes fxScan {
      0%   { transform: translate3d(0, -42vh, 0); opacity: 0; }
      12%  { opacity: 1; }
      88%  { opacity: 1; }
      100% { transform: translate3d(0, 104vh, 0); opacity: 0; }
    }
    .fx-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, transparent 42%, rgba(0, 0, 0, 0.55) 100%);
    }

    /* نوار پیشرفت اسکرول */
    .fx-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      z-index: 90;
      background: transparent;
      pointer-events: none;
    }
    .fx-progress-bar > i {
      display: block;
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, rgba(132, 204, 22, 0.6), #b5ff4d 60%, #eaffb0);
      box-shadow: 0 0 12px rgba(181, 255, 77, 0.6);
      transition: width 0.12s linear;
    }

    /* ================= ورود نرم عناصر (Reveal) ================= */
    .fx-reveal {
      opacity: 0;
      transform: translate3d(0, 16px, 0) scale(0.995);
      transition:
        opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
      transition-delay: calc(var(--fx-i, 0) * 55ms);
      will-change: opacity, transform;
    }
    .fx-reveal.fx-in {
      opacity: 1;
      transform: none;
    }
    .fx-fade {
      animation: fxFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-delay: calc(var(--fx-i, 0) * 60ms);
    }
    @keyframes fxFadeUp {
      from { opacity: 0; transform: translate3d(0, 18px, 0); }
      to   { opacity: 1; transform: none; }
    }

    /* ================= کارت‌ها: هاور نرم و درخشش ================= */
    .fx-card {
      position: relative;
      transition:
        transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        border-color 0.42s ease,
        box-shadow 0.42s ease,
        background-color 0.42s ease;
    }
    .fx-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        340px circle at var(--fx-cx, 50%) var(--fx-cy, 0%),
        rgba(181, 255, 77, 0.11),
        transparent 62%
      );
      opacity: 0;
      transition: opacity 0.45s ease;
      pointer-events: none;
    }
    .fx-card:hover { transform: translate3d(0, -4px, 0); }
    .fx-card:hover::after { opacity: 1; }
    .fx-card:active { transform: translate3d(0, -1px, 0) scale(0.995); }

    /* خط نور بالای کارت‌ها */
    .fx-shine {
      position: relative;
      overflow: hidden;
    }
    .fx-shine::before {
      content: "";
      position: absolute;
      top: 0;
      left: -40%;
      width: 180%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(181, 255, 77, 0.75), transparent);
      opacity: 0.55;
      animation: fxShine 5.5s ease-in-out infinite;
    }
    @keyframes fxShine {
      0%, 100% { transform: translate3d(-22%, 0, 0); opacity: 0.25; }
      50%      { transform: translate3d(22%, 0, 0); opacity: 0.8; }
    }

    /* ================= دکمه‌ها: ریپل + درخشش ================= */
    .fx-ripple {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }
    .fx-ripple > .fx-ripple-ink {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      background: radial-gradient(circle, rgba(181, 255, 77, 0.45), transparent 70%);
      animation: fxRipple 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      pointer-events: none;
      z-index: 0;
    }
    @keyframes fxRipple {
      to { transform: scale(2.6); opacity: 0; }
    }

    /* ================= توست با انیمیشن روان ================= */
    .fx-toast-host {
      position: fixed;
      top: calc(14px + env(safe-area-inset-top, 0px));
      left: 50%;
      transform: translateX(-50%);
      z-index: 999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: min(92vw, 460px);
      pointer-events: none;
    }
    .fx-toast {
      width: 100%;
      text-align: center;
      padding: 11px 18px;
      border-radius: 999px;
      font-size: 0.86rem;
      font-weight: 800;
      background: rgba(12, 24, 12, 0.94);
      border: 1px solid rgba(181, 255, 77, 0.5);
      color: #d9ff9b;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.66), 0 0 20px rgba(163, 230, 53, 0.14);
      backdrop-filter: blur(12px);
      animation: fxToastIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .fx-toast.fx-toast-out { animation: fxToastOut 0.34s ease both; }
    .fx-toast.fx-toast-error {
      border-color: rgba(248, 113, 113, 0.6);
      color: #ffc9c9;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.66), 0 0 20px rgba(248, 113, 113, 0.16);
    }
    .fx-toast.fx-toast-info {
      border-color: rgba(163, 230, 53, 0.4);
      color: #e6f7d2;
    }
    @keyframes fxToastIn {
      from { opacity: 0; transform: translate3d(0, -18px, 0) scale(0.96); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes fxToastOut {
      from { opacity: 1; transform: none; }
      to   { opacity: 0; transform: translate3d(0, -12px, 0) scale(0.97); }
    }

    /* ================= اسکلتون بارگذاری ================= */
    .fx-skeleton {
      position: relative;
      overflow: hidden;
      background: rgba(163, 230, 53, 0.06);
      border-radius: 12px;
      min-height: 52px;
    }
    .fx-skeleton::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(181, 255, 77, 0.14), transparent);
      animation: fxSkel 1.25s linear infinite;
    }
    @keyframes fxSkel {
      from { transform: translate3d(-100%, 0, 0); }
      to   { transform: translate3d(100%, 0, 0); }
    }

    /* ================= مودال نرم ================= */
    .fx-modal-anim {
      transition: opacity 0.3s ease;
    }
    .fx-modal-anim > * {
      transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease;
    }
    .fx-modal-anim.open > * {
      transform: none;
      opacity: 1;
    }

    /* ================= حلقه مصرف (Usage Ring) ================= */
    .fx-ring {
      --fx-p: 0;
      position: relative;
      border-radius: 50%;
      background:
        conic-gradient(
          from -90deg,
          #b5ff4d 0turn,
          #84cc16 calc(var(--fx-p) * 1turn),
          rgba(163, 230, 53, 0.14) calc(var(--fx-p) * 1turn),
          rgba(163, 230, 53, 0.14) 1turn
        );
      transition: none;
    }
    .fx-ring::before {
      content: "";
      position: absolute;
      inset: 9px;
      border-radius: 50%;
      background: #080f08;
      border: 1px solid rgba(163, 230, 53, 0.16);
    }
    .fx-ring > .fx-ring-inner {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      text-align: center;
      z-index: 1;
    }
    .fx-ring-pulse {
      animation: fxRingPulse 3.6s ease-in-out infinite;
    }
    @keyframes fxRingPulse {
      0%, 100% { filter: drop-shadow(0 0 6px rgba(181, 255, 77, 0.28)); }
      50%      { filter: drop-shadow(0 0 18px rgba(181, 255, 77, 0.55)); }
    }

    /* ================= تایپ ترمینال دکوراتیو ================= */
    .fx-caret::after {
      content: "▌";
      color: #b5ff4d;
      animation: fxCaret 1.05s steps(2, start) infinite;
    }
    @keyframes fxCaret {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    .fx-typing {
      display: inline-block;
      overflow: hidden;
      white-space: nowrap;
      vertical-align: bottom;
      max-width: 100%;
      animation: fxTyping 3.6s steps(46, end) infinite alternate;
    }
    @keyframes fxTyping {
      from { width: 0; }
      to   { width: 100%; }
    }

    /* ================= برچسب‌های زنده (نقطه تپنده) ================= */
    .fx-live-dot {
      animation: fxLive 1.9s ease-in-out infinite;
    }
    @keyframes fxLive {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.45); opacity: 0.55; }
    }
    .fx-float { animation: fxFloat 6.5s ease-in-out infinite; }
    @keyframes fxFloat {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50%      { transform: translate3d(0, -7px, 0); }
    }
    .fx-spin-slow { animation: fxSpin 22s linear infinite; }
    @keyframes fxSpin { to { transform: rotate(360deg); } }

    /* ================= دکمه روشن/خاموش کردن جلوه‌ها (FX) ================= */
    .fx-power {
      position: fixed;
      z-index: 90;
      top: calc(12px + env(safe-area-inset-top, 0px));
      left: calc(12px + env(safe-area-inset-left, 0px));
      width: 44px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      border: 1px solid rgba(163, 230, 53, 0.28);
      background: rgba(9, 16, 9, 0.72);
      -webkit-backdrop-filter: blur(14px) saturate(150%);
      backdrop-filter: blur(14px) saturate(150%);
      color: #d9f99d;
      font-size: 17px;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease, background 0.28s ease;
      -webkit-user-select: none;
      user-select: none;
    }
    .fx-power:active { transform: scale(0.92); }
    .fx-power.fx-power-off {
      opacity: 0.55;
      border-color: rgba(148, 163, 148, 0.28);
      color: #9db09d;
      background: rgba(9, 16, 9, 0.55);
    }
    /* خاموش کردن کامل جلوه‌ها: پس‌زمینه زنده، نوار پیشرفت و انیمیشن ورود حذف می‌شوند */
    html.fx-off .fx-bg,
    html.fx-off .fx-progress-bar,
    html.fx-off .fx-shine::before { display: none !important; }
    html.fx-off .fx-reveal { opacity: 1 !important; transform: none !important; }
    html.fx-off .fx-live-dot,
    html.fx-off .fx-float,
    html.fx-off .fx-spin-slow { animation: none !important; }

    /* احترام کامل به تنظیم کاهش حرکت کاربر */
    @media (prefers-reduced-motion: reduce) {
      .fx-blob, .fx-grid, .fx-scan, .fx-shine::before, .fx-typing,
      .fx-live-dot, .fx-float, .fx-spin-slow, .fx-ring-pulse {
        animation: none !important;
      }
      .fx-reveal { opacity: 1 !important; transform: none !important; }
      .fx-canvas { display: none; }
    }
    /* روی موبایل جلوه‌های سنگین سبک‌تر می‌شوند */
    @media (max-width: 760px) {
      .fx-aurora { filter: blur(42px); opacity: 0.5; }
      .fx-grid { background-size: 34px 34px; }
      .fx-scan { display: none; }
    }
`;

export const FX_MARKUP = `<div class="fx-bg" aria-hidden="true">
    <div class="fx-aurora">
      <span class="fx-blob fx-blob-1"></span>
      <span class="fx-blob fx-blob-2"></span>
      <span class="fx-blob fx-blob-3"></span>
    </div>
    <canvas class="fx-canvas" id="fxCanvas"></canvas>
    <div class="fx-grid"></div>
    <div class="fx-spot"></div>
    <div class="fx-scan"></div>
    <div class="fx-vignette"></div>
  </div>
  <div class="fx-progress-bar" aria-hidden="true"><i id="fxProgressFill"></i></div>
  <div class="fx-toast-host" id="fxToastHost" role="status" aria-live="polite"></div>
  <button type="button" class="fx-power" id="fxPowerBtn" aria-pressed="true" title="روشن/خاموش کردن جلوه‌ها" aria-label="روشن یا خاموش کردن جلوه‌های بصری"><span id="fxPowerGlyph">✨</span></button>`;

export const FX_RUNTIME_JS = `
    // ================= miliconfig FX runtime (انیمیشن‌های روان) =================
    (function () {
      var reduceMotion = false;
      try {
        reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (_e) {}

      var host = document.getElementById('fxToastHost');

      function esc(str) {
        return String(str === undefined || str === null ? '' : str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function jsStr(str) {
        // امن‌سازی مقدار برای قرار گرفتن داخل onclick="..." یا رشته جاوااسکریپت
        return esc(String(str === undefined || str === null ? '' : str).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'"));
      }

      function kindOf(msg) {
        var m = String(msg || '');
        if (/خطا|ناموفق|نا موفق|غیرمجاز|مشکل|error|failed/i.test(m)) return 'error';
        if (/کپی شد|ذخیره|ساخته شد|موفق|فعال شد|انجام شد|بروزرسانی/i.test(m)) return 'success';
        return 'info';
      }

      function toast(msg, kind) {
        var text = String(msg || '');
        if (!host) {
          try { window.console && console.log('[miliconfig]', text); } catch (_e) {}
          return;
        }
        var el = document.createElement('div');
        el.className = 'fx-toast fx-toast-' + (kind || kindOf(text));
        el.textContent = text;
        host.appendChild(el);
        while (host.children.length > 3) host.removeChild(host.firstChild);
        window.setTimeout(function () {
          el.classList.add('fx-toast-out');
          window.setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 340);
        }, 2600);
      }

      // ---------- بوم ذرات پس‌زمینه (سبک، با احترام به باتری و DPR) ----------
      function initCanvas() {
        var canvas = document.getElementById('fxCanvas');
        if (!canvas || !canvas.getContext) return;
        if (reduceMotion) { canvas.style.display = 'none'; return; }
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = 0;
        var height = 0;
        var particles = [];
        var running = true;
        var last = 0;
        var rafId = 0;
        var pointerX = -9999;
        var pointerY = -9999;

        function resize() {
          width = canvas.clientWidth || window.innerWidth;
          height = canvas.clientHeight || window.innerHeight;
          canvas.width = Math.max(1, Math.floor(width * dpr));
          canvas.height = Math.max(1, Math.floor(height * dpr));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          build();
        }

        function build() {
          var budget = Math.max(24, Math.min(88, Math.floor((width * height) / 23000)));
          particles = [];
          for (var i = 0; i < budget; i++) {
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.22,
              vy: (Math.random() - 0.5) * 0.22,
              r: Math.random() * 1.7 + 0.6,
              a: Math.random() * 0.5 + 0.28
            });
          }
        }

        function step(ts) {
          if (!running) return;
          var dt = last ? Math.min(48, ts - last) : 16;
          last = ts;
          ctx.clearRect(0, 0, width, height);

          for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx * (dt / 16);
            p.y += p.vy * (dt / 16);
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;

            // تعامل نرم با اشاره‌گر
            var dxm = p.x - pointerX;
            var dym = p.y - pointerY;
            var dm = Math.sqrt(dxm * dxm + dym * dym);
            if (dm < 130) {
              p.x += (dxm / (dm || 1)) * 0.5;
              p.y += (dym / (dm || 1)) * 0.5;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(181, 255, 77, ' + p.a.toFixed(2) + ')';
            ctx.fill();
          }

          for (var a = 0; a < particles.length; a++) {
            for (var b = a + 1; b < particles.length; b++) {
              var pa = particles[a];
              var pb = particles[b];
              var dx = pa.x - pb.x;
              var dy = pa.y - pb.y;
              var dist2 = dx * dx + dy * dy;
              if (dist2 < 20000) {
                var alpha = (1 - dist2 / 20000) * 0.22;
                ctx.strokeStyle = 'rgba(132, 204, 22, ' + alpha.toFixed(3) + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
              }
            }
          }

          rafId = window.requestAnimationFrame(step);
        }

        function start() {
          if (running && !rafId) {
            running = true;
            last = 0;
            rafId = window.requestAnimationFrame(step);
          }
        }

        function stop() {
          running = false;
          if (rafId) window.cancelAnimationFrame(rafId);
          rafId = 0;
        }

        window.addEventListener('resize', function () {
          window.clearTimeout(window.__fxResizeTimer);
          window.__fxResizeTimer = window.setTimeout(resize, 180);
        }, { passive: true });

        window.addEventListener('pointermove', function (e) {
          pointerX = e.clientX || 0;
          pointerY = e.clientY || 0;
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
          if (document.hidden) stop();
          else start();
        });

        resize();
        start();
      }

      // ---------- نوار پیشرفت اسکرول + نور اشاره‌گر روی کارت‌ها ----------
      function initScrollFx() {
        var fill = document.getElementById('fxProgressFill');
        var spot = document.querySelector('.fx-spot');
        var ticking = false;

        function frame() {
          ticking = false;
          if (fill) {
            var doc = document.documentElement;
            var max = (doc.scrollHeight || 0) - (window.innerHeight || 0);
            var pct = max > 24 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
            fill.style.width = pct.toFixed(2) + '%';
          }
          if (spot) {
            spot.style.setProperty('--fx-mx', (window.__fxMx || 50) + '%');
            spot.style.setProperty('--fx-my', (window.__fxMy || 20) + '%');
          }
        }

        function request() {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(frame);
        }

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('pointermove', function (e) {
          if (!spot) return;
          window.__fxMx = ((e.clientX / Math.max(1, window.innerWidth)) * 100).toFixed(2);
          window.__fxMy = ((e.clientY / Math.max(1, window.innerHeight)) * 100).toFixed(2);
          request();
        }, { passive: true });
        frame();
      }

      // ---------- نمایش نرم عناصر با ورود پله‌ای ----------
      function reveal(root) {
        var scope = root || document;
        var nodes = scope.querySelectorAll('.fx-reveal:not(.fx-in)');
        if (reduceMotion || !('IntersectionObserver' in window)) {
          for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('fx-in');
          return;
        }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('fx-in');
              io.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
        for (var j = 0; j < nodes.length; j++) io.observe(nodes[j]);
      }

      // ---------- شمارنده نرم اعداد ----------
      function countUp(el, to, formatter) {
        if (!el) return;
        var target = Number(to) || 0;
        var fmt = typeof formatter === 'function' ? formatter : function (v) { return String(Math.round(v)); };
        if (reduceMotion || target === 0) {
          el.textContent = fmt(target);
          return;
        }
        var from = Number(el.__fxFrom || 0);
        var start = 0;
        var dur = 780;
        var key = (el.__fxKey = String(Date.now()) + Math.random());
        function tick(ts) {
          if (el.__fxKey !== key) return;
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(from + (target - from) * eased);
          if (p < 1) window.requestAnimationFrame(tick);
          else el.__fxFrom = target;
        }
        window.requestAnimationFrame(tick);
      }

      // ---------- ریپل روی دکمه‌ها + نور کارتی هاور ----------
      function initInteractions() {
        document.addEventListener('click', function (e) {
          var target = e.target && e.target.closest
            ? e.target.closest('button, .btn, .btn-neon, .btn-ghost, .copy-btn, .sb-item, .sb-btn, .top-pill, .dl-btn, .preset-card, .acc-header')
            : null;
          if (!target || reduceMotion) return;
          try {
            var rect = target.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            var ink = document.createElement('span');
            ink.className = 'fx-ripple-ink';
            ink.style.width = ink.style.height = size + 'px';
            ink.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ink.style.top = (e.clientY - rect.top - size / 2) + 'px';
            if (!target.classList.contains('fx-ripple')) target.classList.add('fx-ripple');
            target.appendChild(ink);
            window.setTimeout(function () {
              if (ink.parentNode) ink.parentNode.removeChild(ink);
            }, 680);
          } catch (_e) {}
        }, { passive: true });

        if (reduceMotion) return;
        var cards = document.querySelectorAll('.fx-card');
        for (var i = 0; i < cards.length; i++) {
          (function (card) {
            card.addEventListener('pointermove', function (e) {
              var r = card.getBoundingClientRect();
              card.style.setProperty('--fx-cx', ((e.clientX - r.left) / Math.max(1, r.width) * 100).toFixed(1) + '%');
              card.style.setProperty('--fx-cy', ((e.clientY - r.top) / Math.max(1, r.height) * 100).toFixed(1) + '%');
            }, { passive: true });
          })(cards[i]);
        }
      }

      // ---------- حلقه مصرف با انیمیشن پر شدن ----------
      function ring(el, percent) {
        if (!el) return;
        var p = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
        if (reduceMotion) {
          el.style.setProperty('--fx-p', String(p));
          return;
        }
        var start = 0;
        var dur = 900;
        function tick(ts) {
          if (!start) start = ts;
          var t = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          el.style.setProperty('--fx-p', String(p * eased));
          if (t < 1) window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
      }

      function copy(text, msg) {
        var done = function () { toast(msg || 'کپی شد', 'success'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { legacy(text, done); });
        } else {
          legacy(text, done);
        }
      }

      function legacy(text, done) {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', 'readonly');
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        } catch (_e) {
          toast('کپی خودکار پشتیبانی نشد؛ دستی کپی کنید', 'error');
        }
      }

      // ---------- کلید روشن/خاموش کردن جلوه‌ها ( ذخیره در حافظه مرورگر ) ----------
      var FX_STORAGE_KEY = 'mili-fx-enabled';
      function applyFxState(enabled) {
        try {
          document.documentElement.classList.toggle('fx-off', !enabled);
        } catch (_e) {}
        var btn = document.getElementById('fxPowerBtn');
        var glyph = document.getElementById('fxPowerGlyph');
        if (btn) {
          btn.classList.toggle('fx-power-off', !enabled);
          btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
          btn.setAttribute('title', enabled ? 'خاموش کردن جلوه‌ها' : 'روشن کردن جلوه‌ها');
        }
        if (glyph) glyph.textContent = enabled ? '✨' : '🌙';
      }

      function initPower() {
        var enabled = true;
        try {
          var stored = window.localStorage.getItem(FX_STORAGE_KEY);
          if (stored === '0') enabled = false;
        } catch (_e) {}
        applyFxState(enabled);
        var btn = document.getElementById('fxPowerBtn');
        if (!btn) return;
        btn.addEventListener('click', function () {
          var next = !document.documentElement.classList.contains('fx-off');
          applyFxState(next);
          try { window.localStorage.setItem(FX_STORAGE_KEY, next ? '1' : '0'); } catch (_e) {}
          if (next) {
            try { window.dispatchEvent(new Event('resize')); } catch (_e) {}
          }
          toast(next ? 'جلوه‌ها روشن شد' : 'جلوه‌ها خاموش شد', 'info');
        });
      }

      window.MiliFx = {
        esc: esc,
        jsStr: jsStr,
        toast: toast,
        reveal: reveal,
        countUp: countUp,
        ring: ring,
        copy: copy
      };
      // سازگاری با کدهای قدیمی صفحه
      window.miliEsc = esc;
      window.miliCopy = copy;

      function boot() {
        initPower();
        initCanvas();
        initScrollFx();
        initInteractions();
        reveal(document);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    })();
`;
