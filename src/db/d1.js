// ============================================================================
// miliconfig v3.1 - لایه دیتابیس Cloudflare D1 با تشخیص خودکار، Auto-Migration
// و Fallback هوشمند بدون خطا در استقرار دستی یا اتصال مستقیم گیت‌هاب
// ============================================================================

import {
  CONFIG_DEFAULTS,
  DEFAULT_ADMIN_UUID,
  getEnvConfigSnapshot,
  normalizeEffectiveConfig
} from '../config/defaults.js';
import { USER_PRESETS, buildUserDefaultConfig } from '../config/presets.js';
import { generateShortId, generateUuidV4, isValidUuid } from '../core/utils.js';

// پنجره تشخیص دستگاه/آی‌پی فعال برای قفل IP (۱۰ دقیقه)
export const IP_WINDOW_MS = 10 * 60 * 1000;

// حافظه کش داخلی هر Isolate جهت حداکثر سرعت و کارکرد بدون وقفه حتی بدون اتصال D1
const memoryStore = {
  initialized: false,
  d1SchemaReady: false,
  bootTime: Date.now(),
  globalConfig: {},
  users: new Map(),
  auditLogs: [],
  trafficHourly: new Map(),
  lastSyncAt: 0,
  adminKey: '',
  adminKeySource: '',
  userIps: new Map()
};

// ۱. تشخیص هوشمند اتصال دیتابیس D1 با هر نام متغیری (DB, D1, miliconfig_db و غیره)
export function detectD1Binding(env) {
  if (!env || typeof env !== 'object') return null;
  const priorityNames = ['DB', 'D1', 'db', 'd1', 'MILICONFIG_DB', 'miliconfig_db', 'DATABASE', 'database'];
  for (const name of priorityNames) {
    const candidate = env[name];
    if (candidate && typeof candidate === 'object' && typeof candidate.prepare === 'function') {
      return { db: candidate, bindingName: name };
    }
  }
  for (const [key, val] of Object.entries(env)) {
    if (val && typeof val === 'object' && typeof val.prepare === 'function') {
      return { db: val, bindingName: key };
    }
  }
  return null;
}

// ۲. تشخیص هوشمند اتصال فضای نام KV با هر نام متغیری (C, KV و غیره)
export function detectKvBinding(env) {
  if (!env || typeof env !== 'object') return null;
  const priorityNames = ['C', 'c', 'KV', 'kv', 'MILICONFIG_KV'];
  for (const name of priorityNames) {
    const candidate = env[name];
    if (
      candidate &&
      typeof candidate === 'object' &&
      typeof candidate.get === 'function' &&
      typeof candidate.put === 'function' &&
      typeof candidate.prepare !== 'function'
    ) {
      return { kv: candidate, bindingName: name };
    }
  }
  for (const [key, val] of Object.entries(env)) {
    if (
      val &&
      typeof val === 'object' &&
      typeof val.get === 'function' &&
      typeof val.put === 'function' &&
      typeof val.prepare !== 'function'
    ) {
      return { kv: val, bindingName: key };
    }
  }
  return null;
}

// جلوگیری از خطای D1_TYPE_ERROR در کلودفلر (تبدیل undefined به null یا مقدار پیش‌فرض)
function safeBind(stmt, ...params) {
  const sanitized = params.map(p => {
    if (p === undefined) return null;
    if (typeof p === 'number' && !Number.isFinite(p)) return 0;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
  return stmt.bind(...sanitized);
}

// دریافت توکن/UUID ادمین اصلی از متغیر محیطی u یا مقدار پیش‌فرض
export function getAdminUuid(env = {}) {
  const raw = env?.u || env?.U || env?.UUID || env?.uuid || memoryStore.adminKey || DEFAULT_ADMIN_UUID;
  return String(raw).trim().toLowerCase();
}

// شناسه‌ای که کاربر «سیستمی» اولیه با آن ساخته می‌شود. اگر مدیر متغیر u را
// تعیین کرده باشد همان مقدار استفاده می‌شود؛ در غیر این‌صورت کلید پیش‌فرض
// مستند. بدون این کار، وقتی u ست می‌شد ردیف سیستمی با UUID پیش‌فرض ساخته
// می‌شد و باز کردن /<UUID پیش‌فرض> به‌جای پنل، صفحه وضعیت همان ردیف را نشان می‌داد.
export function getSeedAdminUuid(env = {}) {
  const explicit = env?.u || env?.U || env?.UUID || env?.uuid;
  const value = explicit && String(explicit).trim() ? explicit : DEFAULT_ADMIN_UUID;
  return String(value).trim().toLowerCase();
}

// ساخت کلید ادمین یکتا برای هر استقرار (اگر کاربر متغیر u را تعیین نکرده باشد).
// کلید در D1/KV ذخیره می‌شود تا همه ایزوله‌ها و رفرش‌ها همان مسیر را ببینند و
// یک‌بار در لاگ Worker اعلام می‌شود تا در زمان استقرار قابل خواندن باشد.
export async function resolveAdminKey(env = {}) {
  const fromEnv = env?.u || env?.U || env?.UUID || env?.uuid;
  if (fromEnv && String(fromEnv).trim()) {
    memoryStore.adminKeySource = 'env';
    return String(fromEnv).trim().toLowerCase();
  }
  if (memoryStore.adminKey) return memoryStore.adminKey;

  const detectedD1 = detectD1Binding(env);
  const detectedKv = detectKvBinding(env);

  if (detectedD1) {
    try {
      await ensureD1Schema(env);
      const row = await detectedD1.db.prepare(`SELECT value FROM system_config WHERE key = ?`).bind('admin_key').first();
      if (row?.value && String(row.value).trim()) {
        memoryStore.adminKey = String(row.value).trim().toLowerCase();
        memoryStore.adminKeySource = 'd1';
        return memoryStore.adminKey;
      }
    } catch (_e) {}
  }
  if (detectedKv) {
    try {
      const stored = await detectedKv.kv.get('admin_key');
      if (stored && String(stored).trim()) {
        memoryStore.adminKey = String(stored).trim().toLowerCase();
        memoryStore.adminKeySource = 'kv';
        return memoryStore.adminKey;
      }
    } catch (_e) {}
  }

  // اگر هیچ مخزن پایدار (D1/KV) وجود ندارد، کلید ساخته‌شده در هر ایزوله عوض
  // می‌شد و استقرارکننده به پنل راه پیدا نمی‌کرد؛ در این حالت کلید پیش‌فرض
  // مستند (DEFAULT_ADMIN_UUID) که همان مقدار نمایش‌داده‌شده در فرم ورود است
  // استفاده می‌شود تا استقرار بدون دیتابیس هم قابل استفاده بماند.
  if (!detectedD1 && !detectedKv) {
    memoryStore.adminKeySource = 'default';
    return DEFAULT_ADMIN_UUID;
  }

  const generated = `mili-${generateUuidV4().replace(/-/g, '')}`;
  memoryStore.adminKey = generated;
  memoryStore.adminKeySource = 'generated';
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(`INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES ('admin_key', ?, ?)`),
        generated,
        Date.now()
      ).run();
    } catch (_e) {}
  }
  if (detectedKv) {
    try { await detectedKv.kv.put('admin_key', generated); } catch (_e) {}
  }
  console.log(`[miliconfig] ADMIN KEY: ${generated} — مسیر پنل شما /${generated} است. برای تغییر، متغیر محیطی u را تعیین کنید.`);
  return generated;
}

export function getAdminKeyInfo() {
  return {
    configured: Boolean(memoryStore.adminKey),
    source: memoryStore.adminKeySource || 'default',
    key: memoryStore.adminKey || ''
  };
}

// ۳. ساخت خودکار جداول D1 بدون استفاده از db.exec چندخطی (ضد خطای استقرار دستی D1)
export async function ensureD1Schema(env = {}, force = false) {
  const detected = detectD1Binding(env);
  if (!detected) {
    ensureMemorySeeded(env);
    return { d1Enabled: false, bindingName: null, migrated: false };
  }
  const { db, bindingName } = detected;
  if (memoryStore.d1SchemaReady && !force) {
    return { d1Enabled: true, bindingName, migrated: true };
  }

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      uuid TEXT NOT NULL UNIQUE,
      sub_node_count INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'active',
      enabled INTEGER NOT NULL DEFAULT 1,
      data_limit_gb REAL NOT NULL DEFAULT 0,
      used_bytes INTEGER NOT NULL DEFAULT 0,
      lifetime_bytes INTEGER NOT NULL DEFAULT 0,
      request_count INTEGER NOT NULL DEFAULT 0,
      expire_days INTEGER NOT NULL DEFAULT 0,
      expire_at INTEGER NOT NULL DEFAULT 0,
      start_on_first_use INTEGER NOT NULL DEFAULT 1,
      first_connected_at INTEGER NOT NULL DEFAULT 0,
      ip_limit INTEGER NOT NULL DEFAULT 50,
      node_scope TEXT NOT NULL DEFAULT 'all',
      preset TEXT NOT NULL DEFAULT 'iran-fast',
      note TEXT DEFAULT '',
      config_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS preferred_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 443,
      name TEXT NOT NULL,
      colo TEXT DEFAULT '',
      latency INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      ip TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS traffic_hourly (
      hour_key TEXT PRIMARY KEY,
      bytes INTEGER NOT NULL DEFAULT 0,
      requests INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS user_ips (
      user_id TEXT NOT NULL,
      ip TEXT NOT NULL,
      last_seen INTEGER NOT NULL,
      PRIMARY KEY (user_id, ip)
    )`
  ];

  try {
    for (const sql of ddlStatements) {
      await db.prepare(sql).run();
    }
    // ستون‌های مصرف تفکیکی (آپلود/دانلود) برای استقرارهای قدیمی‌تر؛
    // اگر ستون از قبل وجود داشته باشد، خطای duplicate قابل نادیده‌گرفتن است.
    for (const sql of [
      `ALTER TABLE users ADD COLUMN upload_bytes INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN download_bytes INTEGER NOT NULL DEFAULT 0`
    ]) {
      try { await db.prepare(sql).run(); } catch (_e) {}
    }
    memoryStore.d1SchemaReady = true;

    // بررسی وجود کاربر اولیه؛ در صورت خالی بودن جدول users یک کاربر پیش‌فرض می‌سازیم
    const countRow = await db.prepare(`SELECT COUNT(*) as cnt FROM users`).first();
    const totalUsers = Number(countRow?.cnt || 0);
    if (totalUsers === 0) {
      const adminUuid = getSeedAdminUuid(env);
      const envSnap = getEnvConfigSnapshot(env);
      const defaultUserConfig = buildUserDefaultConfig(envSnap, 'iran-fast', {
        subNodeCount: 50
      });
      const now = Date.now();
      const firstId = generateShortId('mili');
      await safeBind(
        db.prepare(
          `INSERT OR IGNORE INTO users (
            id, username, uuid, sub_node_count, status, enabled,
            data_limit_gb, used_bytes, lifetime_bytes, request_count,
            expire_days, expire_at, start_on_first_use, first_connected_at,
            ip_limit, node_scope, preset, note, config_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ),
        firstId,
        firstId,
        adminUuid,
        50,
        'active',
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        50,
        'all',
        'iran-fast',
        'کاربر پیش‌فرض اولیه سیستم miliconfig',
        JSON.stringify(defaultUserConfig),
        now,
        now
      ).run();

      await addAuditLog(env, 'ساخت خودکار دیتابیس D1', `${firstId} · iran-fast`, 'system');
    }

    // ترمیم استقرارهای قبلی: ردیف سیستمی که با UUID پیش‌فرض ساخته شده بود
    // باید با کلید فعلی ادمین هم‌خوان شود تا /<UUID پیش‌فرض> دیگر کاربر نباشد.
    const explicitKey = String(env?.u || env?.U || env?.UUID || env?.uuid || '').trim().toLowerCase();
    if (explicitKey && explicitKey !== DEFAULT_ADMIN_UUID) {
      try {
        await safeBind(
          db.prepare(`DELETE FROM users WHERE uuid = ? AND note LIKE ?`),
          DEFAULT_ADMIN_UUID,
          '%پیش‌فرض اولیه سیستم%'
        ).run();
      } catch (_e) {}
    }

    return { d1Enabled: true, bindingName, migrated: true };
  } catch (err) {
    ensureMemorySeeded(env);
    return {
      d1Enabled: false,
      bindingName,
      migrated: false,
      error: err?.message || String(err)
    };
  }
}

function ensureMemorySeeded(env = {}) {
  if (memoryStore.initialized) return;
  memoryStore.initialized = true;
  const adminUuid = getSeedAdminUuid(env);
  const envSnap = getEnvConfigSnapshot(env);
  memoryStore.globalConfig = { ...envSnap };

  if (memoryStore.users.size === 0) {
    const now = Date.now();
    const firstId = 'mili-default';
    const cfg = buildUserDefaultConfig(envSnap, 'iran-fast', { subNodeCount: 50 });
    memoryStore.users.set(firstId, {
      id: firstId,
      username: firstId,
      uuid: adminUuid,
      subNodeCount: 50,
      status: 'active',
      enabled: true,
      dataLimitGb: 0,
      usedBytes: 0,
      lifetimeBytes: 0,
      requestCount: 0,
      expireDays: 0,
      expireAt: 0,
      startOnFirstUse: true,
      firstConnectedAt: 0,
      ipLimit: 50,
      uploadBytes: 0,
      downloadBytes: 0,
      nodeScope: 'all',
      preset: 'iran-fast',
      note: 'کاربر پیش‌فرض اولیه miliconfig',
      config: cfg,
      createdAt: now,
      updatedAt: now
    });
    memoryStore.auditLogs.unshift({
      id: 1,
      action: 'راه‌اندازی اولیه سیستم',
      detail: `${firstId} · iran-fast`,
      ip: '127.0.0.1',
      createdAt: now
    });
  }
}

function mapUserRow(row) {
  if (!row) return null;
  let parsedConfig = {};
  try {
    parsedConfig = typeof row.config_json === 'string' ? JSON.parse(row.config_json) : (row.config_json || row.config || {});
  } catch (_e) {
    parsedConfig = {};
  }
  const subNodeCount = Number.isFinite(Number(row.sub_node_count ?? row.subNodeCount))
    ? Number(row.sub_node_count ?? row.subNodeCount)
    : Number(parsedConfig.subNodeCount ?? 50);
  const effectiveConfig = normalizeEffectiveConfig({
    ...CONFIG_DEFAULTS,
    ...parsedConfig,
    subNodeCount
  });
  return {
    id: String(row.id),
    username: String(row.username || row.id),
    uuid: String(row.uuid || '').toLowerCase(),
    subNodeCount,
    status: String(row.status || 'active'),
    enabled: Boolean(row.enabled === undefined ? true : Number(row.enabled) !== 0),
    dataLimitGb: Number(row.data_limit_gb ?? row.dataLimitGb ?? 0),
    usedBytes: Number(row.used_bytes ?? row.usedBytes ?? 0),
    uploadBytes: Number(row.upload_bytes ?? row.uploadBytes ?? 0),
    downloadBytes: Number(row.download_bytes ?? row.downloadBytes ?? 0),
    lifetimeBytes: Number(row.lifetime_bytes ?? row.lifetimeBytes ?? 0),
    requestCount: Number(row.request_count ?? row.requestCount ?? 0),
    expireDays: Number(row.expire_days ?? row.expireDays ?? 0),
    expireAt: Number(row.expire_at ?? row.expireAt ?? 0),
    startOnFirstUse: Boolean(row.start_on_first_use === undefined ? (row.startOnFirstUse ?? true) : Number(row.start_on_first_use) !== 0),
    firstConnectedAt: Number(row.first_connected_at ?? row.firstConnectedAt ?? 0),
    ipLimit: Number(row.ip_limit ?? row.ipLimit ?? 50),
    nodeScope: String(row.node_scope || row.nodeScope || 'all'),
    preset: String(row.preset || 'iran-fast'),
    note: String(row.note || ''),
    config: effectiveConfig,
    createdAt: Number(row.created_at ?? row.createdAt ?? Date.now()),
    updatedAt: Number(row.updated_at ?? row.updatedAt ?? Date.now())
  };
}

// ۴. مدیریت تنظیمات سراسری پنل (با پشتیبانی همزمان از D1 + KV + Env)
export async function loadGlobalConfig(env = {}, force = false) {
  await ensureD1Schema(env);
  const envSnap = getEnvConfigSnapshot(env);
  const detectedD1 = detectD1Binding(env);
  const detectedKv = detectKvBinding(env);

  if (!force && memoryStore.lastSyncAt > 0 && Date.now() - memoryStore.lastSyncAt < 15000) {
    return normalizeEffectiveConfig({
      ...CONFIG_DEFAULTS,
      ...envSnap,
      ...memoryStore.globalConfig
    });
  }

  let stored = {};
  if (detectedKv) {
    try {
      const kvRaw = await detectedKv.kv.get('c');
      if (kvRaw) stored = { ...stored, ...JSON.parse(kvRaw) };
    } catch (_e) {}
  }

  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      const res = await detectedD1.db.prepare(`SELECT key, value FROM system_config`).all();
      const rows = res?.results || [];
      for (const r of rows) {
        if (r && r.key) {
          stored[r.key] = r.value;
        }
      }
    } catch (_e) {}
  }

  memoryStore.globalConfig = { ...memoryStore.globalConfig, ...stored };
  memoryStore.lastSyncAt = Date.now();
  return normalizeEffectiveConfig({
    ...CONFIG_DEFAULTS,
    ...envSnap,
    ...memoryStore.globalConfig
  });
}

export async function saveGlobalConfig(env = {}, newValues = {}) {
  await ensureD1Schema(env);
  const detectedD1 = detectD1Binding(env);
  const detectedKv = detectKvBinding(env);
  const now = Date.now();

  for (const [k, v] of Object.entries(newValues || {})) {
    if (v === '' || v === null || v === undefined) {
      delete memoryStore.globalConfig[k];
    } else {
      memoryStore.globalConfig[k] = String(v);
    }
  }

  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      for (const [k, v] of Object.entries(newValues || {})) {
        if (v === '' || v === null || v === undefined) {
          await safeBind(detectedD1.db.prepare(`DELETE FROM system_config WHERE key = ?`), k).run();
        } else {
          await safeBind(
            detectedD1.db.prepare(
              `INSERT INTO system_config (key, value, updated_at) VALUES (?, ?, ?)
               ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
            ),
            k,
            String(v),
            now
          ).run();
        }
      }
    } catch (_e) {}
  }

  if (detectedKv) {
    try {
      await detectedKv.kv.put('c', JSON.stringify(memoryStore.globalConfig));
      await detectedKv.kv.put('c_ver', String(now));
    } catch (_e) {}
  }

  memoryStore.lastSyncAt = now;
  return await loadGlobalConfig(env, true);
}

export async function resetGlobalConfig(env = {}) {
  await ensureD1Schema(env);
  const detectedD1 = detectD1Binding(env);
  const detectedKv = detectKvBinding(env);
  memoryStore.globalConfig = {};

  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await detectedD1.db.prepare(`DELETE FROM system_config`).run();
    } catch (_e) {}
  }
  if (detectedKv) {
    try {
      await detectedKv.kv.put('c', JSON.stringify({}));
      await detectedKv.kv.put('c_ver', String(Date.now()));
    } catch (_e) {}
  }
  memoryStore.lastSyncAt = Date.now();
  return await loadGlobalConfig(env, true);
}

// ۵. عملیات کامل مدیریت کاربران (ایجاد، لیست، ویرایش، حذف، ریست ترافیک، جستجوی سریع)
export async function listUsers(env = {}) {
  await ensureD1Schema(env);
  const detectedD1 = detectD1Binding(env);

  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      const res = await detectedD1.db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all();
      const users = (res?.results || []).map(mapUserRow).filter(Boolean);
      memoryStore.users.clear();
      for (const u of users) memoryStore.users.set(u.id, u);
      return users;
    } catch (_e) {}
  }

  ensureMemorySeeded(env);
  return Array.from(memoryStore.users.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getUserByIdOrToken(env = {}, token = '') {
  if (!token) return null;
  const clean = String(token).trim();
  const cleanLower = clean.toLowerCase().replace(/^\/+|\/+$/g, '');
  const users = await listUsers(env);
  for (const u of users) {
    if (
      u.id.toLowerCase() === cleanLower ||
      u.uuid.toLowerCase() === cleanLower ||
      u.username.toLowerCase() === cleanLower ||
      (u.config?.d && u.config.d.trim().replace(/^\/+|\/+$/g, '').toLowerCase() === cleanLower)
    ) {
      return u;
    }
  }
  return null;
}

export async function createUser(env = {}, payload = {}, clientIp = '') {
  await ensureD1Schema(env);
  const globalCfg = await loadGlobalConfig(env);
  const now = Date.now();

  const presetId = payload.preset || 'iran-fast';
  const rawName = String(payload.username || payload.name || '').trim();
  const id = payload.id && String(payload.id).trim() ? String(payload.id).trim() : generateShortId('mili');
  const username = rawName || id;
  const uuid = isValidUuid(payload.uuid) ? String(payload.uuid).trim().toLowerCase() : generateUuidV4();

  const subNodeCountRaw = parseInt(payload.subNodeCount ?? payload.config?.subNodeCount ?? globalCfg.subNodeCount ?? 50, 10);
  const subNodeCount = Number.isFinite(subNodeCountRaw) && subNodeCountRaw >= 0 ? subNodeCountRaw : 50;

  // ادغام تمام ۳۱ تنظیم پیش‌فرض کد پایه + تنظیمات پنل + تنظیمات اختصاصی کاربر جدید
  const mergedUserConfig = buildUserDefaultConfig(
    payload.usePanelDefaults !== false ? globalCfg : CONFIG_DEFAULTS,
    presetId,
    {
      ...(payload.config || {}),
      wk: payload.wk ?? payload.config?.wk ?? globalCfg.wk ?? CONFIG_DEFAULTS.wk,
      ev: payload.ev ?? payload.config?.ev ?? globalCfg.ev ?? CONFIG_DEFAULTS.ev,
      et: payload.et ?? payload.config?.et ?? globalCfg.et ?? CONFIG_DEFAULTS.et,
      ex: payload.ex ?? payload.config?.ex ?? globalCfg.ex ?? CONFIG_DEFAULTS.ex,
      ech: payload.ech ?? payload.config?.ech ?? globalCfg.ech ?? CONFIG_DEFAULTS.ech,
      tp: payload.tp ?? payload.config?.tp ?? globalCfg.tp ?? CONFIG_DEFAULTS.tp,
      customDNS: payload.customDNS ?? payload.config?.customDNS ?? globalCfg.customDNS ?? CONFIG_DEFAULTS.customDNS,
      customECHDomain: payload.customECHDomain ?? payload.config?.customECHDomain ?? globalCfg.customECHDomain ?? CONFIG_DEFAULTS.customECHDomain,
      alpn: payload.alpn ?? payload.config?.alpn ?? globalCfg.alpn ?? CONFIG_DEFAULTS.alpn,
      d: payload.d ?? payload.config?.d ?? '',
      p: payload.p ?? payload.config?.p ?? globalCfg.p ?? CONFIG_DEFAULTS.p,
      yx: payload.yx ?? payload.config?.yx ?? globalCfg.yx ?? CONFIG_DEFAULTS.yx,
      yxURL: payload.yxURL ?? payload.config?.yxURL ?? globalCfg.yxURL ?? CONFIG_DEFAULTS.yxURL,
      s: payload.s ?? payload.config?.s ?? globalCfg.s ?? CONFIG_DEFAULTS.s,
      homepage: payload.homepage ?? payload.config?.homepage ?? globalCfg.homepage ?? CONFIG_DEFAULTS.homepage,
      scu: payload.scu ?? payload.config?.scu ?? globalCfg.scu ?? CONFIG_DEFAULTS.scu,
      ena: payload.ena ?? payload.config?.ena ?? globalCfg.ena ?? CONFIG_DEFAULTS.ena,
      epd: payload.epd ?? payload.config?.epd ?? globalCfg.epd ?? CONFIG_DEFAULTS.epd,
      epi: payload.epi ?? payload.config?.epi ?? globalCfg.epi ?? CONFIG_DEFAULTS.epi,
      egi: payload.egi ?? payload.config?.egi ?? globalCfg.egi ?? CONFIG_DEFAULTS.egi,
      ae: payload.ae ?? payload.config?.ae ?? globalCfg.ae ?? CONFIG_DEFAULTS.ae,
      rm: payload.rm ?? payload.config?.rm ?? globalCfg.rm ?? CONFIG_DEFAULTS.rm,
      qj: payload.qj ?? payload.config?.qj ?? globalCfg.qj ?? CONFIG_DEFAULTS.qj,
      dkby: payload.dkby ?? payload.config?.dkby ?? globalCfg.dkby ?? CONFIG_DEFAULTS.dkby,
      yxby: payload.yxby ?? payload.config?.yxby ?? globalCfg.yxby ?? CONFIG_DEFAULTS.yxby,
      ipv4: payload.ipv4 ?? payload.config?.ipv4 ?? globalCfg.ipv4 ?? CONFIG_DEFAULTS.ipv4,
      ipv6: payload.ipv6 ?? payload.config?.ipv6 ?? globalCfg.ipv6 ?? CONFIG_DEFAULTS.ipv6,
      ispMobile: payload.ispMobile ?? payload.config?.ispMobile ?? globalCfg.ispMobile ?? CONFIG_DEFAULTS.ispMobile,
      ispUnicom: payload.ispUnicom ?? payload.config?.ispUnicom ?? globalCfg.ispUnicom ?? CONFIG_DEFAULTS.ispUnicom,
      ispTelecom: payload.ispTelecom ?? payload.config?.ispTelecom ?? globalCfg.ispTelecom ?? CONFIG_DEFAULTS.ispTelecom,
      jk: payload.jk ?? payload.config?.jk ?? globalCfg.jk ?? CONFIG_DEFAULTS.jk,
      subNodeCount
    }
  );

  // پریست انتخابی باید نسبت به پیش‌فرض‌های پنل اولویت داشته باشد؛
  // فقط فیلدهایی که مدیر صریحاً فرستاده باشد آن را بازنویسی می‌کنند.
  const presetDef = USER_PRESETS[presetId];
  if (presetDef && presetDef.configOverrides) {
    for (const [key, value] of Object.entries(presetDef.configOverrides)) {
      const explicitlySet = payload[key] !== undefined || payload.config?.[key] !== undefined;
      if (!explicitlySet) mergedUserConfig[key] = value;
    }
  }

  const dataLimitGb = Math.max(0, Number(payload.dataLimitGb ?? 0) || 0);
  const expireDays = Math.max(0, parseInt(payload.expireDays ?? 0, 10) || 0);
  const startOnFirstUse = payload.startOnFirstUse !== undefined ? Boolean(payload.startOnFirstUse) : true;
  const expireAt = !startOnFirstUse && expireDays > 0 ? now + expireDays * 86400 * 1000 : 0;
  const ipLimit = Math.max(1, parseInt(payload.ipLimit ?? 50, 10) || 50);
  const nodeScope = String(payload.nodeScope || 'all');
  const enabled = payload.enabled !== undefined ? Boolean(payload.enabled) : true;
  const note = String(payload.note || '');

  const userObj = {
    id,
    username,
    uuid,
    subNodeCount,
    status: enabled ? 'active' : 'disabled',
    enabled,
    dataLimitGb,
    usedBytes: 0,
    lifetimeBytes: 0,
    requestCount: 0,
    expireDays,
    expireAt,
    startOnFirstUse,
    firstConnectedAt: 0,
    ipLimit,
    nodeScope,
    preset: presetId,
    note,
    config: mergedUserConfig,
    createdAt: now,
    updatedAt: now
  };

  memoryStore.users.set(id, userObj);

  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(
          `INSERT INTO users (
            id, username, uuid, sub_node_count, status, enabled,
            data_limit_gb, used_bytes, lifetime_bytes, request_count,
            expire_days, expire_at, start_on_first_use, first_connected_at,
            ip_limit, node_scope, preset, note, config_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ),
        userObj.id,
        userObj.username,
        userObj.uuid,
        userObj.subNodeCount,
        userObj.status,
        userObj.enabled ? 1 : 0,
        userObj.dataLimitGb,
        0,
        0,
        0,
        userObj.expireDays,
        userObj.expireAt,
        userObj.startOnFirstUse ? 1 : 0,
        0,
        userObj.ipLimit,
        userObj.nodeScope,
        userObj.preset,
        userObj.note,
        JSON.stringify(userObj.config),
        now,
        now
      ).run();
    } catch (_e) {}
  }

  await addAuditLog(env, 'ساخت سریع کاربر', `${userObj.username} · ${presetId}`, clientIp);
  return userObj;
}

export async function updateUser(env = {}, userId, payload = {}, clientIp = '') {
  const existing = await getUserByIdOrToken(env, userId);
  if (!existing) return null;
  const now = Date.now();

  const subNodeCountRaw = parseInt(
    payload.subNodeCount ?? payload.config?.subNodeCount ?? existing.subNodeCount ?? 50,
    10
  );
  const subNodeCount = Number.isFinite(subNodeCountRaw) && subNodeCountRaw >= 0 ? subNodeCountRaw : existing.subNodeCount;

  const updatedConfig = normalizeEffectiveConfig({
    ...existing.config,
    ...(payload.config || {}),
    ...(payload.wk !== undefined ? { wk: payload.wk } : {}),
    ...(payload.ev !== undefined ? { ev: payload.ev } : {}),
    ...(payload.et !== undefined ? { et: payload.et } : {}),
    ...(payload.ex !== undefined ? { ex: payload.ex } : {}),
    ...(payload.ech !== undefined ? { ech: payload.ech } : {}),
    ...(payload.tp !== undefined ? { tp: payload.tp } : {}),
    ...(payload.customDNS !== undefined ? { customDNS: payload.customDNS } : {}),
    ...(payload.customECHDomain !== undefined ? { customECHDomain: payload.customECHDomain } : {}),
    ...(payload.alpn !== undefined ? { alpn: payload.alpn } : {}),
    ...(payload.d !== undefined ? { d: payload.d } : {}),
    ...(payload.p !== undefined ? { p: payload.p } : {}),
    ...(payload.yx !== undefined ? { yx: payload.yx } : {}),
    ...(payload.yxURL !== undefined ? { yxURL: payload.yxURL } : {}),
    ...(payload.s !== undefined ? { s: payload.s } : {}),
    ...(payload.homepage !== undefined ? { homepage: payload.homepage } : {}),
    ...(payload.scu !== undefined ? { scu: payload.scu } : {}),
    ...(payload.ena !== undefined ? { ena: payload.ena } : {}),
    ...(payload.epd !== undefined ? { epd: payload.epd } : {}),
    ...(payload.epi !== undefined ? { epi: payload.epi } : {}),
    ...(payload.egi !== undefined ? { egi: payload.egi } : {}),
    ...(payload.ae !== undefined ? { ae: payload.ae } : {}),
    ...(payload.rm !== undefined ? { rm: payload.rm } : {}),
    ...(payload.qj !== undefined ? { qj: payload.qj } : {}),
    ...(payload.dkby !== undefined ? { dkby: payload.dkby } : {}),
    ...(payload.yxby !== undefined ? { yxby: payload.yxby } : {}),
    ...(payload.ipv4 !== undefined ? { ipv4: payload.ipv4 } : {}),
    ...(payload.ipv6 !== undefined ? { ipv6: payload.ipv6 } : {}),
    ...(payload.ispMobile !== undefined ? { ispMobile: payload.ispMobile } : {}),
    ...(payload.ispUnicom !== undefined ? { ispUnicom: payload.ispUnicom } : {}),
    ...(payload.ispTelecom !== undefined ? { ispTelecom: payload.ispTelecom } : {}),
    ...(payload.jk !== undefined ? { jk: payload.jk } : {}),
    subNodeCount
  });

  const enabled = payload.enabled !== undefined ? Boolean(payload.enabled) : existing.enabled;
  const expireDays = payload.expireDays !== undefined ? Math.max(0, parseInt(payload.expireDays, 10) || 0) : existing.expireDays;
  const startOnFirstUse = payload.startOnFirstUse !== undefined ? Boolean(payload.startOnFirstUse) : existing.startOnFirstUse;
  let expireAt = existing.expireAt;
  if (payload.expireDays !== undefined) {
    expireAt = !startOnFirstUse && expireDays > 0 ? now + expireDays * 86400 * 1000 : 0;
  }

  const updated = {
    ...existing,
    username: payload.username !== undefined && String(payload.username).trim() ? String(payload.username).trim() : existing.username,
    uuid: payload.uuid && isValidUuid(payload.uuid) ? String(payload.uuid).trim().toLowerCase() : existing.uuid,
    subNodeCount,
    enabled,
    status: enabled ? 'active' : 'disabled',
    dataLimitGb: payload.dataLimitGb !== undefined ? Math.max(0, Number(payload.dataLimitGb) || 0) : existing.dataLimitGb,
    expireDays,
    expireAt,
    startOnFirstUse,
    ipLimit: payload.ipLimit !== undefined ? Math.max(1, parseInt(payload.ipLimit, 10) || 50) : existing.ipLimit,
    nodeScope: payload.nodeScope !== undefined ? String(payload.nodeScope) : existing.nodeScope,
    preset: payload.preset !== undefined ? String(payload.preset) : existing.preset,
    note: payload.note !== undefined ? String(payload.note) : existing.note,
    config: updatedConfig,
    updatedAt: now
  };

  memoryStore.users.set(existing.id, updated);

  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(
          `UPDATE users SET
            username = ?, uuid = ?, sub_node_count = ?, status = ?, enabled = ?,
            data_limit_gb = ?, expire_days = ?, expire_at = ?, start_on_first_use = ?,
            ip_limit = ?, node_scope = ?, preset = ?, note = ?, config_json = ?, updated_at = ?
           WHERE id = ?`
        ),
        updated.username,
        updated.uuid,
        updated.subNodeCount,
        updated.status,
        updated.enabled ? 1 : 0,
        updated.dataLimitGb,
        updated.expireDays,
        updated.expireAt,
        updated.startOnFirstUse ? 1 : 0,
        updated.ipLimit,
        updated.nodeScope,
        updated.preset,
        updated.note,
        JSON.stringify(updated.config),
        now,
        existing.id
      ).run();
    } catch (_e) {}
  }

  await addAuditLog(env, 'ویرایش کاربر', `${updated.username}`, clientIp);
  return updated;
}

export async function resetUserStats(env = {}, userId, clientIp = '') {
  const existing = await getUserByIdOrToken(env, userId);
  if (!existing) return null;
  const now = Date.now();
  const updated = {
    ...existing,
    usedBytes: 0,
    uploadBytes: 0,
    downloadBytes: 0,
    requestCount: 0,
    firstConnectedAt: 0,
    expireAt: !existing.startOnFirstUse && existing.expireDays > 0 ? now + existing.expireDays * 86400 * 1000 : 0,
    updatedAt: now
  };
  memoryStore.users.set(existing.id, updated);

  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(
          `UPDATE users SET used_bytes = 0, upload_bytes = 0, download_bytes = 0, request_count = 0, first_connected_at = 0, expire_at = ?, updated_at = ? WHERE id = ?`
        ),
        updated.expireAt,
        now,
        existing.id
      ).run();
    } catch (_e) {}
  }
  await addAuditLog(env, 'صفر کردن مصرف کاربر', `${existing.username}`, clientIp);
  return updated;
}

export async function deleteUser(env = {}, userId, clientIp = '') {
  const existing = await getUserByIdOrToken(env, userId);
  if (!existing) return false;
  memoryStore.users.delete(existing.id);

  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(detectedD1.db.prepare(`DELETE FROM users WHERE id = ?`), existing.id).run();
    } catch (_e) {}
  }
  await addAuditLog(env, 'حذف کاربر', `${existing.username}`, clientIp);
  return true;
}

// ثبت مصرف واقعی کاربر. ورودی جدید: { up, down, requests } و فرم قدیمی
// (bytesDelta, reqDelta) هنوز کار می‌کند تا کدهای موجود نشکنند.
export async function recordUserActivity(env = {}, userId, bytesOrPayload = 0, reqDelta = 1) {
  if (!userId) return;
  const payload = bytesOrPayload && typeof bytesOrPayload === 'object'
    ? bytesOrPayload
    : { down: bytesOrPayload, requests: reqDelta };
  const upBytes = Math.max(0, Number(payload.up) || 0);
  const downBytes = Math.max(0, Number(payload.down) || 0);
  const reqCount = Math.max(0, Number(payload.requests ?? 0) || 0);
  const totalBytes = upBytes + downBytes;
  const now = Date.now();
  const hourKey = new Date(now).toISOString().slice(0, 13);
  const prevHour = memoryStore.trafficHourly.get(hourKey) || { bytes: 0, requests: 0 };
  prevHour.bytes += totalBytes;
  prevHour.requests += reqCount;
  memoryStore.trafficHourly.set(hourKey, prevHour);

  const u = memoryStore.users.get(userId);
  if (u) {
    u.usedBytes = (u.usedBytes || 0) + totalBytes;
    u.uploadBytes = (u.uploadBytes || 0) + upBytes;
    u.downloadBytes = (u.downloadBytes || 0) + downBytes;
    u.lifetimeBytes = (u.lifetimeBytes || 0) + totalBytes;
    u.requestCount = (u.requestCount || 0) + reqCount;
    // شروع واقعی انقضا فقط با اولین اتصال کاربر
    if (!u.firstConnectedAt && (totalBytes > 0 || reqCount > 0)) {
      u.firstConnectedAt = now;
      if (u.startOnFirstUse && u.expireDays > 0 && !u.expireAt) {
        u.expireAt = now + u.expireDays * 86400 * 1000;
      }
    }
    u.updatedAt = now;
  }

  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(
          `UPDATE users SET
            used_bytes = used_bytes + ?,
            lifetime_bytes = lifetime_bytes + ?,
            upload_bytes = upload_bytes + ?,
            download_bytes = download_bytes + ?,
            request_count = request_count + ?,
            first_connected_at = CASE WHEN first_connected_at = 0 THEN ? ELSE first_connected_at END,
            expire_at = CASE WHEN start_on_first_use = 1 AND expire_days > 0 AND expire_at = 0 THEN ? + (expire_days * 86400000) ELSE expire_at END,
            updated_at = ?
           WHERE id = ?`
        ),
        totalBytes,
        totalBytes,
        upBytes,
        downBytes,
        reqCount,
        now,
        now,
        now,
        userId
      ).run();
    } catch (_e) {
      // اگر ستون‌های تفکیکی در دیتابیس قدیمی وجود نداشتند، ثبت مصرف متوقف نشود
      try {
        await safeBind(
          detectedD1.db.prepare(
            `UPDATE users SET
              used_bytes = used_bytes + ?,
              lifetime_bytes = lifetime_bytes + ?,
              request_count = request_count + ?,
              updated_at = ?
             WHERE id = ?`
          ),
          totalBytes,
          totalBytes,
          reqCount,
          now,
          userId
        ).run();
      } catch (_e2) {}
    }
  }
}

// ============================================================================
// قفل آی‌پی/دستگاه (ipLimit): تعداد دستگاه‌های فعال هر کاربر در یک پنجره زمانی
// محدود می‌شود. داده در D1 ذخیره می‌شود تا در همه ایزوله‌ها معتبر باشد.
// ============================================================================
function normalizeIpText(ip = '') {
  const text = String(ip || '').trim();
  if (!text) return '';
  return text.startsWith('::ffff:') ? text.slice(7) : text;
}

export async function checkUserIpLimit(env = {}, user = null, clientIp = '', windowMs = IP_WINDOW_MS) {
  const limit = Math.max(1, parseInt(user?.ipLimit, 10) || 50);
  const ip = normalizeIpText(clientIp);
  if (!user?.id || !ip) return { allowed: true, active: 0, limit, reason: '' };

  const now = Date.now();
  const since = now - Math.max(60000, Number(windowMs) || IP_WINDOW_MS);
  const detectedD1 = detectD1Binding(env);

  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      // پاکسازی دوره‌ای ردیف‌های منقضی (نه در هر اتصال) تا تعداد نوشتن کم بماند
      if (Math.random() < 0.15) {
        await safeBind(detectedD1.db.prepare(`DELETE FROM user_ips WHERE last_seen < ?`), since).run();
      }
      const res = await safeBind(
        detectedD1.db.prepare(`SELECT ip FROM user_ips WHERE user_id = ? AND last_seen >= ?`),
        user.id,
        since
      ).all();
      const ips = (res?.results || []).map(r => normalizeIpText(r.ip)).filter(Boolean);
      const known = ips.includes(ip);
      if (!known && ips.length >= limit) {
        return { allowed: false, active: ips.length, limit, reason: 'ip-limit-reached' };
      }
      await safeBind(
        detectedD1.db.prepare(`INSERT OR REPLACE INTO user_ips (user_id, ip, last_seen) VALUES (?, ?, ?)`),
        user.id,
        ip,
        now
      ).run();
      return { allowed: true, active: known ? ips.length : ips.length + 1, limit, reason: '' };
    } catch (_e) {
      // در صورت خطای D1 به مسیر حافظه برمی‌گردیم تا کاربر بلوکه نشود
    }
  }

  const bucket = memoryStore.userIps.get(user.id) || new Map();
  for (const [key, seen] of bucket) {
    if (seen < since) bucket.delete(key);
  }
  const known = bucket.has(ip);
  if (!known && bucket.size >= limit) {
    return { allowed: false, active: bucket.size, limit, reason: 'ip-limit-reached' };
  }
  bucket.set(ip, now);
  memoryStore.userIps.set(user.id, bucket);
  return { allowed: true, active: bucket.size, limit, reason: '' };
}

// فهرست دستگاه‌های فعال یک کاربر (برای نمایش در پنل)
export async function listUserActiveIps(env = {}, userId = '', windowMs = IP_WINDOW_MS) {
  if (!userId) return [];
  const since = Date.now() - Math.max(60000, Number(windowMs) || IP_WINDOW_MS);
  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      const res = await safeBind(
        detectedD1.db.prepare(`SELECT ip, last_seen FROM user_ips WHERE user_id = ? AND last_seen >= ? ORDER BY last_seen DESC`),
        userId,
        since
      ).all();
      if (res?.results?.length) {
        return res.results.map(r => ({ ip: normalizeIpText(r.ip), lastSeen: Number(r.last_seen) || 0 }));
      }
    } catch (_e) {}
  }
  const bucket = memoryStore.userIps.get(userId) || new Map();
  return [...bucket.entries()]
    .filter(([, seen]) => seen >= since)
    .map(([ip, seen]) => ({ ip, lastSeen: seen }));
}

export async function releaseUserIps(env = {}, userId = '') {
  if (!userId) return false;
  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(detectedD1.db.prepare(`DELETE FROM user_ips WHERE user_id = ?`), userId).run();
    } catch (_e) {}
  }
  memoryStore.userIps.delete(userId);
  return true;
}

export async function addAuditLog(env = {}, action, detail = '', ip = '') {
  const now = Date.now();
  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    action: String(action || ''),
    detail: String(detail || ''),
    ip: String(ip || ''),
    createdAt: now
  });
  if (memoryStore.auditLogs.length > 50) {
    memoryStore.auditLogs.length = 50;
  }
  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      await safeBind(
        detectedD1.db.prepare(`INSERT INTO audit_logs (action, detail, ip, created_at) VALUES (?, ?, ?, ?)`),
        String(action || ''),
        String(detail || ''),
        String(ip || ''),
        now
      ).run();
    } catch (_e) {}
  }
}

export async function getAuditLogs(env = {}, limit = 15) {
  await ensureD1Schema(env);
  const detectedD1 = detectD1Binding(env);
  if (detectedD1 && memoryStore.d1SchemaReady) {
    try {
      const res = await safeBind(
        detectedD1.db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`),
        limit
      ).all();
      if (res?.results?.length) {
        return res.results.map(r => ({
          id: r.id,
          action: r.action,
          detail: r.detail,
          ip: r.ip,
          createdAt: r.created_at
        }));
      }
    } catch (_e) {}
  }
  return memoryStore.auditLogs.slice(0, limit);
}

export async function getStorageDiagnostics(env = {}) {
  const d1State = await ensureD1Schema(env);
  const kvDetected = detectKvBinding(env);
  const users = await listUsers(env);
  const logs = await getAuditLogs(env, 12);
  let totalUsedBytes = 0;
  let totalLifetimeBytes = 0;
  let totalRequests = 0;
  let activeUsers = 0;
  for (const u of users) {
    totalUsedBytes += u.usedBytes || 0;
    totalLifetimeBytes += u.lifetimeBytes || 0;
    totalRequests += u.requestCount || 0;
    if (u.enabled) activeUsers += 1;
  }

  return {
    d1Enabled: d1State.d1Enabled,
    d1BindingName: d1State.bindingName || 'DB',
    d1Migrated: d1State.migrated,
    d1Error: d1State.error || null,
    kvEnabled: Boolean(kvDetected),
    kvBindingName: kvDetected?.bindingName || 'C',
    uptimeMs: Date.now() - memoryStore.bootTime,
    bootTime: memoryStore.bootTime,
    totalUsers: users.length,
    activeUsers,
    disabledUsers: Math.max(0, users.length - activeUsers),
    totalUsedBytes,
    totalLifetimeBytes,
    totalRequests,
    recentLogs: logs
  };
}
