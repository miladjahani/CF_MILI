// ============================================================================
// miliconfig v3.1 - تست خودکار یکپارچگی، دیتابیس D1، نام‌گذاری number+miliconfig و باندل مبهم‌شده
// ============================================================================

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FX_RUNTIME_JS } from '../src/ui/fx.js';
import { runProxyPoolTests } from './tests/proxyPool.tests.js';
import { runHardeningTests } from './tests/hardening.tests.js';
import {
  chacha20Poly1305Open,
  chacha20Poly1305Seal,
  collectSsUploadPayloads,
  createDecoder,
  createEncoder,
  encodeSsAddress,
  evpBytesToKey,
  parseSsAddress,
  resolveSsCiphers,
  tryOpenShadowsocks
} from '../src/core/shadowsocks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ساخت یک شبیه‌ساز دقیق Cloudflare D1 در حافظه جهت تست کامل SQL و بایندینگ‌ها
function createMockD1Database() {
  const tables = {
    system_config: new Map(),
    users: new Map(),
    preferred_nodes: [],
    audit_logs: [],
    traffic_hourly: new Map()
  };

  return {
    prepare(sql) {
      const cleanSql = sql.replace(/\s+/g, ' ').trim();
      let boundParams = [];
      const stmt = {
        bind(...params) {
          boundParams = params;
          for (const p of params) {
            if (p === undefined) {
              throw new Error("D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'");
            }
          }
          return stmt;
        },
        async run() {
          if (cleanSql.startsWith('CREATE TABLE IF NOT EXISTS')) {
            return { success: true };
          }
          if (cleanSql.startsWith('INSERT OR IGNORE INTO users') || cleanSql.startsWith('INSERT INTO users')) {
            const [
              id, username, uuid, sub_node_count, status, enabled,
              data_limit_gb, used_bytes, lifetime_bytes, request_count,
              expire_days, expire_at, start_on_first_use, first_connected_at,
              ip_limit, node_scope, preset, note, config_json, created_at, updated_at
            ] = boundParams;
            if (cleanSql.includes('OR IGNORE') && tables.users.has(id)) {
              return { success: true };
            }
            tables.users.set(id, {
              id, username, uuid, sub_node_count, status, enabled,
              data_limit_gb, used_bytes, lifetime_bytes, request_count,
              expire_days, expire_at, start_on_first_use, first_connected_at,
              ip_limit, node_scope, preset, note, config_json, created_at, updated_at
            });
            return { success: true };
          }
          if (cleanSql.startsWith('UPDATE users SET username =')) {
            const [
              username, uuid, sub_node_count, status, enabled,
              data_limit_gb, expire_days, expire_at, start_on_first_use,
              ip_limit, node_scope, preset, note, config_json, updated_at, id
            ] = boundParams;
            const existing = tables.users.get(id);
            if (existing) {
              Object.assign(existing, {
                username, uuid, sub_node_count, status, enabled,
                data_limit_gb, expire_days, expire_at, start_on_first_use,
                ip_limit, node_scope, preset, note, config_json, updated_at
              });
            }
            return { success: true };
          }
          if (cleanSql.startsWith('DELETE FROM users WHERE id =')) {
            tables.users.delete(boundParams[0]);
            return { success: true };
          }
          if (cleanSql.startsWith('INSERT INTO system_config')) {
            const [key, value, updated_at] = boundParams;
            tables.system_config.set(key, { key, value, updated_at });
            return { success: true };
          }
          if (cleanSql.startsWith('DELETE FROM system_config WHERE key =')) {
            tables.system_config.delete(boundParams[0]);
            return { success: true };
          }
          if (cleanSql.startsWith('DELETE FROM system_config')) {
            tables.system_config.clear();
            return { success: true };
          }
          if (cleanSql.startsWith('INSERT INTO audit_logs')) {
            const [action, detail, ip, created_at] = boundParams;
            tables.audit_logs.unshift({ id: tables.audit_logs.length + 1, action, detail, ip, created_at });
            return { success: true };
          }
          return { success: true };
        },
        async first() {
          if (cleanSql.includes('SELECT COUNT(*) as cnt FROM users')) {
            return { cnt: tables.users.size };
          }
          return null;
        },
        async all() {
          if (cleanSql.startsWith('SELECT * FROM users')) {
            return { results: Array.from(tables.users.values()) };
          }
          if (cleanSql.startsWith('SELECT key, value FROM system_config')) {
            return { results: Array.from(tables.system_config.values()) };
          }
          if (cleanSql.startsWith('SELECT * FROM audit_logs')) {
            return { results: tables.audit_logs.slice(0, boundParams[0] || 15) };
          }
          return { results: [] };
        }
      };
      return stmt;
    }
  };
}

async function runTests() {
  console.log('🧪 [miliconfig] شروع تست خودکار باندل مبهم‌شده و ماژول‌ها...');

  const obfPath = path.join(ROOT_DIR, 'dist', '_worker.js');
  assert.ok(fs.existsSync(obfPath), 'فایل dist/_worker.js باید وجود داشته باشد');

  // جایگزینی موقت import { connect as cfConnect } from 'cloudflare:sockets' برای اجرای محلی در Node.js
  const rawObf = fs.readFileSync(obfPath, 'utf8');
  const testableCode = rawObf.replace(
    /import\s+\{\s*connect\s+as\s+cfConnect\s*\}\s+from\s+['"]cloudflare:sockets['"];?/,
    'const cfConnect = () => ({ readable: new ReadableStream(), writable: new WritableStream(), closed: Promise.resolve(), close(){} });'
  );
  const tmpTestFile = path.join(ROOT_DIR, 'dist', '_worker.test-runner.mjs');
  fs.writeFileSync(tmpTestFile, testableCode, 'utf8');

  try {
    const mod = await import(tmpTestFile);
    const worker = mod.default;
    assert.ok(worker && typeof worker.fetch === 'function', 'باندل مبهم‌شده باید دارای متد fetch معتبر باشد');

    const adminUuid = '351c9981-04b6-4103-aa4b-864aa9c91469';

    // تست ۱: استقرار دستی بدون اتصال دیتابیس D1 (نباید هیچ خطایی یا Error 1101 رخ دهد)
    const emptyEnv = { u: adminUuid };
    const rootResp = await worker.fetch(new Request('https://mili.example.com/'), emptyEnv, {});
    assert.strictEqual(rootResp.status, 200, 'صفحه اصلی بدون D1 باید با کد 200 باز شود');
    const rootHtml = await rootResp.text();
    assert.ok(rootHtml.includes('MILICONFIG'), 'برند MILICONFIG باید در صفحه ورود وجود داشته باشد');
    assert.ok(rootHtml.includes('login-hint') && rootHtml.includes('مسیر ادمین'), 'صفحه ورود باید راهنمای «کلید ادمین یا UUID کاربر» را نشان دهد');
    console.log('  ✓ تست ۱ (استقرار دستی بدون D1 و بدون خطای 1101): موفق');

    // تست ۲: اتصال دیتابیس D1 و ساخت خودکار جداول + پنل مدیریت
    const mockD1 = createMockD1Database();
    const d1Env = { u: adminUuid, DB: mockD1 };

    const adminResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}`), d1Env, {});
    assert.strictEqual(adminResp.status, 200, 'پنل مدیریت با D1 باید با کد 200 باز شود');
    const adminHtml = await adminResp.text();
    assert.ok(adminHtml.includes('مرکز کنترل زیرساخت پروکسی miliconfig'), 'عنوان داشبورد miliconfig باید وجود داشته باشد');
    assert.ok(adminHtml.includes('um_subNodeCount'), 'فیلد تعداد نودها در ساب باید در مودال کاربر جدید وجود داشته باشد');
    assert.ok(adminHtml.includes('https://t.me/miliconfig'), 'دکمه کانال پشتیبانی باید https://t.me/miliconfig را باز کند');
    assert.ok(!/t\.me\/\+/.test(adminHtml), 'هیچ لینک دعوت منقضی (t.me/+...) نباید در پنل باشد');
    console.log('  ✓ تست ۲ (پنل مدیریت و ساخت خودکار جداول D1): موفق');

    // تست ۳: ایجاد کاربر جدید از طریق API همراه با نام کاربر، تعداد نود در ساب (مثلاً 8 نود) و تمام تنظیمات پیش‌فرض کد
    const createResp = await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'reza-vip',
          subNodeCount: 8,
          preset: 'iran-fast',
          ev: 'yes',
          et: 'yes'
        })
      }),
      d1Env,
      {}
    );
    assert.strictEqual(createResp.status, 200, 'ایجاد کاربر در D1 باید 200 برگرداند');
    const createdData = await createResp.json();
    assert.strictEqual(createdData.success, true);
    assert.strictEqual(createdData.user.username, 'reza-vip');
    assert.strictEqual(createdData.user.subNodeCount, 8);
    assert.strictEqual(createdData.user.config.customDNS, 'https://223.5.5.5/dns-query');
    assert.strictEqual(createdData.user.config.customECHDomain, 'cloudflare-ech.com');
    console.log('  ✓ تست ۳ (ایجاد کاربر جدید در D1 با تمام تنظیمات پیش‌فرض کد + تعداد نود در ساب): موفق');

    // تست ۴: بررسی ساب‌لینک کاربر و نام‌گذاری دقیق کانفیگ‌ها به فرمت number+miliconfig و تعداد دقیق نودها (8 نود)
    const newUserUuid = createdData.user.uuid;
    const subRawResp = await worker.fetch(
      new Request(`https://mili.example.com/${newUserUuid}/sub?target=raw`),
      d1Env,
      {}
    );
    assert.strictEqual(subRawResp.status, 200);
    const rawLinksText = await subRawResp.text();
    const allLines = rawLinksText.trim().split('\n').filter(Boolean);
    // سه خط اول، نودهای اطلاعاتی هاردکد هستند و از سهمیه subNodeCount کم نمی‌شوند
    const INFO_COUNT = 3;
    const infoLines = allLines.slice(0, INFO_COUNT);
    const rawLines = allLines.slice(INFO_COUNT);
    assert.strictEqual(infoLines.length, INFO_COUNT, 'ساب باید سه نود اطلاعاتی داشته باشد');
    assert.ok(
      decodeURIComponent(infoLines[0].split('#')[1] || '').includes('میلی رایگان است'),
      'نود اطلاعاتی اول باید «میلی رایگان است» باشد'
    );
    assert.ok(
      decodeURIComponent(infoLines[1].split('#')[1] || '').includes('نفروشید'),
      'نود اطلاعاتی دوم باید هشدار نفروشید باشد'
    );
    assert.ok(
      decodeURIComponent(infoLines[2].split('#')[1] || '').includes('@miliconfig'),
      'نود اطلاعاتی سوم باید کانال پشتیبانی باشد'
    );
    assert.strictEqual(rawLines.length, 8, `تعداد نودهای ساب‌لینک باید دقیقاً برابر با subNodeCount (8) باشد ولی ${rawLines.length} بود`);

    rawLines.forEach((line, idx) => {
      const expectedTag = `${idx + 1}+miliconfig`;
      const hashPart = decodeURIComponent(line.split('#')[1] || '');
      // نام نود باید با شماره ترتیبی + برند شروع شود؛ برچسب لوکیشن اختیاری است
      const isNumbered = hashPart === expectedTag || new RegExp(`^${idx + 1}\\+miliconfig [A-Z0-9-]+$`).test(hashPart);
      assert.ok(
        isNumbered,
        `نام نود شماره ${idx + 1} باید ${expectedTag} (یا ${expectedTag} با برچسب لوکیشن) باشد ولی ${hashPart} بود`
      );
    });
    console.log('  ✓ تست ۴ (نام‌گذاری کانفیگ‌ها به فرمت دقیق 1+miliconfig تا 8+miliconfig و رعایت تعداد نود در ساب): موفق');

    // تست ۵: بررسی فرمت Clash و Sing-box برای کاربر
    const clashResp = await worker.fetch(
      new Request(`https://mili.example.com/${newUserUuid}/sub?target=clash`),
      d1Env,
      {}
    );
    const clashYaml = await clashResp.text();
    assert.ok(clashYaml.includes('"1+miliconfig') && clashYaml.includes('"8+miliconfig'), 'کانفیگ Clash باید شامل نودهای 1+miliconfig تا 8+miliconfig باشد');

    const sbResp = await worker.fetch(
      new Request(`https://mili.example.com/${newUserUuid}/sub?target=singbox`),
      d1Env,
      {}
    );
    const sbJson = JSON.parse(await sbResp.text());
    assert.ok(sbJson.outbounds.some(o => String(o.tag || '').startsWith('1+miliconfig')), 'کانفیگ Sing-box باید شامل تگ 1+miliconfig باشد');
    console.log('  ✓ تست ۵ (تبدیل اشتراک داخلی Clash YAML و Sing-box JSON با نام number+miliconfig): موفق');

    // تست ۶: بررسی صفحه وضعیت اختصاصی کاربر (/status/{id})
    const statusResp = await worker.fetch(
      new Request(`https://mili.example.com/status/${createdData.user.id}`),
      d1Env,
      {}
    );
    assert.strictEqual(statusResp.status, 200);
    const statusHtml = await statusResp.text();
    assert.ok(statusHtml.includes('reza-vip'), 'صفحه وضعیت باید نام کاربر را نمایش دهد');
    assert.ok(statusHtml.includes('v2rayNG') && statusHtml.includes('Exclusive') && statusHtml.includes('Amnezia VPN'), 'صفحه وضعیت باید شامل تمام کلاینت‌های تصویر ارسالی باشد');
    assert.ok(statusHtml.includes('t.me/miliconfig'), 'صفحه وضعیت باید لینک کانال پشتیبانی miliconfig را داشته باشد');
    assert.ok(!/t\.me\/\+/.test(statusHtml), 'هیچ لینک دعوت منقضی در صفحه وضعیت نباید باشد');

    // توکن دارای درصد ناقص نباید باعث URIError و پاسخ ۲۰۰ «recovered» شود
    const badTokenResp = await worker.fetch(
      new Request('https://mili.example.com/status/%E0%A4%A'),
      d1Env,
      {}
    );
    assert.strictEqual(badTokenResp.status, 404, 'توکن با درصد ناقص باید 404 بدهد، نه 200 recovered');
    const badSubResp = await worker.fetch(
      new Request('https://mili.example.com/sub/%E0%A4%A'),
      d1Env,
      {}
    );
    assert.strictEqual(badSubResp.status, 403, 'لینک ساب با توکن ناقص باید 403 بدهد، نه 200 recovered');
    console.log('  ✓ تست ۶ (صفحه وضعیت اختصاصی کاربر برای ارسال به مشتری): موفق');

    console.log('\n🎉 تمام تست‌های عملکردی، دیتابیس D1، رابط کاربری و مبهم‌سازی با موفقیت ۱۰۰٪ پاس شدند!');
    // ========================================================================
    // تست‌های جدید: رابط کاربری بازطراحی‌شده، جلوه‌های بصری، امن‌سازی، کد مرده و استقرار دوگانه
    // ========================================================================
    const pages = [
      ['ورود', rootHtml],
      ['مدیریت', adminHtml],
      ['وضعیت کاربر', statusHtml]
    ];

    // تست ۷: لایه جلوه‌های بصری (پس‌زمینه زنده + انیمیشن‌های روان) در هر سه صفحه
    const fxNeedles = [
      'fxCanvas',
      'fx-aurora',
      'fx-grid',
      'fx-toast-host',
      'fx-reveal',
      'fx-ring',
      'prefers-reduced-motion',
      'window.MiliFx'
    ];
    for (const [label, html] of pages) {
      for (const needle of fxNeedles) {
        assert.ok(html.includes(needle), `صفحه ${label} باید شامل جلوه بصری «${needle}» باشد`);
      }
    }
    assert.ok(rootHtml.includes('btn-support') && rootHtml.includes('modeAdmin'), 'صفحه ورود باید دکمه پشتیبانی و انتخاب حالت داشته باشد');
    assert.ok(statusHtml.includes('usage-ring') && statusHtml.includes('nodeSearch'), 'صفحه وضعیت باید حلقه مصرف و جستجوی نود داشته باشد');
    assert.ok(statusHtml.includes('↑ آپلود') && statusHtml.includes('↓ دانلود'), 'صفحه وضعیت باید مصرف واقعی آپلود و دانلود را جداگانه نشان دهد');
    assert.ok(adminHtml.includes('donutRing') && adminHtml.includes('fx-ring'), 'داشبورد باید حلقه گرافیکی متحرک داشته باشد');
    assert.ok(adminHtml.includes('id="fxProgressFill"'), 'داشبورد باید نوار پیشرفت اسکرول داشته باشد');
    console.log('  ✓ تست ۷ (پس‌زمینه زنده و انیمیشن‌های روان در هر سه صفحه UI): موفق');

    // تست ۸: تمام اسکریپت‌های درون‌صفحه‌ای باید از نظر نحوی معتبر باشند
    for (const [label, html] of pages) {
      const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
      assert.ok(blocks.length > 0, `صفحه ${label} باید اسکریپت درون‌صفحه‌ای داشته باشد`);
      blocks.forEach((src, idx) => {
        assert.doesNotThrow(() => { new Function(src); }, `اسکریپت شماره ${idx} صفحه ${label} خطای نحوی دارد`);
      });
    }
    console.log('  ✓ تست ۸ (اعتبار نحوی تمام اسکریپت‌های درون‌صفحه‌ای): موفق');

    // تست ۹: امن‌سازی خروجی؛ نام کاربری مخرب نباید به HTML/JS خام نشت کند (رفع باگ XSS)
    const xssPayload = '<img src=x onerror=alert(1)>';
    const xssResp = await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: xssPayload, subNodeCount: 3 })
      }),
      d1Env,
      {}
    );
    assert.strictEqual(xssResp.status, 200, 'ساخت کاربر با نام خاص باید موفق باشد');
    const xssUser = (await xssResp.json()).user;
    assert.ok(xssUser && xssUser.id, 'کاربر تست امنیت باید ساخته شود');

    const xssStatusHtml = await (await worker.fetch(
      new Request(`https://mili.example.com/status/${xssUser.id}`),
      d1Env,
      {}
    )).text();
    assert.ok(!xssStatusHtml.includes('<img src=x onerror='), 'صفحه وضعیت نباید تگ خام نام کاربری را رندر کند');
    if (xssUser.username === xssPayload) {
      assert.ok(xssStatusHtml.includes('&lt;img'), 'نام کاربری باید escape شده باشد');
    }

    const xssAdminHtml = await (await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}`),
      d1Env,
      {}
    )).text();
    assert.ok(!xssAdminHtml.includes('<img src=x onerror='), 'داشبورد نباید تگ خام نام کاربری را رندر کند');
    assert.ok(xssAdminHtml.includes('function esc('), 'داشبورد باید تابع امن‌سازی esc داشته باشد');
    console.log('  ✓ تست ۹ (امن‌سازی نام کاربری و رفع باگ XSS): موفق');

    // تست ۱۰: تزریق کد مرده (Dead Code Injection) در زنجیره بیلد
    const manifestPath = path.join(ROOT_DIR, 'dist', 'build-info.json');
    assert.ok(fs.existsSync(manifestPath), 'مانیفست بیلد dist/build-info.json باید ساخته شود');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.obfuscation.deadCode, true, 'کد مرده باید فعال باشد');
    assert.ok(manifest.obfuscation.deadCodeBlocks > 0, 'حداقل یک بلوک کد مرده باید تزریق شود');
    assert.ok(manifest.readableBundle.deadCodeOccurrences > 0, 'نشانگر کد مرده باید در باندل خوانا وجود داشته باشد');

    const readableBundle = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'worker.readable.js'), 'utf8');
    assert.ok(readableBundle.includes('__milicfg_deadcode_v3_1__'), 'نشانگر کد مرده در باندل خوانا یافت نشد');
    assert.ok(readableBundle.includes('_0xMDC.tap('), 'بلوک‌های محمول مبهم (opaque predicate) در باندل تزریق نشده‌اند');
    assert.notStrictEqual(readableBundle, rawObf, 'خروجی نهایی باید مبهم‌سازی‌شده و متفاوت از باندل خوانا باشد');
    console.log(`  ✓ تست ۱۰ (تزریق کد مرده: ${manifest.obfuscation.deadCodeBlocks} بلوک با محمول مبهم): موفق`);

    // تست ۱۱: آماده استقرار روی هر دو بستر (Cloudflare Pages + Workers) بدون هیچ سکرت
    const distWorkerCode = fs.readFileSync(path.join(ROOT_DIR, 'dist', '_worker.js'), 'utf8');
    const publicWorkerCode = fs.readFileSync(path.join(ROOT_DIR, 'public', '_worker.js'), 'utf8');
    const rootWorkerCode = fs.readFileSync(path.join(ROOT_DIR, '_worker.js'), 'utf8');
    assert.strictEqual(distWorkerCode, publicWorkerCode, 'خروجی Pages و Worker باید یکسان باشد');
    assert.strictEqual(distWorkerCode, rootWorkerCode, 'خروجی ریشه مخزن باید با dist یکسان باشد');
    assert.ok(distWorkerCode.startsWith("import { connect as cfConnect } from 'cloudflare:sockets';"), 'خروجی باید با ایمپورت sockets شروع شود');
    assert.ok(distWorkerCode.trimEnd().endsWith('export default __MILI_WORKER_EXPORT__;'), 'خروجی باید Worker معتبر (export default) باشد');
    assert.deepStrictEqual(manifest.targets, ['cloudflare-pages-advanced-mode', 'cloudflare-worker'], 'مانیفست باید هر دو بستر استقرار را اعلام کند');
    assert.strictEqual(manifest.requiresSecrets, false, 'استقرار نباید به سکرت نیاز داشته باشد');
    assert.strictEqual(manifest.pagesOutputDir, 'dist', 'پوشه خروجی Pages باید dist باشد');
    assert.ok(manifest.artifacts.every(a => a.sha256 === manifest.artifacts[0].sha256), 'همه خروجی‌های استقرار باید هم‌محتوای یکسان داشته باشند');
    assert.ok(!/CLOUDFLARE_API_TOKEN|cfat_[A-Za-z0-9]{8}/.test(distWorkerCode), 'هیچ توکن/سکرتی نباید داخل باندل باشد');

    const wranglerConfig = fs.readFileSync(path.join(ROOT_DIR, 'wrangler.toml'), 'utf8');
    const wranglerActiveLines = wranglerConfig.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    assert.ok(/^main\s*=\s*"src\/index\.js"/m.test(wranglerActiveLines), 'wrangler.toml باید ورودی Worker را تعریف کند');
    assert.ok(!/token|secret|password/i.test(wranglerActiveLines), 'wrangler.toml نباید شامل هیچ سکرت/توکنی باشد');
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'worker.readable.js')), 'نسخه خوانا باندل باید برای دیباگ موجود باشد');
    console.log('  ✓ تست ۱۱ (خروجی دوگانه Pages + Worker آماده استقرار بدون سکرت): موفق');

    // تست ۱۲: اجرای واقعی موتور جلوه‌های بصری روی یک DOM شبیه‌سازی‌شده (کشف خطاهای زمان اجرا)
    const fxWindow = {
      innerWidth: 1280,
      innerHeight: 800,
      devicePixelRatio: 1,
      location: { hash: '', origin: 'https://mili.example.com', host: 'mili.example.com', pathname: '/x', href: 'https://mili.example.com/x', reload() {} },
      requestAnimationFrame(cb) { void cb; return 1; },
      cancelAnimationFrame() {},
      setTimeout() { return 1; },
      clearTimeout() {},
      addEventListener() {},
      removeEventListener() {},
      matchMedia() { return { matches: false, addEventListener() {} }; },
      confirm() { return true; },
      open() {},
      history: { replaceState() {} }
    };
    const makeFxElement = () => ({
      style: { setProperty() {}, getPropertyValue() { return ''; } },
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      children: [], childNodes: [], dataset: {},
      appendChild() {}, removeChild() {}, remove() {},
      addEventListener() {}, removeEventListener() {},
      setAttribute() {}, getAttribute() { return null; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 12, height: 12 }; },
      querySelectorAll() { return []; }, querySelector() { return null; },
      closest() { return null; }, focus() {}, select() {}, offsetWidth: 10, scrollHeight: 120, textContent: '', value: ''
    });
    const fxHost = makeFxElement();
    const fxDocument = {
      readyState: 'complete',
      hidden: false,
      documentElement: { scrollHeight: 1200 },
      body: makeFxElement(),
      addEventListener() {}, removeEventListener() {},
      getElementById(id) { return id === 'fxToastHost' ? fxHost : null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      createElement() { return makeFxElement(); },
      execCommand() { return true; }
    };
    const fxNavigator = { clipboard: { writeText() { return Promise.resolve(); } } };
    assert.doesNotThrow(() => {
      const runFx = new Function('window', 'document', 'navigator', FX_RUNTIME_JS);
      runFx(fxWindow, fxDocument, fxNavigator);
    }, 'موتور جلوه‌های بصری نباید در زمان راه‌اندازی خطا بدهد');
    assert.ok(fxWindow.MiliFx && typeof fxWindow.MiliFx.toast === 'function', 'MiliFx باید API عمومی خود را بسازد');
    assert.strictEqual(fxWindow.MiliFx.esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;', 'تابع escape باید HTML را امن کند');
    assert.ok(!fxWindow.MiliFx.jsStr("a'b").includes("'") || fxWindow.MiliFx.jsStr("a'b").includes('&#39;'), 'تابع jsStr باید کوتیشن را امن کند');
    assert.doesNotThrow(() => fxWindow.MiliFx.toast('تست توست', 'success'), 'توست نباید خطا بدهد');
    assert.doesNotThrow(() => fxWindow.MiliFx.countUp(makeFxElement(), 1234, v => String(v)), 'شمارنده عددی نباید خطا بدهد');
    assert.doesNotThrow(() => fxWindow.MiliFx.ring(makeFxElement(), 42), 'حلقه مصرف نباید خطا بدهد');
    assert.doesNotThrow(() => fxWindow.MiliFx.reveal(fxDocument), 'تابع نمایش نرم نباید خطا بدهد');
    console.log('  ✓ تست ۱۲ (اجرای واقعی موتور انیمیشن و پس‌زمینه زنده روی DOM شبیه‌سازی‌شده): موفق');

    // ========================================================================
    // تست ۱۳: اسکنر داخلی آی‌پی (معادل cfnew) — کاتالوگ، دسترسی و اجرای اسکن
    // ========================================================================
    const isValidIp = v => /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || (v.includes(':') && /^[0-9a-f:]+$/i.test(v));

    const scanDeniedResp = await worker.fetch(
      new Request('https://mili.example.com/api/scanner', { method: 'GET' }),
      d1Env,
      {}
    );
    assert.strictEqual(scanDeniedResp.status, 403, 'اسکنر بدون مسیر مدیریتی باید ۴۰۳ بدهد');

    const scanCatalogResp = await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}/api/scanner`, { method: 'GET' }),
      d1Env,
      {}
    );
    assert.strictEqual(scanCatalogResp.status, 200, 'کتالوگ اسکنر باید ۲۰۰ بدهد');
    const scanCatalog = await scanCatalogResp.json();
    assert.ok(Array.isArray(scanCatalog.locations) && scanCatalog.locations.length >= 16, 'کتالوگ باید حداقل ۱۶ لوکیشن واقعی داشته باشد');
    for (const loc of scanCatalog.locations) {
      assert.ok(isValidIp(loc.egressIp), `آی‌پی خروجی لوکیشن ${loc.code} باید آی‌پی ثابت باشد نه دامنه (${loc.egressIp})`);
      assert.ok(!/[a-zA-Z]/.test(loc.egressIp), `آی‌پی خروجی لوکیشن ${loc.code} نباید دامنه باشد (${loc.egressIp})`);
    }
    assert.ok(scanCatalog.edgeIps.ipv4.length > 0 && scanCatalog.edgeIps.ipv4.every(isValidIp), 'آی‌پی‌های لبه IPv4 باید معتبر باشند');
    assert.ok(scanCatalog.edgeIps.ipv6.length > 0 && scanCatalog.edgeIps.ipv6.every(ip => ip.includes(':')), 'آی‌پی‌های لبه IPv6 باید معتبر باشند');

    const scanRunResp = await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}/api/scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', ips: ['104.16.1.1', '188.114.98.10'], port: 443, timeoutMs: 800 })
      }),
      d1Env,
      {}
    );
    assert.strictEqual(scanRunResp.status, 200, 'اجرای اسکن باید ۲۰۰ بدهد');
    const scanRun = await scanRunResp.json();
    assert.strictEqual(scanRun.success, true);
    assert.strictEqual(scanRun.results.length, 2, 'اسکن باید برای هر آی‌پی ورودی یک نتیجه بدهد');
    assert.ok(scanRun.results.every(r => isValidIp(r.ip)), 'نتیجه اسکن باید فقط آی‌پی باشد');
    console.log('  ✓ تست ۱۳ (اسکنر داخلی: کاتالوگ ۱۶ لوکیشن، گارد دسترسی و اجرای اسکن): موفق');

    // ========================================================================
    // تست ۱۴: نودهای مولتی‌لوکیشن با آی‌پی ثابت + خروجی ثابت (p/pm) و IPv6 همراه اول
    // ========================================================================
    const createWithPreset = async (username, preset, subNodeCount) => {
      const resp = await worker.fetch(
        new Request(`https://mili.example.com/${adminUuid}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, preset, subNodeCount })
        }),
        d1Env,
        {}
      );
      assert.strictEqual(resp.status, 200, `ساخت کاربر با پریست ${preset} باید ۲۰۰ بدهد`);
      return (await resp.json()).user;
    };

    const sanctionUser = await createWithPreset('gemini-user', 'sanction-gemini', 40);
    assert.strictEqual(sanctionUser.config.pm, 'yes', 'پریست تحریم‌شکن باید خروجی ثابت (pm) را فعال کند');
    assert.strictEqual(sanctionUser.config.qj, 'only', 'پریست تحریم‌شکن باید روش خروج only داشته باشد تا از پروکسی s عبور کند');
    const sanctionRaw = await (await worker.fetch(
      new Request(`https://mili.example.com/${sanctionUser.uuid}/sub?target=raw`),
      d1Env,
      {}
    )).text();
    // سه خط اول نودهای اطلاعاتی هاردکد هستند و در بررسی ساختار نودها لحاظ نمی‌شوند
    const sanctionAllLines = sanctionRaw.trim().split('\n').filter(Boolean);
    const sanctionLines = sanctionAllLines.slice(3);
    assert.ok(sanctionAllLines.length >= 3 && sanctionLines.length > 0, 'ساب تحریم‌شکن نباید خالی باشد');
    const locTags = new Set();
    let proxyNodes = 0;
    for (const line of sanctionLines) {
      const m = line.match(/^(?:vless|trojan):\/\/[^@]+@(\[[^\]]+\]|[^:?]+):(\d+)/);
      assert.ok(m, `هر نود باید آدرس معتبر داشته باشد: ${line.slice(0, 40)}`);
      const addr = m[1].replace(/^\[|\]$/g, '');
      assert.ok(isValidIp(addr), `آدرس نود باید آی‌پی باشد نه دامنه: ${m[1]}`);
      const tag = decodeURIComponent(line.split('#')[1] || '');
      assert.ok(/^\d+\+miliconfig( [A-Z0-9-]+)?$/.test(tag), `نام نود با قرارداد number+miliconfig هم‌خوان نیست: ${tag}`);
      const nodeUrl = new URL(line.replace(/^vless:\/\//, 'http://'));
      const nodePath = nodeUrl.searchParams.get('path') || '';
      const pMatch = nodePath.match(/[?&]p=([^&]+)/);
      if (pMatch) {
        proxyNodes += 1;
        const egress = decodeURIComponent(pMatch[1]).replace(/:\d+$/, '');
        assert.ok(isValidIp(egress), `خروجی نود باید آی‌پی ثابت باشد: ${egress}`);
        assert.ok(/[?&]pm=1/.test(nodePath), 'نود دارای خروجی ثابت باید pm=1 در مسیر داشته باشد');
      }
      const tagLoc = tag.match(/^\d+\+miliconfig ([A-Z]{2}-[A-Z]{3})$/);
      if (tagLoc) locTags.add(tagLoc[1]);
    }
    assert.ok(proxyNodes >= 8, `حداقل ۸ نود با خروجی ثابت لوکیشن لازم است (${proxyNodes})`);
    assert.ok(locTags.size >= 8, `ساب باید حداقل ۸ لوکیشن واقعی داشته باشد (${locTags.size})`);

    const mciUser = await createWithPreset('mci-user', 'mci-ipv6', 20);
    const mciRaw = await (await worker.fetch(
      new Request(`https://mili.example.com/${mciUser.uuid}/sub?target=raw`),
      d1Env,
      {}
    )).text();
    const mciLines = mciRaw.trim().split('\n').filter(Boolean);
    assert.ok(mciLines.length >= 8, 'ساب IPv6 همراه اول باید حداقل ۸ نود داشته باشد');
    for (const line of mciLines) {
      const m = line.match(/^vless:\/\/[^@]+@(\[[^\]]+\]):(\d+)/);
      assert.ok(m, `نود IPv6 باید آدرس [IPv6]:port داشته باشد: ${line.slice(0, 48)}`);
      assert.ok(m[1].includes(':'), 'آدرس نود IPv6 باید شامل کولون باشد');
      const mciPath = new URL(line.replace(/^vless:\/\//, 'http://')).searchParams.get('path') || '';
      assert.ok(!/[?&]p=/.test(mciPath), 'نود IPv6 نباید به خروجی IPv4 وابسته باشد');
    }

    const defaultRaw = await (await worker.fetch(
      new Request(`https://mili.example.com/${newUserUuid}/sub?target=raw&limit=60`),
      d1Env,
      {}
    )).text();
    for (const line of defaultRaw.trim().split('\n').filter(Boolean)) {
      const m = line.match(/^(?:vless|trojan):\/\/[^@]+@(\[[^\]]+\]|[^:?]+):(\d+)/);
      assert.ok(m, `هر نود ساب پیش‌فرض باید آدرس داشته باشد: ${line.slice(0, 120)}`);
      assert.ok(isValidIp(m[1].replace(/^\[|\]$/g, '')), `هیچ نود پیش‌فرضی نباید دامنه باشد: ${m[1]}`);
    }
    console.log(`  ✓ تست ۱۴ (مولتی‌لوکیشن با آی‌پی ثابت: ${proxyNodes} نود خروجی‌دار در ${locTags.size} لوکیشن + IPv6 همراه اول): موفق`);

    // ========================================================================
    // تست ۱۵: رابط کاربری اسکنر و پریست‌های جدید در پنل مدیریت
    // ========================================================================
    assert.ok(adminHtml.includes('/api/scanner') && adminHtml.includes('runIpScan'), 'پنل باید اسکنر واقعی را صدا بزند');
    assert.ok(!adminHtml.includes('generateRandomCfIps'), 'دکمه قدیمی تولید تصادفی باید حذف شده باشد');
    assert.ok(adminHtml.includes('تحریم‌شکن') && adminHtml.includes('همراه اول ایران — IPv6'), 'پریست‌های تحریم‌شکن و IPv6 باید در پنل باشند');
    assert.ok(adminHtml.includes('cfg_locs') && adminHtml.includes('cfg_pm'), 'تنظیمات لوکیشن و خروجی ثابت باید در پنل باشند');
    console.log('  ✓ تست ۱۵ (رابط اسکنر و پریست‌های تحریم‌شکن/IPv6 در پنل): موفق');

    // ========================================================================
    // تست ۱۶: موتور Shadowsocks — بردار RFC 8439، سه رمزنگاری و فریم‌بندی chunk
    // ========================================================================
    const hexBytes = s => Uint8Array.from(s.match(/../g).map(h => parseInt(h, 16)));
    const toHex = a => Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
    const rfcKey = hexBytes('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f');
    const rfcNonce = hexBytes('070000004041424344454647');
    const rfcAad = hexBytes('50515253c0c1c2c3c4c5c6c7');
    const rfcPlain = new TextEncoder().encode("Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.");
    const rfcSealed = chacha20Poly1305Seal(rfcKey, rfcNonce, rfcPlain, rfcAad);
    assert.strictEqual(toHex(rfcSealed.slice(0, 16)), 'd31a8d34648e60db7b86afbc53ef7ec2', 'خروجی ChaCha20 باید با RFC 8439 هم‌خوان باشد');
    assert.strictEqual(toHex(rfcSealed.slice(-16)), '1ae10b594f09e26a7e902ecbd0600691', 'تگ Poly1305 باید با RFC 8439 هم‌خوان باشد');
    assert.strictEqual(
      new TextDecoder().decode(chacha20Poly1305Open(rfcKey, rfcNonce, rfcSealed, rfcAad)),
      new TextDecoder().decode(rfcPlain),
      'رمزگشایی ChaCha20-Poly1305 باید متن اصلی را برگرداند'
    );

    const ssKeyLens = { 'aes-128-gcm': 16, 'aes-256-gcm': 32, 'chacha20-ietf-poly1305': 32 };
    for (const [cipher, keyLen] of Object.entries(ssKeyLens)) {
      const masterKey = await evpBytesToKey('351c9981-04b6-4103-aa4b-864aa9c91469', keyLen);
      const encoder = await createEncoder({ cipher, masterKey });
      const payload = new Uint8Array(20000).map((_, i) => i & 255);
      const wire = await encoder.encode(payload);
      assert.ok(wire.byteLength > payload.byteLength, `فریم‌بندی ${cipher} باید salt و تگ داشته باشد`);
      const decoder = createDecoder({ cipher, masterKey });
      const chunks = [];
      for (let i = 0; i < wire.byteLength; i += 777) {
        chunks.push(...(await decoder.push(wire.slice(i, Math.min(i + 777, wire.byteLength)))));
      }
      const joined = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
      let off = 0;
      for (const c of chunks) { joined.set(c, off); off += c.byteLength; }
      assert.strictEqual(joined.byteLength, payload.byteLength, `${cipher} باید کل payload را بازگرداند`);
      assert.ok(joined.every((v, i) => v === payload[i]), `محتوای رمزگشایی‌شده ${cipher} باید یکسان باشد`);
    }

    const ssPassword = 'mili-ss-password';
    const ssMaster = await evpBytesToKey(ssPassword, 32);
    const ssEncoder = await createEncoder({ cipher: 'chacha20-ietf-poly1305', masterKey: ssMaster });
    // کلاینت واقعی آدرس مقصد و اولین دادهٔ خود (مثل ClientHello) را در یک chunk می‌فرستد
    const ssAddress = encodeSsAddress('example.com', 443);
    const ssHello = new TextEncoder().encode('CLIENT-HELLO-BYTES');
    const ssFirstPayload = new Uint8Array(ssAddress.byteLength + ssHello.byteLength);
    ssFirstPayload.set(ssAddress, 0);
    ssFirstPayload.set(ssHello, ssAddress.byteLength);
    const ssFirstFrame = await ssEncoder.encode(ssFirstPayload);
    const ssAuth = await tryOpenShadowsocks(ssFirstFrame, ssPassword, ['chacha20-ietf-poly1305']);
    assert.ok(ssAuth && ssAuth.target.host === 'example.com' && ssAuth.target.port === 443, 'احراز هویت Shadowsocks باید آدرس مقصد را باز کند');
    assert.strictEqual(toHex(ssAuth.target.payload), toHex(ssHello), 'دادهٔ همراه آدرس باید در فریم اول باقی بماند');
    const ssUpload = collectSsUploadPayloads(ssAuth);
    assert.strictEqual(ssUpload.length, 1, 'فریم اول باید یک payload برای ارسال به مقصد داشته باشد');
    assert.strictEqual(toHex(ssUpload[0]), toHex(ssHello), 'اولین دادهٔ کلاینت (ClientHello) نباید حذف شود');
    assert.strictEqual(await tryOpenShadowsocks(ssFirstFrame, 'wrong-password', ['chacha20-ietf-poly1305']), null, 'رمز اشتباه نباید احراز شود');

    // ATYP باید مطابق SOCKS5 باشد: ۱ = IPv4، ۳ = دامنه، ۴ = IPv6
    assert.strictEqual(encodeSsAddress('104.16.1.1', 443)[0], 1, 'ATYP آدرس IPv4 باید ۱ باشد');
    assert.strictEqual(encodeSsAddress('example.com', 443)[0], 3, 'ATYP دامنه باید ۳ باشد');
    assert.strictEqual(encodeSsAddress('2606:4700::6810:101', 443)[0], 4, 'ATYP آدرس IPv6 باید ۴ باشد');
    const ssAddr4 = parseSsAddress(encodeSsAddress('104.16.1.1', 443));
    const ssAddr6 = parseSsAddress(encodeSsAddress('2606:4700::6810:101', 443));
    const ssAddrDomain = parseSsAddress(ssAddress);
    assert.deepStrictEqual([ssAddr4.host, ssAddr4.port, ssAddr4.addressType], ['104.16.1.1', 443, 1], 'آدرس IPv4 شادوساکس باید درست رمزگشایی شود');
    assert.deepStrictEqual([ssAddr6.host, ssAddr6.port, ssAddr6.addressType], ['2606:4700:0:0:0:0:6810:101', 443, 4], 'آدرس IPv6 شادوساکس باید درست رمزگشایی شود');
    assert.deepStrictEqual([ssAddrDomain.host, ssAddrDomain.port, ssAddrDomain.addressType], ['example.com', 443, 3], 'دامنه در Shadowsocks باید با ATYP=۳ خوانده شود');
    assert.deepStrictEqual(resolveSsCiphers('all'), ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305'], 'حالت all باید سه رمزنگاری را برگرداند');
    console.log('  ✓ تست ۱۶ (Shadowsocks: بردار RFC 8439 + سه رمزنگاری + فریم‌بندی + آدرس IPv4/IPv6): موفق');

    // ========================================================================
    // تست ۱۷: لینک‌های ss:// در ساب‌لینک (چند رمزنگاری) و تبدیل Clash/Sing-box
    // ========================================================================
    const ssUserResp = await worker.fetch(
      new Request(`https://mili.example.com/${adminUuid}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ss-user',
          preset: 'iran-fast',
          subNodeCount: 12,
          config: { ss: 'yes', ssc: 'all', locs: 'DE, NL' }
        })
      }),
      d1Env,
      {}
    );
    assert.strictEqual(ssUserResp.status, 200, 'ساخت کاربر Shadowsocks باید 200 بدهد');
    const ssUser = (await ssUserResp.json()).user;
    assert.strictEqual(ssUser.config.ss, 'yes', 'تنظیم ss باید برای کاربر ذخیره شود');
    assert.strictEqual(ssUser.config.ssc, 'all', 'تنظیم ssc باید برای کاربر ذخیره شود');

    const ssRaw = await (await worker.fetch(
      new Request(`https://mili.example.com/${ssUser.uuid}/sub?target=raw`),
      d1Env,
      {}
    )).text();
    const ssLinks = ssRaw.trim().split('\n').filter(l => l.startsWith('ss://'));
    assert.ok(ssLinks.length >= 3, `ساب باید حداقل ۳ لینک ss داشته باشد (${ssLinks.length})`);

    const ssMethods = new Set();
    for (const link of ssLinks) {
      const url = new URL(link);
      const decoded = Buffer.from(url.username.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      const [method, password] = decoded.split(':');
      assert.ok(['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305'].includes(method), `رمزنگاری ناشناخته در لینک: ${method}`);
      assert.strictEqual(password, ssUser.uuid, 'رمز عبور پیش‌فرض Shadowsocks باید UUID کاربر باشد');
      ssMethods.add(method);
      const plugin = url.searchParams.get('plugin') || '';
      assert.ok(plugin.startsWith('v2ray-plugin;tls'), 'پلاگین لینک باید v2ray-plugin با TLS باشد');
      assert.ok(plugin.includes(`host=${new URL('https://mili.example.com').host}`), 'پلاگین باید میزبان Worker را داشته باشد');
      assert.ok(/[^\[]:\d+$/.test(url.host) || url.host.startsWith('['), 'آدرس لینک باید میزبان واقعی داشته باشد');
    }
    assert.deepStrictEqual([...ssMethods].sort(), ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305'], 'هر سه رمزنگاری باید در ساب باشند');

    const ssClash = await (await worker.fetch(
      new Request(`https://mili.example.com/${ssUser.uuid}/sub?target=clash`),
      d1Env,
      {}
    )).text();
    assert.ok(ssClash.includes('type: ss') && ssClash.includes('plugin: v2ray-plugin') && ssClash.includes('mode: websocket'), 'کانفیگ Clash باید نودهای Shadowsocks را با پلاگین وب‌سوکت داشته باشد');

    const ssSingbox = JSON.parse(await (await worker.fetch(
      new Request(`https://mili.example.com/${ssUser.uuid}/sub?target=singbox`),
      d1Env,
      {}
    )).text());
    const ssOutbounds = ssSingbox.outbounds.filter(o => o.type === 'shadowsocks');
    assert.ok(ssOutbounds.length >= 3, 'کانفیگ Sing-box باید نودهای shadowsocks داشته باشد');
    assert.ok(ssOutbounds.every(o => o.plugin === 'v2ray-plugin' && o.method && o.password), 'هر outbound شادوساکس باید پلاگین و رمز داشته باشد');
    assert.ok(ssOutbounds.every(o => String(o.plugin_opts || '').includes('host=')), 'plugin_opts باید میزبان را داشته باشد');
    console.log(`  ✓ تست ۱۷ (لینک‌های ss:// با ${ssMethods.size} رمزنگاری + خروجی Clash و Sing-box): موفق`);

    // ========================================================================
    // تست ۱۸: کنترل‌های Shadowsocks در پنل مدیریت
    // ========================================================================
    assert.ok(adminHtml.includes('cfg_ss') && adminHtml.includes('cfg_ssc') && adminHtml.includes('cfg_ssp'), 'پنل باید کنترل‌های Shadowsocks را داشته باشد');
    assert.ok(adminHtml.includes('um_ss') && adminHtml.includes('um_ssc'), 'مودال کاربر باید تنظیمات Shadowsocks را داشته باشد');
    assert.ok(adminHtml.includes('Shadowsocks'), 'عنوان Shadowsocks باید در پنل دیده شود');
    assert.ok(adminHtml.includes('همه سه روش'), 'گزینه همه رمزنگاری‌ها باید در پنل باشد');
    console.log('  ✓ تست ۱۸ (کنترل‌های Shadowsocks و انتخاب رمزنگاری در پنل): موفق');

    // ========================================================================
    // تست‌های ۱۹ تا ۲۲: استخر پروکسی کشوری، پینگ واقعی، نودهای مولتی‌لوکیشن و پنل
    // ========================================================================
    await runProxyPoolTests({ assert, worker, d1Env, adminUuid, adminHtml });

    // ========================================================================
    // تست‌های ۲۳ تا ۲۷: نود اطلاعاتی، مصرف واقعی، قفل دستگاه، کلید ادمین، UI موبایل
    // ========================================================================
    await runHardeningTests({ assert, adminHtml });
  } finally {
    if (fs.existsSync(tmpTestFile)) fs.unlinkSync(tmpTestFile);
  }
}

runTests().catch(err => {
  console.error('❌ تست ناموفق بود:', err);
  process.exit(1);
});
