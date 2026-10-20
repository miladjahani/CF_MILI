// ============================================================================
// miliconfig v3.1 - تنظیمات پیش‌فرض پایه (منطبق با کد اصلی CFnew v3.1)
// ============================================================================

export const BRAND_NAME = 'miliconfig';
export const BRAND_UPPER = 'MILICONFIG';
export const VERSION = 'v3.3';
export const DEFAULT_ADMIN_UUID = '351c9981-04b6-4103-aa4b-864aa9c91469';

// ----------------------------------------------------------------------------
// کانال پشتیبانی رسمی: تنها منبع حقیقت (Single Source of Truth) برای لینک پشتیبانی
// در پنل مدیریت، صفحه وضعیت کاربر و صفحه ورود استفاده می‌شود.
// برای تغییر، فقط همین دو مقدار را ویرایش کنید.
// ----------------------------------------------------------------------------
export const SUPPORT_CHANNEL_HANDLE = '@miliconfig';
export const SUPPORT_CHANNEL_URL = 'https://t.me/miliconfig';
export const SUPPORT_CHANNEL_LABEL = `کانال پشتیبانی ${SUPPORT_CHANNEL_HANDLE}`;

// تمام ۳۱ تنظیم پیش‌فرض کد اصلی + تنظیمات پایه کاربر (تعداد نود در ساب و فرمت نام‌گذاری)
export const CONFIG_DEFAULTS = {
  wk: '',
  ev: 'yes',
  et: 'no',
  ex: 'no',
  ech: 'no',
  tp: '',
  customDNS: 'https://223.5.5.5/dns-query',
  customECHDomain: 'cloudflare-ech.com',
  alpn: '',
  d: '',
  p: '',
  yx: '',
  yxURL: '',
  s: '',
  homepage: '',
  scu: 'https://url.v1.mk/sub',
  ena: 'no',
  epd: 'no',
  epi: 'yes',
  egi: 'yes',
  pm: '',
  locs: 'all',
  ae: '',
  rm: '',
  qj: '',
  dkby: 'no',
  yxby: '',
  ipv4: 'yes',
  ipv6: 'yes',
  ispMobile: 'yes',
  ispUnicom: 'yes',
  ispTelecom: 'yes',
  jk: 'no',
  ss: 'no',
  ssc: 'chacha20-ietf-poly1305',
  ssp: '',
  cpx: 'no',
  pcc: 'all',
  cpn: 24,
  // چرخش آی‌پی خروجی نودهای کشوری: 'day' روزانه (پیش‌فرض)، 'hour' ساعتی، 'off' ثابت
  rot: 'day',
  // حداکثر پینگ قابل قبول موتور انتخاب پروکسی (ms) — پروکسی‌های کندتر وارد نودها نمی‌شوند
  maxProxyPing: 1500,
  subNodeCount: 50,
  brand: BRAND_NAME
};

export const BOOLEAN_CONFIG_KEYS = [
  'ev', 'et', 'ex', 'ech', 'ena', 'epd', 'epi', 'egi',
  'ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom', 'jk', 'ss', 'cpx'
];

export const ENV_KEY_MAPPING = {
  wk: ['wk', 'WK'],
  ev: ['ev', 'EV'],
  et: ['et', 'ET'],
  ex: ['ex', 'EX'],
  ech: ['ech', 'ECH'],
  tp: ['tp', 'TP'],
  customDNS: ['customDNS', 'CUSTOMDNS', 'CUSTOM_DNS'],
  customECHDomain: ['customECHDomain', 'CUSTOMECHDOMAIN', 'CUSTOM_ECH_DOMAIN'],
  alpn: ['alpn', 'ALPN'],
  d: ['d', 'D'],
  p: ['p', 'P'],
  yx: ['yx', 'YX'],
  yxURL: ['yxURL', 'YXURL', 'YX_URL'],
  s: ['s', 'S'],
  homepage: ['homepage', 'HOMEPAGE'],
  scu: ['scu', 'SCU'],
  ena: ['ena', 'ENA'],
  epd: ['epd', 'EPD'],
  epi: ['epi', 'EPI'],
  egi: ['egi', 'EGI'],
  pm: ['pm', 'PM'],
  locs: ['locs', 'LOCS', 'LOCATIONS'],
  ae: ['ae', 'AE'],
  rm: ['rm', 'RM'],
  qj: ['qj', 'QJ'],
  dkby: ['dkby', 'DKBY'],
  yxby: ['yxby', 'YXBY'],
  ipv4: ['ipv4', 'IPV4'],
  ipv6: ['ipv6', 'IPV6'],
  ispMobile: ['ispMobile', 'ISPMOBILE', 'ISP_MOBILE'],
  ispUnicom: ['ispUnicom', 'ISPUNICOM', 'ISP_UNICOM'],
  ispTelecom: ['ispTelecom', 'ISPTELECOM', 'ISP_TELECOM'],
  jk: ['jk', 'JK'],
  ss: ['ss', 'SS'],
  ssc: ['ssc', 'SSC', 'SS_CIPHER'],
  ssp: ['ssp', 'SSP', 'SS_PASSWORD'],
  cpx: ['cpx', 'CPX', 'COUNTRY_PROXY'],
  pcc: ['pcc', 'PCC', 'PROXY_COUNTRIES'],
  cpn: ['cpn', 'CPN', 'COUNTRY_PROXY_NODES'],
  rot: ['rot', 'ROT', 'IP_ROTATION'],
  maxProxyPing: ['maxProxyPing', 'MAXPROXYPING', 'MAX_PROXY_PING'],
  subNodeCount: ['subNodeCount', 'SUB_NODE_COUNT', 'nodeCount', 'NODE_COUNT']
};

export const REGION_MAP = {
  CF: ['🌐 مستقیم رسمی CF', 'CF', 'Cloudflare Direct'],
  HK: ['🇭🇰 هنگ‌کنگ', 'HK', 'Hong Kong'],
  US: ['🇺🇸 آمریکا', 'US', 'United States'],
  SG: ['🇸🇬 سنگاپور', 'SG', 'Singapore'],
  JP: ['🇯🇵 ژاپن', 'JP', 'Japan'],
  KR: ['🇰🇷 کره‌جنوبی', 'KR', 'South Korea'],
  DE: ['🇩🇪 آلمان', 'DE', 'Germany'],
  SE: ['🇸🇪 سوئد', 'SE', 'Sweden'],
  NL: ['🇳🇱 هلند', 'NL', 'Netherlands'],
  FI: ['🇫🇮 فنلاند', 'FI', 'Finland'],
  GB: ['🇬🇧 بریتانیا', 'GB', 'United Kingdom'],
  Oracle: ['☁️ Oracle', 'Oracle'],
  DigitalOcean: ['🌊 DigitalOcean', 'DigitalOcean'],
  Vultr: ['⚡ Vultr', 'Vultr'],
  Multacom: ['🏢 Multacom', 'Multacom']
};

// آی‌پی‌های مستقیم کلودفلر — فقط آی‌پی‌هایی که با تست واقعی TLS پاسخ ۲۰۰ داده‌اند.
// (آی‌پی‌های مردهٔ رنج ۱۷۲.۷۱ و ۱۶۲.۱۵۸ که قبلاً اینجا بودند حذف شدند.)
export const OFFICIAL_DIRECT_IPS = [
  '104.16.1.1',
  '104.16.100.1',
  '104.17.1.1',
  '104.18.1.1',
  '104.19.1.1',
  '104.20.1.1',
  '104.21.1.1',
  '104.24.1.1',
  '104.25.1.1',
  '104.26.1.1',
  '104.27.1.1',
  '188.114.96.10',
  '188.114.97.10',
  '188.114.98.10',
  '172.64.150.1',
  '103.31.4.10'
];

// ProxyIPهای منطقه‌ای: ip = آی‌پی ثابت واقعی (تأییدشده)، domain فقط برای سازگاری
// با نسخه‌های قبلی نگه داشته شده و هیچ نودی با دامنه ساخته نمی‌شود.
export const FALLBACK_PROXY_IPS = [
  { domain: 'ProxyIP.DE.CMLiussss.net', ip: '185.221.237.96', region: 'DE', regionCode: 'DE', port: 443 },
  { domain: 'ProxyIP.NL.CMLiussss.net', ip: '147.90.229.230', region: 'NL', regionCode: 'NL', port: 443 },
  { domain: 'ProxyIP.GB.CMLiussss.net', ip: '51.6.54.142', region: 'GB', regionCode: 'GB', port: 443 },
  { domain: 'ProxyIP.FR.CMLiussss.net', ip: '88.218.77.37', region: 'FR', regionCode: 'FR', port: 443 },
  { domain: 'ProxyIP.CH.CMLiussss.net', ip: '87.120.222.168', region: 'CH', regionCode: 'CH', port: 443 },
  { domain: 'ProxyIP.SE.CMLiussss.net', ip: '185.153.180.235', region: 'SE', regionCode: 'SE', port: 443 },
  { domain: 'ProxyIP.FI.CMLiussss.net', ip: '91.211.114.208', region: 'FI', regionCode: 'FI', port: 443 },
  { domain: 'ProxyIP.PL.CMLiussss.net', ip: '191.44.81.93', region: 'PL', regionCode: 'PL', port: 443 },
  { domain: 'ProxyIP.US.CMLiussss.net', ip: '46.17.107.199', region: 'US', regionCode: 'US', port: 443 },
  { domain: 'ProxyIP.CA.CMLiussss.net', ip: '45.133.17.27', region: 'CA', regionCode: 'CA', port: 443 },
  { domain: 'ProxyIP.SG.CMLiussss.net', ip: '188.239.9.91', region: 'SG', regionCode: 'SG', port: 443 },
  { domain: 'ProxyIP.JP.CMLiussss.net', ip: '64.176.62.94', region: 'JP', regionCode: 'JP', port: 443 },
  { domain: 'ProxyIP.KR.CMLiussss.net', ip: '131.186.26.94', region: 'KR', regionCode: 'KR', port: 443 },
  { domain: 'ProxyIP.HK.CMLiussss.net', ip: '156.239.245.134', region: 'HK', regionCode: 'HK', port: 443 },
  { domain: 'ProxyIP.IN.CMLiussss.net', ip: '216.10.243.159', region: 'IN', regionCode: 'IN', port: 443 },
  { domain: 'ProxyIP.AU.CMLiussss.net', ip: '125.7.24.251', region: 'AU', regionCode: 'AU', port: 443 }
];

export const DIRECT_DOMAINS = [
  { name: 'cloudflare.182682.xyz', domain: 'cloudflare.182682.xyz' },
  { name: 'speed.marisalnc.com', domain: 'speed.marisalnc.com' },
  { domain: 'freeyx.cloudflare88.eu.org' },
  { domain: 'bestcf.top' },
  { domain: 'cdn.2020111.xyz' },
  { domain: 'cfip.cfcdn.vip' },
  { domain: 'cf.0sm.com' },
  { domain: 'cf.090227.xyz' },
  { domain: 'cf.zhetengsha.eu.org' },
  { domain: 'cloudflare.9jy.cc' },
  { domain: 'cf.zerone-cdn.pp.ua' },
  { domain: 'cfip.1323123.xyz' },
  { domain: 'cnamefuckxxs.yuchen.icu' },
  { domain: 'cloudflare-ip.mofashi.ltd' },
  { domain: '115155.xyz' },
  { domain: 'cname.xirancdn.us' },
  { domain: 'f3058171cad.002404.xyz' },
  { domain: '8.889288.xyz' },
  { domain: 'cdn.tzpro.xyz' },
  { domain: 'cf.877771.xyz' },
  { domain: 'xn--b6gac.eu.org' }
];

export const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
export const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
export const ALLOWED_ALPN = ['', 'h3', 'h2', 'http/1.1', 'h3,h2', 'h2,http/1.1', 'h3,h2,http/1.1'];
export const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/byJoey/test/refs/heads/main/tist.ini';

export function isEnabledValue(val, defaultEnabled = false) {
  if (val === undefined || val === null || val === '') return defaultEnabled;
  if (val === true || val === false) return val;
  const text = String(val).trim().toLowerCase();
  if (text === 'yes' || text === 'true' || text === '1' || text === 'on') return true;
  if (text === 'no' || text === 'false' || text === '0' || text === 'off') return false;
  return defaultEnabled;
}

export function normalizeSwitch(val, defaultEnabled = false) {
  return isEnabledValue(val, defaultEnabled) ? 'yes' : 'no';
}

export function normalizeAlpn(val) {
  const s = String(val || '').trim();
  return ALLOWED_ALPN.includes(s) ? s : '';
}

export function normalizeEffectiveConfig(rawConfig = {}) {
  const snap = {
    ...CONFIG_DEFAULTS,
    ...(rawConfig || {})
  };
  for (const key of BOOLEAN_CONFIG_KEYS) {
    snap[key] = normalizeSwitch(snap[key], isEnabledValue(CONFIG_DEFAULTS[key]));
  }
  if (snap.ev === 'no' && snap.et === 'no' && snap.ex === 'no') {
    snap.ev = 'yes';
  }
  if (snap.ech === 'yes') {
    snap.dkby = 'yes';
  }
  snap.alpn = normalizeAlpn(snap.alpn);
  snap.ssc = String(snap.ssc || CONFIG_DEFAULTS.ssc).trim().toLowerCase();
  snap.ssp = String(snap.ssp ?? '');
  snap.pm = (() => {
    const raw = String(snap.pm ?? '').trim().toLowerCase();
    if (raw === 'only') return 'only';
    return isEnabledValue(raw, false) ? 'yes' : '';
  })();
  snap.locs = snap.locs === undefined || snap.locs === null ? 'all' : String(snap.locs).trim();
  // نودهای پروکسی خروجی تفکیک‌شده بر اساس کشور (cpx/pcc/cpn)
  snap.pcc = String(snap.pcc ?? 'all').trim() || 'all';
  const countryNodeCount = parseInt(snap.cpn, 10);
  snap.cpn = Number.isFinite(countryNodeCount) && countryNodeCount > 0 ? Math.min(200, countryNodeCount) : 24;
  // حالت چرخش آی‌پی: فقط مقادیر معتبر پذیرفته می‌شوند
  const rawRot = String(snap.rot ?? 'day').trim().toLowerCase();
  snap.rot = rawRot === 'hour' || rawRot === 'off' ? rawRot : 'day';
  const rawMaxPing = parseInt(snap.maxProxyPing, 10);
  snap.maxProxyPing = Number.isFinite(rawMaxPing) && rawMaxPing > 0 ? Math.min(30000, rawMaxPing) : 1500;
  const parsedCount = parseInt(snap.subNodeCount, 10);
  snap.subNodeCount = Number.isFinite(parsedCount) && parsedCount >= 0 ? parsedCount : 50;
  snap.brand = BRAND_NAME;
  return snap;
}

export function readEnvConfigValue(env, ...names) {
  if (!env) return undefined;
  for (const name of names) {
    if (env[name] !== undefined && env[name] !== null && env[name] !== '' && typeof env[name] !== 'object') {
      return env[name];
    }
  }
  return undefined;
}

export function getEnvConfigSnapshot(env = {}) {
  const snap = {};
  for (const [key, names] of Object.entries(ENV_KEY_MAPPING)) {
    const val = readEnvConfigValue(env, ...names);
    if (val !== undefined) snap[key] = val;
  }
  return snap;
}
