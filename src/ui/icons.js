// ============================================================================
// miliconfig v3.1 - مجموعه آیکون‌های اختصاصی (SVG درون‌خطی، بدون هیچ ایموجی)
// همه آیکون‌ها با currentColor رنگ می‌گیرند تا با تم سیستم‌عامل هم‌رنگ شوند.
// ============================================================================

const PATHS = {
  dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.5-3.4 3.1-5.6 6.2-5.6s5.7 2.2 6.2 5.6"/><path d="M16.5 5.4a3.2 3.2 0 0 1 0 6.1"/><path d="M18.4 14.9c1.9.6 3.1 2.3 3.4 4.6"/>',
  nodes: '<path d="M13.2 2.5 5.4 13.2h5l-1.6 8.3 8.2-11.2h-5.2z"/>',
  network: '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3c2.6 2.6 3.9 5.7 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.7-3.9-9S9.4 5.6 12 3z"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="8.8" cy="17" r="2.2"/>',
  system: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="10" y="10" width="4" height="4" rx="1"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/>',
  shield: '<path d="M12 3 19.5 6v6.2c0 4.5-3.1 8.2-7.5 9.3-4.4-1.1-7.5-4.8-7.5-9.3V6z"/><path d="m9.2 12.1 2 2 3.6-3.9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3.5V8h-4.5"/>',
  search: '<circle cx="10.6" cy="10.6" r="6.4"/><path d="m15.4 15.4 4.6 4.6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.4"/><path d="M15.5 5.6A2.1 2.1 0 0 0 13.4 3.5H6.2A2.2 2.2 0 0 0 4 5.7v7.2c0 1 .7 1.8 1.6 2"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9.5 7V5.2A1.7 1.7 0 0 1 11.2 3.5h1.6a1.7 1.7 0 0 1 1.7 1.7V7"/><path d="M6.5 7l.8 12.1c0 .8.7 1.4 1.5 1.4h6.4c.8 0 1.5-.6 1.5-1.4L17.5 7"/>',
  power: '<path d="M12 3v8"/><path d="M7.3 6.2a7.5 7.5 0 1 0 9.4 0"/>',
  key: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12h8.4M17 12v3M20 12v2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>',
  check: '<path d="m5 12.8 4.4 4.2L19 6.6"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  link: '<path d="M10.4 13.6a4.2 4.2 0 0 0 5.9 0l2.6-2.6a4.2 4.2 0 0 0-5.9-5.9l-1.3 1.3"/><path d="M13.6 10.4a4.2 4.2 0 0 0-5.9 0l-2.6 2.6a4.2 4.2 0 0 0 5.9 5.9l1.3-1.3"/>',
  database: '<ellipse cx="12" cy="6" rx="7.5" ry="3.2"/><path d="M4.5 6v6c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V6"/><path d="M4.5 12v6c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-6"/>',
  chart: '<path d="M4 19h16"/><path d="M7 19V9.5M12 19V5M17 19v-6.5"/>',
  server: '<rect x="3.5" y="4" width="17" height="7" rx="2.2"/><rect x="3.5" y="13" width="17" height="7" rx="2.2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  wifi: '<path d="M3.2 9.2a13 13 0 0 1 17.6 0"/><path d="M6.6 12.7a8.2 8.2 0 0 1 10.8 0"/><path d="M10 16.1a3.4 3.4 0 0 1 4 0"/><circle cx="12" cy="19.4" r=".9" fill="currentColor" stroke="none"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="m7.4 10 2.6 2.4-2.6 2.4M12.6 15.2h4"/>',
  eye: '<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="3.1"/>',
  download: '<path d="M12 4v10.5"/><path d="m8 11 4 4 4-4"/><path d="M4.5 19.5h15"/>',
  upload: '<path d="M12 20V9.5"/><path d="m8 13 4-4 4 4"/><path d="M4.5 4.5h15"/>',
  lock: '<rect x="4.8" y="10.4" width="14.4" height="10" rx="2.6"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14.5V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V8.2A1.6 1.6 0 0 1 5.6 6.6H10"/>',
  logout: '<path d="M14 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v10.8a2.1 2.1 0 0 0 2.1 2.1H14"/><path d="M17.5 8.5 21 12l-3.5 3.5M10.5 12H21"/>',
  spark: '<path d="M12 3.2 13.9 9l5.9 1.9-5.9 1.9L12 18.6l-1.9-5.8L4.2 11 10.1 9z"/>',
  globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2c2.4 2.4 3.6 5.4 3.6 8.8S14.4 18.4 12 20.8c-2.4-2.4-3.6-5.4-3.6-8.8S9.6 5.6 12 3.2z"/>',
  layers: '<path d="m12 3.5 8.5 4.6-8.5 4.6L3.5 8.1z"/><path d="m4.6 12.6 7.4 4 7.4-4"/><path d="m4.6 16.8 7.4 4 7.4-4"/>',
  sliders: '<path d="M6 4v6M6 14v6M12 4v9M12 17v3M18 4v3M18 11v9"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="18" cy="9" r="2"/>',
  info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.5M12 7.8h.01"/>',
  page: '<path d="M13.5 3.5H7A2.2 2.2 0 0 0 4.8 5.7v12.6A2.2 2.2 0 0 0 7 20.5h10a2.2 2.2 0 0 0 2.2-2.2V9.2z"/><path d="M13.4 3.6v5.4h5.6"/>'
};

const EXTRA_PATHS = {
  chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
  chevronUp: '<path d="m6 14.5 6-6 6 6"/>',
  box: '<path d="M12 3.2 20.5 7v10L12 20.8 3.5 17V7z"/><path d="M3.7 7.2 12 11l8.3-3.8M12 11v9.6"/>',
  save: '<path d="M5.5 4.5h10L19.5 8.5v11a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5z"/><path d="M8 4.5v5h7v-5M8 19.5v-5.5h8v5.5"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  swap: '<path d="M4 8.5h13l-3-3M20 15.5H7l3 3"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  antenna: '<path d="M12 13.5V20"/><circle cx="12" cy="11" r="2"/><path d="M7.4 6.4a6.5 6.5 0 0 1 9.2 0M4.6 3.6a10.5 10.5 0 0 1 14.8 0"/>',
  help: '<circle cx="12" cy="12" r="8.8"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1 1-1.1 1.8v.4M12 17.2h.01"/>',
  message: '<path d="M20.5 12.2c0 3.9-3.8 7-8.5 7-1 0-2-.1-2.9-.4L4.5 20.5l1.2-3.4a6.4 6.4 0 0 1-2.2-4.9c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>'
};

Object.assign(PATHS, EXTRA_PATHS);

export function ICON(name, className = 'ic', extra = '') {
  const body = PATHS[name] || PATHS.spark;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra ? ' ' + extra : ''}>${body}</svg>`;
}

export const ICONS = PATHS;

// ============================================================================
// حذف کامل ایموجی از خروجی HTML: هر ایموجی با آیکون SVG اختصاصی جایگزین می‌شود.
// بلوک‌های <script> دست‌نخورده می‌مانند تا سینتکس جاوااسکریپت نشکند.
// ============================================================================
const EMOJI_MAP = [
  ['🛡️', ICON('shield')], ['🛡', ICON('shield')],
  ['👥', ICON('users')], ['📦', ICON('box')], ['📈', ICON('chart')],
  ['⚡', ICON('nodes')], ['✨', ICON('spark')], ['🌟', ICON('spark')],
  ['🕒', ICON('clock')], ['⏱', ICON('clock')], ['⏻', ICON('power')],
  ['🌐', ICON('globe')], ['🌍', ICON('globe')], ['🌙', ICON('moon')],
  ['📋', ICON('copy')], ['🔗', ICON('link')], ['🔍', ICON('search')],
  ['💾', ICON('save')], ['🛠️', ICON('settings')], ['🛠', ICON('settings')],
  ['📡', ICON('antenna')], ['🎲', ICON('spark')], ['🎯', ICON('target')],
  ['🚀', ICON('spark')], ['🔑', ICON('key')], ['👁️', ICON('eye')], ['👁', ICON('eye')],
  ['❓', ICON('help')], ['💬', ICON('message')], ['📄', ICON('page')], ['📝', ICON('page')],
  ['⬇️', ICON('download')], ['⬇', ICON('download')], ['⬆️', ICON('upload')], ['⬆', ICON('upload')],
  ['⬅', ICON('external')], ['➡', ICON('external')], ['↩', ICON('logout')],
  ['⌫', ICON('x')], ['✓', ICON('check')], ['✔', ICON('check')], ['✕', ICON('x')], ['✖', ICON('x')],
  ['☰', ICON('menu')], ['⌄', ICON('chevronDown')], ['⌃', ICON('chevronUp')],
  ['⇄', ICON('swap')], ['↻', ICON('refresh')], ['⟳', ICON('refresh')],
  ['▣', ICON('layers')], ['⊞', ICON('dashboard')], ['✎', ICON('sliders')],
  ['⚙️', ICON('system')], ['⚙', ICON('system')], ['☁️', ICON('globe')], ['☁', ICON('globe')],
  ['🗄️', ICON('database')], ['🗄', ICON('database')], ['🔥', ICON('spark')], ['💠', ICON('spark')],
  ['●', '<span class="dot-online"></span>'], ['•', '<span class="dot-online"></span>'],
  ['→', ICON('external')], ['←', ICON('logout')]
];

function scrubEmojiChunk(chunk) {
  let out = chunk;
  for (const [glyph, icon] of EMOJI_MAP) {
    if (out.includes(glyph)) out = out.split(glyph).join(icon);
  }
  // توالی‌های باقی‌مانده‌ی ایموجی (نمایشگر رنگی) با یک آیکون عمومی پاک می‌شوند
  return out.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '');
}

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu;

// فقط متن بین تگ‌ها جایگزین می‌شود تا مقدار attributeها (onclick/title/...) نشکند
function scrubTextNodes(chunk) {
  // داخل تگ‌ها (attributeها) فقط حذف؛ بیرون تگ‌ها با آیکون جایگزین
  const withoutTagEmoji = chunk.replace(/<[^>]*>/g, (tag) => tag.replace(EMOJI_RE, ''));
  return withoutTagEmoji.replace(/(^|>)([^<]*)/g, (_m, lead, text) => lead + scrubEmojiChunk(text));
}

export function deEmoji(html) {
  const parts = String(html).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/gi);
  return parts
    .map((chunk, i) => {
      if (i % 2 !== 1) return scrubTextNodes(chunk);
      // داخل اسکریپت/استایل فقط حذف می‌کنیم تا سینتکس نشکند
      return chunk.replace(EMOJI_RE, '');
    })
    .join('');
}

// لوگوی اختصاصی برند (سپر شش‌ضلعی با هسته پالس)
export const SHIELD_LOGO_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="mili-shield-svg" aria-hidden="true">
  <defs>
    <linearGradient id="miliGrad" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#d9ff8a"/><stop offset="1" stop-color="#65a30d"/>
    </linearGradient>
  </defs>
  <path d="M32 5.5 54 14v17.4c0 12.4-8.8 22.6-22 27.1C18.8 54 10 43.8 10 31.4V14z" fill="#0a130b" stroke="url(#miliGrad)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M32 18.5 45 24v9.2c0 6.6-5.2 12.1-13 14.7-7.8-2.6-13-8.1-13-14.7V24z" fill="none" stroke="url(#miliGrad)" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="32" cy="30" r="4.2" fill="#b5ff4d"/>
  <circle cx="32" cy="30" r="9" stroke="#b5ff4d" stroke-opacity=".38" stroke-width="1.4"/>
</svg>`;

export const CLOUD_LOGO_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="mili-cloud-svg" aria-hidden="true">
  <rect x="4" y="4" width="56" height="56" rx="18" fill="#0a0f09" stroke="#3f6212" stroke-width="1.6"/>
  <path d="M25.5 42H40.5C44.6421 42 48 38.6421 48 34.5C48 30.491 44.8544 27.2165 40.8926 27.0104C39.2471 21.7876 34.3652 18 28.6 18C21.4203 18 15.6 23.8203 15.6 31C15.6 37.0751 20.1249 42 25.5 42Z" stroke="#b5ff4d" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const FAVICON_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#070c08"/><path d="M32 8 52 15.6v16.2C52 42.9 44.3 52 32 56 19.7 52 12 42.9 12 31.8V15.6z" fill="none" stroke="#b5ff4d" stroke-width="3.4" stroke-linejoin="round"/><circle cx="32" cy="30" r="5" fill="#b5ff4d"/></svg>`
)}`;
