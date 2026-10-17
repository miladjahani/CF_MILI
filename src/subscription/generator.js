// ============================================================================
// miliconfig v3.1 - تولیدکننده ساب‌لینک چندکاربره با نام‌گذاری number+miliconfig
// و اعمال دقیق تنظیمات هر کاربر + محدودیت تعداد نودها در ساب (subNodeCount)
// ============================================================================

import {
  BRAND_NAME,
  CF_HTTPS_PORTS,
  CF_HTTP_PORTS,
  CONFIG_DEFAULTS,
  DIRECT_DOMAINS,
  FALLBACK_PROXY_IPS,
  OFFICIAL_DIRECT_IPS,
  isEnabledValue,
  normalizeAlpn,
  normalizeEffectiveConfig
} from '../config/defaults.js';
import {
  CLEAN_EDGE_IPV4,
  CLEAN_EDGE_IPV6,
  edgeIpForIndex,
  parseLocationFilter
} from '../config/locations.js';
import {
  createMiliNodeNamer,
  encodeBase64Utf8,
  finalizeMiliSubscriptionLinks,
  isValidDomain,
  isValidIpAddress,
  md5Hex,
  normalizeNodeHost,
  parseAddressAndPort,
  prependInfoNodes
} from '../core/utils.js';
import { resolveSsCiphers } from '../core/shadowsocks.js';
import { PROXY_POOL, pickProxiesAcrossCountries } from '../config/proxyPool.js';
import {
  generateClashConfig,
  generateLoonConfig,
  generateQuanxConfig,
  generateResidentialChainConfig,
  generateSingboxConfig,
  generateSurgeConfig
} from './converters.js';

export function getOfficialDirectAddress() {
  const hit = OFFICIAL_DIRECT_IPS[Math.floor(Math.random() * OFFICIAL_DIRECT_IPS.length)];
  return {
    domain: hit,
    ip: hit,
    region: 'CF',
    regionCode: 'CF',
    port: 443
  };
}

// ساخت مسیر WebSocket نود؛ p/pm داخل path قرار می‌گیرد تا سرور همان نود را
// با خروجی ثابت خودش اجرا کند (بدون نیاز به تنظیم دستی p در پنل).
function buildNodePath({ wkOverride = '', proxyIp = '', forceProxy = false, outboundProxy = '' } = {}) {
  const params = new URLSearchParams();
  params.set('ed', '2048');
  if (wkOverride) params.set('wk', wkOverride);
  if (proxyIp) params.set('p', proxyIp);
  if (forceProxy) params.set('pm', '1');
  // پروکسی خروجی مخصوص همین نود (انتخاب کشوری) — runtime با پارامتر s آن را اعمال می‌کند
  if (outboundProxy) params.set('s', outboundProxy);
  return `/?${params.toString()}`;
}

// رندوم قابل‌تکرار (mulberry32) تا نودهای کشوری در یک روز ثابت بمانند
function seededRandom(seedText = '') {
  let h = 1779033703 ^ String(seedText).length;
  for (let i = 0; i < String(seedText).length; i++) {
    h = Math.imul(h ^ String(seedText).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// نودهای مولتی‌لوکیشن بر پایهٔ استخر پروکسی سالم تفکیک‌شده کشورها: هر نود
// آدرس لبه CF + پروکسی خروجی (s) کشور خودش را دارد تا مقاصد غیرکلودفلری هم کار کند.
function buildCountryProxyItems(cfg = {}, rand = Math.random) {
  if (!isEnabledValue(cfg.cpx, false)) return [];
  const total = Math.max(1, Math.min(200, parseInt(cfg.cpn, 10) || 24));
  const rawCodes = String(cfg.pcc ?? 'all').trim();
  const codes = rawCodes && rawCodes.toLowerCase() !== 'all'
    ? rawCodes.split(/[,\s|]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
    : Object.keys(PROXY_POOL.countries || {});
  const picks = pickProxiesAcrossCountries(codes, total, rand);
  return picks.map((pick, idx) => ({
    ip: edgeIpForIndex(idx, false),
    port: 443,
    isp: pick.country,
    loc: pick.country,
    outboundProxy: pick.s
  }));
}

// نودهای مولتی‌لوکیشن واقعی: آدرس = آی‌پی ثابت لبه کلودفلر، خروجی = آی‌پی ثابت لوکیشن
function buildLocationItems(cfg = {}) {
  const locations = parseLocationFilter(cfg.locs ?? 'all');
  return locations.map((loc, idx) => ({
    ip: edgeIpForIndex(idx, false),
    port: 443,
    isp: `${loc.code} · ${loc.name}`,
    loc: `${loc.code}-${loc.colo}`,
    proxyIp: `${loc.egress}:443`
  }));
}

function buildIpv6Items(cfg = {}) {
  if (!isEnabledValue(cfg.ipv6, true)) return [];
  return CLEAN_EDGE_IPV6.map((ip, idx) => ({
    ip,
    port: 443,
    isp: `IPv6-${idx + 1}`,
    loc: 'V6'
  }));
}

function buildIpv4FixedItems(cfg = {}) {
  if (!isEnabledValue(cfg.ipv4, true)) return [];
  const pool = CLEAN_EDGE_IPV4.length ? CLEAN_EDGE_IPV4 : OFFICIAL_DIRECT_IPS;
  return pool.map((ip, idx) => ({ ip, port: 443, isp: `CF-${idx + 1}` }));
}

function getNeighborRegions(region) {
  const map = {
    US: ['SG', 'JP', 'KR'],
    SG: ['JP', 'KR', 'US'],
    JP: ['SG', 'KR', 'US'],
    KR: ['JP', 'SG', 'US'],
    DE: ['NL', 'GB', 'SE', 'FI'],
    SE: ['DE', 'NL', 'FI', 'GB'],
    NL: ['DE', 'GB', 'SE', 'FI'],
    FI: ['SE', 'DE', 'NL', 'GB'],
    GB: ['DE', 'NL', 'SE', 'FI']
  };
  return map[region] || [];
}

function getOrderedRegions(region) {
  const neighbors = getNeighborRegions(region);
  const all = ['US', 'SG', 'JP', 'KR', 'DE', 'SE', 'NL', 'FI', 'GB'];
  return [region, ...neighbors, ...all.filter(r => r !== region && !neighbors.includes(r))];
}

export async function selectFallbackProxyAddress(workerRegion = '', enableRegionMatch = true) {
  if (!workerRegion || workerRegion === 'CF') {
    return getOfficialDirectAddress();
  }
  if (FALLBACK_PROXY_IPS.length === 0) {
    return getOfficialDirectAddress();
  }
  if (enableRegionMatch && workerRegion) {
    const ordered = getOrderedRegions(workerRegion);
    for (const r of ordered) {
      const found = FALLBACK_PROXY_IPS.find(item => item.regionCode === r);
      if (found) return found;
    }
  }
  return FALLBACK_PROXY_IPS[0];
}

export function getXhttpPaddingMeta(uuidStr) {
  const s = String(uuidStr || '');
  return {
    header: s.slice(1, 7) || 'x-mili',
    key: '_' + (s.slice(25, 31) || 'pad001')
  };
}

export function parseCustomPreferredString(yxStr = '') {
  const ipList = [];
  const domainList = [];
  if (!yxStr || !String(yxStr).trim()) {
    return { ipList, domainList };
  }
  const items = String(yxStr)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  for (const item of items) {
    let nodeName = '';
    let addrPart = item;
    if (item.includes('#')) {
      const parts = item.split('#');
      addrPart = parts[0].trim();
      nodeName = parts.slice(1).join('#').trim();
    }
    const { address, port } = parseAddressAndPort(addrPart);
    if (!address) continue;
    if (!nodeName) {
      nodeName = `${address}${port ? ':' + port : ''}`;
    }
    if (isValidIpAddress(address)) {
      ipList.push({ ip: address, port: port || 443, isp: nodeName, name: nodeName });
    } else if (isValidDomain(address) || address.includes('.')) {
      domainList.push({ domain: address, port: port || 443, name: nodeName });
    }
  }
  return { ipList, domainList };
}

export async function fetchUouinPreferredIps(cfg = {}) {
  const lineMap = {
    ctcc: '电信',
    cucc: '联通',
    cmcc: '移动',
    bgp: '多线',
    ipv6: 'IPv6'
  };
  const v4Enabled = cfg.ipv4 !== 'no';
  const v6Enabled = cfg.ipv6 !== 'no';
  const mobileEnabled = cfg.ispMobile !== 'no';
  const unicomEnabled = cfg.ispUnicom !== 'no';
  const telecomEnabled = cfg.ispTelecom !== 'no';

  try {
    const ts = String(Date.now());
    const innerHash = await md5Hex('DdlTxtN0sUOu');
    const keyHash = await md5Hex(innerHash + '70cloudflareapikey' + ts);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const resp = await fetch(`https://api.uouin.com/index.php/index/Cloudflare?key=${keyHash}&time=${ts}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return [];
    const data = await resp.json();
    const groups = data && data.data;
    if (!groups) return [];
    const results = [];
    for (const groupKey of Object.keys(lineMap)) {
      const isV6 = groupKey === 'ipv6';
      if (isV6 && !v6Enabled) continue;
      if (!isV6 && !v4Enabled) continue;
      const lineName = lineMap[groupKey];
      if (lineName === '移动' && !mobileEnabled) continue;
      if (lineName === '联通' && !unicomEnabled) continue;
      if (lineName === '电信' && !telecomEnabled) continue;
      const groupObj = groups[groupKey];
      const infoList = groupObj && Array.isArray(groupObj.info) ? groupObj.info : [];
      for (const entry of infoList) {
        const ip = normalizeNodeHost(entry && entry.ip);
        if (!ip) continue;
        results.push({ isp: lineName, ip, port: 443, colo: entry?.colo || '' });
      }
    }
    return results;
  } catch (_e) {
    return [];
  }
}

export async function fetchPreferredFromUrls(urlListStr = '', defaultPort = '443', timeout = 3000) {
  if (!urlListStr || !String(urlListStr).trim()) return [];
  const urls = String(urlListStr)
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);
  if (!urls.length) return [];

  const outSet = new Set();
  await Promise.allSettled(
    urls.map(async url => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) return;
        const text = await resp.text();
        if (!text || !text.trim()) return;
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        const isCsv = lines.length > 1 && lines[0].includes(',');
        const v6Pattern = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
        if (!isCsv) {
          for (const line of lines) {
            const hashIdx = line.indexOf('#');
            const [hostPart, remark] = hashIdx > -1 ? [line.substring(0, hashIdx), line.substring(hashIdx)] : [line, ''];
            let hasPort = false;
            if (hostPart.startsWith('[')) {
              hasPort = /\]:(\d+)$/.test(hostPart);
            } else {
              const colonIdx = hostPart.lastIndexOf(':');
              hasPort = colonIdx > -1 && /^\d+$/.test(hostPart.substring(colonIdx + 1));
            }
            const port = new URL(url).searchParams.get('port') || defaultPort;
            outSet.add(hasPort ? line : `${hostPart}:${port}${remark}`);
          }
        } else {
          const headers = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1);
          if (headers.includes('IP地址') && headers.includes('端口')) {
            const ipIdx = headers.indexOf('IP地址');
            const portIdx = headers.indexOf('端口');
            const tlsIdx = headers.indexOf('TLS');
            for (const row of dataRows) {
              const cols = row.split(',').map(c => c.trim());
              if (tlsIdx !== -1 && cols[tlsIdx]?.toLowerCase() !== 'true') continue;
              const wrapped = v6Pattern.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
              outSet.add(`${wrapped}:${cols[portIdx]}#CF`);
            }
          }
        }
      } catch (_e) {}
    })
  );

  const parsed = [];
  const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;
  for (const item of outSet) {
    const m = item.match(regex);
    if (m) {
      parsed.push({
        ip: normalizeNodeHost(m[1]),
        port: parseInt(m[2] || '443', 10),
        name: m[3]?.trim() || m[1]
      });
    }
  }
  return parsed;
}

function buildVlessLinks(list, userUuid, workerHost, cfg, namer, wkOverride = '') {
  const disableNonTls = cfg.dkby === 'yes' || cfg.ech === 'yes';
  const defaultHttps = [443];
  const defaultHttp = disableNonTls ? [] : [80];
  const links = [];
  const forceProxyGlobal = cfg.pm === 'yes' || cfg.pm === 'only';
  const alpn = normalizeAlpn(cfg.alpn);
  const enableEch = cfg.ech === 'yes';
  const dnsVal = cfg.customDNS || CONFIG_DEFAULTS.customDNS;
  const echDomain = cfg.customECHDomain || CONFIG_DEFAULTS.customECHDomain;

  for (const item of list) {
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const portsToGen = [];
    if (item.port) {
      const p = Number(item.port);
      if (CF_HTTPS_PORTS.includes(p)) {
        portsToGen.push({ port: p, tls: true });
      } else if (CF_HTTP_PORTS.includes(p)) {
        if (!disableNonTls) portsToGen.push({ port: p, tls: false });
      } else {
        portsToGen.push({ port: p, tls: true });
      }
    } else {
      defaultHttps.forEach(p => portsToGen.push({ port: p, tls: true }));
      defaultHttp.forEach(p => portsToGen.push({ port: p, tls: false }));
    }

    const wsPath = buildNodePath({
      wkOverride,
      proxyIp: item.proxyIp || '',
      forceProxy: Boolean(item.proxyIp) || forceProxyGlobal,
      outboundProxy: item.outboundProxy || ''
    });

    for (const { port, tls } of portsToGen) {
      const nodeName = item.loc ? `__loc_${item.loc}__` : namer(item);
      if (tls) {
        const params = new URLSearchParams({
          encryption: 'none',
          security: 'tls',
          sni: workerHost,
          fp: 'chrome',
          type: 'ws',
          host: workerHost,
          path: wsPath
        });
        if (alpn) params.set('alpn', alpn);
        if (enableEch) params.set('ech', `${echDomain}+${dnsVal}`);
        links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      } else {
        const params = new URLSearchParams({
          encryption: 'none',
          security: 'none',
          type: 'ws',
          host: workerHost,
          path: wsPath
        });
        links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      }
    }
  }
  return links;
}

function buildTrojanLinks(list, userUuid, workerHost, cfg, namer, wkOverride = '') {
  const disableNonTls = cfg.dkby === 'yes' || cfg.ech === 'yes';
  const defaultHttps = [443];
  const defaultHttp = disableNonTls ? [] : [80];
  const links = [];
  const forceProxyGlobal = cfg.pm === 'yes' || cfg.pm === 'only';
  const password = (cfg.tp && String(cfg.tp).trim()) || userUuid;
  const alpn = normalizeAlpn(cfg.alpn);
  const enableEch = cfg.ech === 'yes';
  const dnsVal = cfg.customDNS || CONFIG_DEFAULTS.customDNS;
  const echDomain = cfg.customECHDomain || CONFIG_DEFAULTS.customECHDomain;

  for (const item of list) {
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const portsToGen = [];
    if (item.port) {
      const p = Number(item.port);
      if (CF_HTTPS_PORTS.includes(p)) {
        portsToGen.push({ port: p, tls: true });
      } else if (CF_HTTP_PORTS.includes(p)) {
        if (!disableNonTls) portsToGen.push({ port: p, tls: false });
      } else {
        portsToGen.push({ port: p, tls: true });
      }
    } else {
      defaultHttps.forEach(p => portsToGen.push({ port: p, tls: true }));
      defaultHttp.forEach(p => portsToGen.push({ port: p, tls: false }));
    }

    const wsPath = buildNodePath({
      wkOverride,
      proxyIp: item.proxyIp || '',
      forceProxy: Boolean(item.proxyIp) || forceProxyGlobal,
      outboundProxy: item.outboundProxy || ''
    });

    for (const { port, tls } of portsToGen) {
      const nodeName = item.loc ? `__loc_${item.loc}__` : namer(item);
      if (tls) {
        const params = new URLSearchParams({
          security: 'tls',
          sni: workerHost,
          fp: 'chrome',
          type: 'ws',
          host: workerHost,
          path: wsPath
        });
        if (alpn) params.set('alpn', alpn);
        if (enableEch) params.set('ech', `${echDomain}+${dnsVal}`);
        links.push(`trojan://${encodeURIComponent(password)}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      } else {
        const params = new URLSearchParams({
          security: 'none',
          type: 'ws',
          host: workerHost,
          path: wsPath
        });
        links.push(`trojan://${encodeURIComponent(password)}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      }
    }
  }
  return links;
}

// لینک‌های Shadowsocks با پشتیبانی از چند رمزنگاری (SIP002 + v2ray-plugin)
function buildShadowsocksLinks(list, userUuid, workerHost, cfg, namer, wkOverride = '') {
  if (!isEnabledValue(cfg.ss, false)) return [];
  const ciphers = resolveSsCiphers(cfg.ssc);
  const password = String(cfg.ssp && String(cfg.ssp).trim() ? String(cfg.ssp).trim() : userUuid);
  const forceProxyGlobal = cfg.pm === 'yes' || cfg.pm === 'only';
  const links = [];

  for (const item of list) {
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const port = item.port || 443;
    const wsPath = buildNodePath({
      wkOverride,
      proxyIp: item.proxyIp || '',
      forceProxy: Boolean(item.proxyIp) || forceProxyGlobal,
      outboundProxy: item.outboundProxy || ''
    });
    const plugin = `v2ray-plugin;tls;host=${workerHost};path=${wsPath}`;

    for (const cipher of ciphers) {
      const credential = encodeBase64Utf8(`${cipher}:${password}`)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const tag = item.loc ? `__loc_${item.loc}__` : namer(item);
      links.push(
        `ss://${credential}@${safeAddr}:${port}?plugin=${encodeURIComponent(plugin)}#${encodeURIComponent(tag)}`
      );
    }
  }
  return links;
}

function buildXhttpLinks(list, userUuid, workerHost, cfg, namer) {
  const links = [];
  const shortPath = String(userUuid || '').substring(0, 8);
  const alpn = normalizeAlpn(cfg.alpn);
  const enableEch = cfg.ech === 'yes';
  const dnsVal = cfg.customDNS || CONFIG_DEFAULTS.customDNS;
  const echDomain = cfg.customECHDomain || CONFIG_DEFAULTS.customECHDomain;
  const { header: xPadHeader, key: xPadKey } = getXhttpPaddingMeta(userUuid);

  for (const item of list) {
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const port = item.port || 443;
    const nodeName = item.loc ? `__loc_${item.loc}__` : namer(item);
    const forceProxyGlobal = cfg.pm === 'yes' || cfg.pm === 'only';
    const xhttpQuery = [
      item.proxyIp ? `p=${encodeURIComponent(item.proxyIp)}` : '',
      item.proxyIp || forceProxyGlobal ? 'pm=1' : '',
      item.outboundProxy ? `s=${encodeURIComponent(item.outboundProxy)}` : ''
    ].filter(Boolean).join('&');
    const params = new URLSearchParams({
      encryption: 'none',
      security: 'tls',
      sni: workerHost,
      fp: 'chrome',
      type: 'xhttp',
      host: workerHost,
      path: `/${shortPath}${xhttpQuery ? `?${xhttpQuery}` : ''}`,
      mode: 'stream-one'
    });
    params.set(
      'extra',
      JSON.stringify({
        xPaddingObfsMode: true,
        xPaddingMethod: 'tokenish',
        xPaddingPlacement: 'queryInHeader',
        xPaddingHeader: xPadHeader,
        xPaddingKey: xPadKey
      })
    );
    if (alpn) params.set('alpn', alpn);
    if (enableEch) params.set('ech', `${echDomain}+${dnsVal}`);
    links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
  }
  return links;
}

// تولید لیست کامل لینک‌های نود برای کاربر با نام‌گذاری دقیق number+miliconfig و رعایت سقف تعداد نود در ساب
export async function generateUserNodesList(userOrConfig, workerHost, queryOverrides = {}) {
  const rawCfg = userOrConfig?.config ? userOrConfig.config : (userOrConfig || {});
  const cfg = normalizeEffectiveConfig(rawCfg);
  // امکان انتخاب لوکیشن از طریق ساب‌لینک:  ?locs=DE یا ?locs=DE,NL
  const locsOverride = String(queryOverrides.locs || '').trim();
  if (locsOverride) cfg.locs = locsOverride;
  const userUuid = String(userOrConfig?.uuid || queryOverrides.uuid || '351c9981-04b6-4103-aa4b-864aa9c91469').toLowerCase();
  const nodeScope = queryOverrides.scope || userOrConfig?.nodeScope || 'all';
  const wkOverride = (queryOverrides.wk || cfg.wk || '').trim().toUpperCase();
  const protoFilter = (queryOverrides.proto || '').trim().toLowerCase();

  const evEnabled = protoFilter ? protoFilter === 'vless' : isEnabledValue(cfg.ev, true);
  const etEnabled = protoFilter ? protoFilter === 'trojan' : isEnabledValue(cfg.et, false);
  const exEnabled = protoFilter ? protoFilter === 'xhttp' : isEnabledValue(cfg.ex, false);
  const ssEnabled = protoFilter ? protoFilter === 'ss' : isEnabledValue(cfg.ss, false);

  const namer = createMiliNodeNamer(BRAND_NAME);
  const rawLinks = [];

  function appendFromSource(sourceList) {
    if (!Array.isArray(sourceList) || sourceList.length === 0) return;
    if (evEnabled) rawLinks.push(...buildVlessLinks(sourceList, userUuid, workerHost, cfg, namer, wkOverride));
    if (etEnabled) rawLinks.push(...buildTrojanLinks(sourceList, userUuid, workerHost, cfg, namer, wkOverride));
    if (exEnabled) rawLinks.push(...buildXhttpLinks(sourceList, userUuid, workerHost, cfg, namer));
    if (ssEnabled) rawLinks.push(...buildShadowsocksLinks(sourceList, userUuid, workerHost, cfg, namer, wkOverride));
  }

  const disablePreferred = cfg.yxby === 'yes' || nodeScope === 'origin';
  const enableNative = cfg.ena === 'yes' || nodeScope === 'origin';

  // ۰) نودهای مولتی‌لوکیشن کشورمحور از استخر پروکسی سالم (cpx): هر نود با s خودش
  //    انتخاب‌ها بر اساس تاریخ تغییر می‌کنند (در طول یک روز پایدار می‌مانند).
  const countryProxyItems = buildCountryProxyItems(
    cfg,
    seededRandom(`${userUuid}|${new Date().toISOString().slice(0, 10)}`)
  );
  if (countryProxyItems.length > 0) {
    appendFromSource(countryProxyItems);
  }

  if (enableNative && nodeScope !== 'edge') {
    appendFromSource([{ ip: workerHost, isp: 'Origin' }]);
  }

  const { ipList: customIps, domainList: customDomains } = parseCustomPreferredString(cfg.yx);
  const hasCustomPreferred = customIps.length > 0 || customDomains.length > 0;

  if (!disablePreferred) {
    // ۱) لیست دستی مدیر اولویت دارد
    if (hasCustomPreferred) {
      if (customIps.length > 0 && cfg.epi === 'yes') {
        appendFromSource(customIps);
      }
      if (customDomains.length > 0 && cfg.epd === 'yes') {
        appendFromSource(customDomains.map(d => ({ ip: d.domain, port: d.port, isp: d.name || d.domain })));
      }
    }

    // ۲) نودهای مولتی‌لوکیشن واقعی: آی‌پی ثابت لبه + خروجی ثابت همان لوکیشن (p/pm)
    //    این نودها همیشه در ابتدای ساب هستند تا حتی با تعداد کم (مثلاً ۸ نود) هم دیده شوند.
    const locationItems = buildLocationItems(cfg);
    if (locationItems.length > 0 && nodeScope !== 'origin') {
      appendFromSource(locationItems);
    }

    // ۳) نودهای IPv4 ثابت و تست‌شده کلودفلر (بدون دامنه)
    const v4Items = buildIpv4FixedItems(cfg);
    if (v4Items.length > 0 && nodeScope !== 'origin') {
      appendFromSource(v4Items);
    }

    // ۴) نودهای IPv6 ثابت (همراه اول ایران / ایرانسل) با آدرس [IPv6]:443
    const v6Items = buildIpv6Items(cfg);
    if (v6Items.length > 0 && nodeScope !== 'origin') {
      appendFromSource(v6Items);
    }

    // ۵) منابع خارجی و لیست‌های پشتیبان در انتهای ساب
    if (!hasCustomPreferred) {
      if (cfg.epd === 'yes') {
        appendFromSource(DIRECT_DOMAINS.map(d => ({ ip: d.domain, isp: d.name || d.domain })));
      }
      if (cfg.epi === 'yes' && !cfg.yxURL) {
        const uouinList = await fetchUouinPreferredIps(cfg);
        if (uouinList.length > 0) {
          appendFromSource(uouinList);
        }
      }
      if (cfg.egi === 'yes' && cfg.yxURL) {
        const urlList = await fetchPreferredFromUrls(cfg.yxURL);
        if (urlList.length > 0) {
          appendFromSource(urlList);
        }
      }
      // اگر لیست خارجی در دسترس نبود، از استخر IPهای مستقیم تأییدشده CF اضافه می‌کنیم
      if (rawLinks.length < 15 && cfg.epi === 'yes') {
        appendFromSource(OFFICIAL_DIRECT_IPS.map(ip => ({ ip, port: 443, isp: 'CF-Direct' })));
      }
    }
  }

  if (rawLinks.length === 0) {
    appendFromSource([{ ip: workerHost, port: 443, isp: 'Origin' }]);
  }

  // حذف نودهای تکراری (آدرس + مسیر یکسان) تا ساب‌لینک تمیز بماند
  const uniqueLinks = [];
  const seenLinks = new Set();
  for (const link of rawLinks) {
    const key = link.split('#')[0];
    if (seenLinks.has(key)) continue;
    seenLinks.add(key);
    uniqueLinks.push(link);
  }

  const subNodeCount = queryOverrides.limit !== undefined
    ? parseInt(queryOverrides.limit, 10)
    : Number(userOrConfig?.subNodeCount ?? cfg.subNodeCount ?? 50);

  // اعمال دقیق نام‌گذاری number+miliconfig (به همراه برچسب لوکیشن) و سقف نودهای ساب
  const finalLinks = finalizeMiliSubscriptionLinks(uniqueLinks, subNodeCount, BRAND_NAME);
  // سه نود اطلاعاتی هاردکد در ابتدای همه ساب‌ها (خارج از سقف تنظیم‌شدهٔ کاربر)
  return prependInfoNodes(finalLinks);
}

// تشخیص خودکار کلاینت از User-Agent در صورت عدم ارسال پارامتر target
export function detectTargetFromRequest(request, url) {
  const explicit = url.searchParams.get('target');
  if (explicit && explicit.trim()) return explicit.trim().toLowerCase();
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (ua.includes('clash') || ua.includes('mihomo') || ua.includes('flclash') || ua.includes('stash') || ua.includes('verge')) {
    return 'clash';
  }
  if (ua.includes('sing-box') || ua.includes('singbox') || ua.includes('hiddify') || ua.includes('sfa') || ua.includes('sfm') || ua.includes('karing')) {
    return 'singbox';
  }
  if (ua.includes('surge')) return 'surge';
  if (ua.includes('quantumult')) return 'quanx';
  if (ua.includes('loon')) return 'loon';
  return 'base64';
}

export async function handleSubscriptionResponse(request, userOrConfig, url = null) {
  if (!url) url = new URL(request.url);
  const workerHost = url.hostname;
  const rawCfg = userOrConfig?.config ? userOrConfig.config : (userOrConfig || {});
  const cfg = normalizeEffectiveConfig(rawCfg);

  // بررسی وضعیت فعال بودن، حجم و انقضای کاربر
  if (userOrConfig && userOrConfig.enabled === false) {
    const disabledNode = `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?encryption=none&security=tls&type=ws#${encodeURIComponent('1+' + BRAND_NAME)}`;
    return new Response(btoa(disabledNode), {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const target = detectTargetFromRequest(request, url);
  const isJkTarget = ['vg', 'jk', 'jiakuan'].includes(target);
  if (isJkTarget && cfg.jk !== 'yes') {
    return new Response('زنجیره اینترنت خانگی فعال نیست. در پنل مدیریت miliconfig گزینه «فعال‌سازی زنجیره اینترنت خانگی (jk)» را روشن کنید.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const queryOverrides = {
    wk: url.searchParams.get('wk') || '',
    proto: url.searchParams.get('proto') || '',
    scope: url.searchParams.get('scope') || userOrConfig?.nodeScope || 'all',
    locs: url.searchParams.get('locs') || url.searchParams.get('loc') || '',
    limit: url.searchParams.get('limit') !== null ? url.searchParams.get('limit') : undefined
  };

  const finalLinks = await generateUserNodesList(userOrConfig, workerHost, queryOverrides);

  let bodyContent = '';
  let contentType = 'text/plain; charset=utf-8';

  switch (target) {
    case 'clash':
    case 'clashr':
    case 'stash':
    case 'meta':
    case 'clashmeta':
      bodyContent = generateClashConfig(finalLinks, cfg);
      contentType = 'text/yaml; charset=utf-8';
      break;
    case 'vg':
    case 'jk':
    case 'jiakuan':
      try {
        bodyContent = await generateResidentialChainConfig(finalLinks, {
          ...cfg,
          subNodeCount: userOrConfig?.subNodeCount ?? cfg.subNodeCount ?? 50
        });
        contentType = 'text/yaml; charset=utf-8';
      } catch (err) {
        return new Response('گره‌های اینترنت خانگی موقتاً در دسترس نیستند: ' + (err?.message || err), {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      break;
    case 'singbox':
    case 'sing-box':
      bodyContent = generateSingboxConfig(finalLinks, cfg);
      contentType = 'application/json; charset=utf-8';
      break;
    case 'surge':
    case 'surge2':
    case 'surge3':
    case 'surge4':
      bodyContent = generateSurgeConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'quantumult':
    case 'quanx':
      bodyContent = generateQuanxConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'loon':
      bodyContent = generateLoonConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'raw':
    case 'plain':
      bodyContent = finalLinks.join('\n');
      contentType = 'text/plain; charset=utf-8';
      break;
    default:
      bodyContent = btoa(finalLinks.join('\n'));
      contentType = 'text/plain; charset=utf-8';
      break;
  }

  const totalBytes = userOrConfig?.dataLimitGb > 0 ? Math.floor(userOrConfig.dataLimitGb * 1073741824) : 0;
  const usedBytes = Number(userOrConfig?.usedBytes || 0);
  // تفکیک واقعی آپلود/دانلود از همان اولین اتصال (fallback برای داده‌های قدیمی)
  const uploadBytes = Math.max(0, Number(userOrConfig?.uploadBytes || 0));
  const downloadBytes = Math.max(0, Number(userOrConfig?.downloadBytes || 0)) || Math.max(0, usedBytes - uploadBytes);
  const expireSec = userOrConfig?.expireAt > 0 ? Math.floor(userOrConfig.expireAt / 1000) : 0;
  const profileTitle = userOrConfig?.username ? `${BRAND_NAME} - ${userOrConfig.username}` : BRAND_NAME;

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Access-Control-Allow-Origin': '*',
    'Profile-Title': `base64:${encodeBase64Utf8(profileTitle)}`,
    'Profile-Update-Interval': '12',
    'Subscription-Userinfo': `upload=${uploadBytes}; download=${downloadBytes}; total=${totalBytes}; expire=${expireSec}`
  };

  if (cfg.ech === 'yes') {
    headers['X-ECH-Status'] = 'ENABLED';
  }

  return new Response(bodyContent, { headers });
}
