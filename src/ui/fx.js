// ============================================================================
// miliconfig v4 - لایه جلوه‌ها (بدون هیچ FX)
// ----------------------------------------------------------------------------
// درخواست کاربر: «حذف کل FX، در عوض سرعت و زیبایی».
// پس Canvas، ذرات، Aurora، رینگ متحرک و اسکرول‌ریویل حذف شده‌اند و فقط یک
// شیم سبک از MiliFx باقی مانده تا کدهای موجود (toast/copy/ring/countUp/esc)
// بدون وابستگی به موتور افکت کار کنند. هیچ فریم‌لویپی اجرا نمی‌شود.
// ============================================================================

export const FX_CSS = `
    /* شیم سبک جایگزین موتور افکت — بدون Canvas و بدون حلقه انیمیشن */
    .fx-reveal, .fx-card, [data-fx] { opacity: 1 !important; transform: none !important; filter: none !important; }
    .fx-toast-host {
      position: fixed;
      z-index: 999;
      inset-inline: 0;
      top: calc(12px + env(safe-area-inset-top, 0px));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      pointer-events: none;
    }
    .fx-toast {
      max-width: min(92vw, 460px);
      padding: 9px 14px;
      border-radius: 12px;
      background: rgba(10, 16, 12, 0.94);
      border: 1px solid rgba(181, 255, 77, 0.35);
      color: #eaf3e4;
      font-size: 0.78rem;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: translateY(-6px);
      transition: opacity .18s ease, transform .18s ease;
    }
    .fx-toast.show { opacity: 1; transform: none; }
    /* رینگ‌ها با conic-gradient کشیده می‌شوند، نه Canvas */
    .donut-ring, .usage-ring {
      border-radius: 50%;
      background: conic-gradient(var(--os-accent, #b5ff4d) calc(var(--p, 0) * 1%), rgba(255, 255, 255, 0.09) 0);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px));
    }
`;

export const FX_MARKUP = '';

export const FX_RUNTIME_JS = `
  (function () {
    if (window.MiliFx) return;
    function esc(v) {
      return String(v === undefined || v === null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function host() {
      var h = document.getElementById('fxToastHost');
      if (!h) {
        h = document.createElement('div');
        h.id = 'fxToastHost';
        h.className = 'fx-toast-host';
        document.body.appendChild(h);
      }
      return h;
    }
    function toast(message) {
      if (!message) return;
      var h = host();
      var el = document.createElement('div');
      el.className = 'fx-toast';
      el.textContent = String(message);
      h.appendChild(el);
      (window.requestAnimationFrame || window.setTimeout)(function () { el.classList.add('show'); });
      window.setTimeout(function () {
        el.classList.remove('show');
        window.setTimeout(function () { el.remove(); }, 220);
      }, 2200);
    }
    function copy(text, message) {
      var value = String(text || '');
      function done() { toast(message || 'کپی شد'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(fallback);
        return;
      }
      fallback();
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = value;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          done();
        } catch (e) { toast('کپی نشد'); }
      }
    }
    // بدون شمارش انیمیشنی: مقدار نهایی فوراً نوشته می‌شود (سریع‌ترین حالت)
    function countUp(el, value, format) {
      if (!el) return;
      var n = Number(value) || 0;
      el.textContent = typeof format === 'function' ? format(n) : String(n);
    }
    function reveal() {}
    function ring(el, percent) {
      if (!el) return;
      var p = Math.max(0, Math.min(100, Number(percent) || 0));
      el.style.setProperty('--p', p);
      el.setAttribute('data-pct', Math.round(p) + '%');
    }
    // امن‌سازی رشته برای قرار گرفتن داخل هندلر درون‌خطی (بدون regex و بدون بک‌اسلش در سورس)
    function jsStr(v) {
      var s = String(v === undefined || v === null ? '' : v);
      var BS = String.fromCharCode(92);
      var out = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        var code = s.charCodeAt(i);
        if (c === BS) out += BS + BS;
        else if (c === "'") out += '&#39;';
        else if (code === 10 || code === 13) out += BS + 'n';
        else if (code === 60) out += '&lt;';
        else out += c;
      }
      return out;
    }
    window.MiliFx = { esc: esc, jsStr: jsStr, toast: toast, copy: copy, countUp: countUp, reveal: reveal, ring: ring };
  })();
`;
