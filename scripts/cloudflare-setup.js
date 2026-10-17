#!/usr/bin/env node
// ============================================================================
// miliconfig - راه‌اندازی خودکار استقرار روی Cloudflare Pages
// ----------------------------------------------------------------------------
// این اسکریپت با یک توکن API این کارها را انجام می‌دهد:
//   ۱. ساخت دیتابیس D1 (اگر وجود نداشته باشد)
//   ۲. ساخت یا به‌روزرسانی پروژه Pages
//   ۳. ساختن و ست‌کردن همه متغیرهای محیطی لازم (u و BRAND) + بایند D1
//   ۴. چاپ مسیر پنل ادمین مخصوص همین استقرار
//
// اجرا:
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/cloudflare-setup.js
// یا:
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npm run cf:setup
//
// اختیاری:
//   PROJECT_NAME       نام پروژه Pages (پیش‌فرض: mili-cfg)
//   D1_NAME            نام دیتابیس D1    (پیش‌فرض: miliconfig-db)
//   ADMIN_KEY          کلید/مسیر ادمین دلخواه؛ اگر ندهید یک کلید یکتا ساخته می‌شود
//   BRAND              نام برند           (پیش‌فرض: miliconfig)
//   PRODUCTION_BRANCH  شاخه تولید         (پیش‌فرض: main)
//
// نکته امنیتی: توکن را هیچ‌وقت داخل فایل یا گیت نگذارید؛ فقط از طریق متغیر محیطی.
// ============================================================================
import crypto from 'node:crypto';

const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '';
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '';
const PROJECT_NAME = process.env.PROJECT_NAME || 'mili-cfg';
const D1_NAME = process.env.D1_NAME || 'miliconfig-db';
const BRAND = process.env.BRAND || 'miliconfig';
const PRODUCTION_BRANCH = process.env.PRODUCTION_BRANCH || 'main';

if (!TOKEN || !ACCOUNT) {
  console.error('❌ متغیرهای CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID لازم است.');
  console.error('   نمونه: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npm run cf:setup');
  process.exit(1);
}

async function cf(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try {
    json = await res.json();
  } catch (_e) {
    json = null;
  }
  return { status: res.status, ok: res.ok && (!json || json.success !== false), json };
}

function fail(step, result) {
  const errors = result?.json?.errors;
  const message = Array.isArray(errors) && errors.length
    ? errors.map(e => `${e.code ?? ''} ${e.message ?? ''}`.trim()).join(' | ')
    : `HTTP ${result?.status}`;
  console.error(`❌ ${step} ناموفق بود: ${message}`);
}

// مسیر ادمین یکتا برای همین استقرار
function makeAdminKey() {
  const custom = String(process.env.ADMIN_KEY || '').trim();
  if (custom) return custom.toLowerCase().replace(/^\/+|\/+$/g, '');
  return `mili-${crypto.randomUUID().replace(/-/g, '')}`;
}

const adminKey = makeAdminKey();

async function ensureD1() {
  const list = await cf('GET', `/accounts/${ACCOUNT}/d1/database?per_page=100`);
  if (!list.ok) {
    fail('خواندن فهرست D1', list);
    return null;
  }
  const found = (list.json?.result || []).find(db => db.name === D1_NAME);
  if (found) {
    console.log(`✅ دیتابیس D1 موجود است: ${found.name} (${found.uuid})`);
    return found;
  }
  const created = await cf('POST', `/accounts/${ACCOUNT}/d1/database`, { name: D1_NAME });
  if (!created.ok) {
    fail('ساخت دیتابیس D1', created);
    return null;
  }
  console.log(`✅ دیتابیس D1 ساخته شد: ${D1_NAME} (${created.json.result.uuid})`);
  return created.json.result;
}

async function ensureProject(d1) {
  const envVars = {
    u: { value: adminKey, type: 'plain_text' },
    BRAND: { value: BRAND, type: 'plain_text' }
  };
  const d1Bindings = d1
    ? [{ name: 'DB', id: d1.uuid }]
    : undefined;

  const deploymentConfigs = {
    production: {
      compatibility_date: new Date().toISOString().slice(0, 10),
      env_vars: envVars,
      ...(d1Bindings ? { d1_databases: d1Bindings } : {})
    }
  };

  // ۱) ساخت پروژه با بدنه حداقلی (سازگار با همه نسخه‌های API)
  const existing = await cf('GET', `/accounts/${ACCOUNT}/pages/projects/${PROJECT_NAME}`);
  if (!existing.ok) {
    const created = await cf('POST', `/accounts/${ACCOUNT}/pages/projects`, {
      name: PROJECT_NAME,
      production_branch: PRODUCTION_BRANCH
    });
    if (!created.ok) {
      fail('ساخت پروژه Pages', created);
      return false;
    }
    console.log(`✅ پروژه Pages ساخته شد: ${PROJECT_NAME}`);
  }

  // ۲) ست‌کردن متغیرها و بایند D1 روی محیط production
  const patched = await cf('PATCH', `/accounts/${ACCOUNT}/pages/projects/${PROJECT_NAME}`, {
    deployment_configs: deploymentConfigs
  });
  if (patched.ok) {
    console.log(`✅ متغیرهای پروژه Pages به‌روزرسانی شد: ${PROJECT_NAME}`);
    return true;
  }
  fail('به‌روزرسانی متغیرهای پروژه Pages', patched);

  // ۳) تلاش دوباره فقط با متغیرهای محیطی (اگر بایند D1 در این حساب مجاز نباشد)
  const envOnly = await cf('PATCH', `/accounts/${ACCOUNT}/pages/projects/${PROJECT_NAME}`, {
    deployment_configs: { production: { env_vars: envVars } }
  });
  if (envOnly.ok) {
    console.log(`✅ متغیرهای محیطی پروژه Pages ست شد (بایند D1 را دستی اضافه کنید): ${PROJECT_NAME}`);
    return true;
  }
  fail('ست‌کردن متغیرهای محیطی پروژه Pages', envOnly);
  return false;
}

async function main() {
  console.log(`▶️  استقرار ${BRAND} روی حساب ${ACCOUNT}`);
  const d1 = await ensureD1();
  const projectReady = await ensureProject(d1);

  console.log('');
  console.log('──────────────────────────────────────────────');
  console.log(`🔑 کلید ادمین این استقرار: ${adminKey}`);
  console.log(`🔗 مسیر پنل ادمین: /${adminKey}`);
  if (d1) console.log(`🗄️  D1: ${D1_NAME} → ${d1.uuid} (بایند: DB)`);
  console.log('──────────────────────────────────────────────');
  console.log('اگر متغیر u را بعداً در تنظیمات Pages عوض کنید، همان مسیر جدید معتبر می‌شود.');
  if (!projectReady) {
    console.log('⚠️  اتصال D1/متغیرها کامل نشد؛ از پنل Cloudflare → Pages → Settings → Functions استفاده کنید.');
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('❌ خطای پیش‌بینی‌نشده:', err?.message || err);
  process.exit(1);
});
