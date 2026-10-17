#!/usr/bin/env node
// ============================================================================
// miliconfig - عیب‌یابی استقرار Cloudflare Pages
// اجرا:  npm run cf:status            (همه پروژه‌ها)
//        npm run cf:status -- mili-cfg-888
// نیاز به CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID (در .env.local)
// ============================================================================
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const target = process.argv[2] || '';

if (!TOKEN || !ACCOUNT) {
  console.error('❌ CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID ست نشده است.');
  process.exit(1);
}

async function cf(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  });
  let json = null;
  try { json = await res.json(); } catch (_e) {}
  return { status: res.status, ok: res.ok && json?.success !== false, json };
}

async function main() {
  const list = await cf(`/accounts/${ACCOUNT}/pages/projects`);
  if (!list.ok) {
    console.error('❌ خواندن پروژه‌ها ناموفق:', JSON.stringify(list.json?.errors || list.status));
    process.exit(1);
  }
  const projects = (list.json.result || []).filter(p => !target || p.name.includes(target));
  console.log(`📦 ${projects.length} پروژه Pages\n`);

  for (const p of projects) {
    const latest = p.latest_deployment || {};
    console.log(`● ${p.name}`);
    console.log(`  دامنه: https://${p.subdomain || p.name + '.pages.dev'}`);
    console.log(`  شاخه تولید: ${p.production_branch || '-'}`);
    console.log(`  آخرین استقرار: ${latest.short_id || '-'} | env=${latest.environment || '-'} | stage=${latest.latest_stage?.name || '-'} | status=${latest.latest_stage?.status || '-'}`);
    if (latest.created_on) console.log(`  زمان: ${latest.created_on}`);

    const deps = await cf(`/accounts/${ACCOUNT}/pages/projects/${p.name}/deployments`);
    if (deps.ok) {
      for (const d of (deps.json.result || []).slice(0, 3)) {
        console.log(`   ↳ ${d.short_id} env=${d.environment} stage=${d.latest_stage?.name} status=${d.latest_stage?.status} ${d.deployment_trigger?.type || ''}`);
      }
    } else {
      console.log('   ↳ خطا در خواندن استقرارها:', JSON.stringify(deps.json?.errors || deps.status));
    }

    const cfg = p.deployment_configs?.production || {};
    const d1 = cfg.d1_databases || [];
    console.log(`  D1: ${d1.length ? d1.map(b => `${b.name}→${b.id}`).join(', ') : 'متصل نیست'}`);
    console.log(`  env vars: ${Object.keys(cfg.env_vars || {}).join(', ') || 'خالی'}`);
    console.log(`  production deploy: ${latest.environment === 'production' ? 'دارد' : 'ندارد (دلیل رایج خطای 522)'}`);
    console.log('');
  }
}

main().catch(err => {
  console.error('❌ خطا:', err?.message || err);
  process.exit(1);
});
