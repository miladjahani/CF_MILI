#!/usr/bin/env node
// ============================================================================
// miliconfig - ترمیم متغیرهای Pages و اتصال D1
// اجرا:  ADMIN_KEY=/mili-xxxx npm run cf:bind
// اگر ADMIN_KEY ندهید، کلید فعلی پروژه حفظ/بازسازی می‌شود.
// ============================================================================
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const PROJECT = process.env.PROJECT_NAME || 'mili-cfg';
const BRAND = process.env.BRAND || 'miliconfig';
const ADMIN_KEY = (process.env.ADMIN_KEY || '').replace(/^\/+|\/+$/g, '').toLowerCase();

if (!TOKEN || !ACCOUNT) {
  console.error('❌ CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID ست نشده است.');
  process.exit(1);
}

async function cf(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch (_e) {}
  return { status: res.status, ok: res.ok && json?.success !== false, json };
}

async function main() {
  const project = await cf('GET', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
  if (!project.ok) {
    console.error('❌ پروژه پیدا نشد:', JSON.stringify(project.json?.errors || project.status));
    process.exit(1);
  }
  const prod = project.json.result.deployment_configs?.production || {};
  const currentU = prod.env_vars?.u?.value || '';
  const adminKey = ADMIN_KEY || (currentU ? String(currentU).trim() : '');

  const envVars = { ...(prod.env_vars || {}) };
  if (adminKey) envVars.u = { value: adminKey, type: 'plain_text' };
  envVars.BRAND = { value: BRAND, type: 'plain_text' };

  const d1 = await cf('GET', `/accounts/${ACCOUNT}/d1/database`);
  const db = (d1.json?.result || []).find(x => x.name === (process.env.D1_NAME || 'miliconfig-db'));
  if (!db) {
    console.error('❌ دیتابیس D1 پیدا نشد.');
    process.exit(1);
  }

  const attempts = [
    // شکل «نقشه‌ای» که API پروژه‌های Pages انتظار دارد
    { env_vars: envVars, d1_databases: { DB: { id: db.uuid } } },
    { env_vars: envVars, d1_databases: [{ id: db.uuid, name: 'DB' }] },
    { env_vars: envVars }
  ];
  let applied = null;
  let d1Bound = false;
  for (const production of attempts) {
    const res = await cf('PATCH', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}`, {
      deployment_configs: { production }
    });
    if (res.ok) {
      applied = production;
      d1Bound = Boolean(production.d1_databases);
      break;
    }
    console.log(`↳ تلاش ناموفق: ${JSON.stringify((res.json?.errors || []).map(e => e.code + ':' + e.message))}`);
  }

  if (!applied) {
    console.error('❌ هیچ‌کدام از حالت‌ها پذیرفته نشد.');
    process.exit(1);
  }
  console.log(`✅ متغیرها ست شد: ${Object.keys(envVars).join(', ')}`);
  console.log(d1Bound
    ? `✅ بایند D1 ساخته شد: DB → ${db.name} (${db.uuid})`
    : `⚠️  بایند D1 از طریق API پذیرفته نشد؛ در داشبورد: Settings → Bindings → D1 → Variable name: DB → ${db.name}`);
  if (adminKey) console.log(`🔑 مسیر ادمین: /${adminKey}`);
  console.log('ℹ️  برای اعمال، یک استقرار جدید لازم است: npm run deploy:pages');
}

main().catch(err => {
  console.error('❌ خطا:', err?.message || err);
  process.exit(1);
});
