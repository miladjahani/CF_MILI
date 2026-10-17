// ============================================================================
// miliconfig v3.1 - باندلر ماژولار و سازنده خروجی Cloudflare Workers & Pages
// پشتیبانی همزمان از استقرار مستقیم گیت‌هاب در Cloudflare Workers و Cloudflare Pages
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { obfuscateWorkerBundle, DEAD_CODE_MARKER } from './obfuscate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const pkgVersion = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8')).version;

// ترتیب دقیق ماژول‌ها برای باندلینگ یکپارچه بدون وابستگی به باندلر خارجی
const MODULE_ORDER = [
  'src/config/defaults.js',
  'src/config/locations.js',
  'src/config/presets.js',
  'src/config/countries.js',
  'src/config/proxyPoolData.js',
  'src/config/proxyPool.js',
  'src/core/utils.js',
  'src/core/shadowsocks.js',
  'src/core/proxyProbe.js',
  'src/core/scanner.js',
  'src/ui/icons.js',
  'src/ui/baseCss.js',
  'src/ui/fx.js',
  'src/db/d1.js',
  'src/subscription/converters.js',
  'src/subscription/generator.js',
  'src/core/runtime.js',
  'src/api/handlers.js',
  'src/ui/loginHtml.js',
  'src/ui/statusHtml.js',
  'src/ui/adminHtml.js',
  'src/index.js'
];

function stripLocalImportsAndExports(code, isEntryPoint = false) {
  const lines = code.split('\n');
  const out = [];
  let skipMultiLineImport = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (skipMultiLineImport) {
      if (trimmed.includes('from ') && (trimmed.endsWith(';') || trimmed.endsWith("'") || trimmed.endsWith('"'))) {
        skipMultiLineImport = false;
      }
      continue;
    }

    // نگه داشتن فقط import { connect as cfConnect } from 'cloudflare:sockets'
    if (/^import\s+.*from\s+['"]cloudflare:sockets['"]/.test(trimmed)) {
      continue;
    }

    if (/^import\s+/.test(trimmed)) {
      if (!trimmed.includes('from ')) {
        skipMultiLineImport = true;
      }
      continue;
    }

    if (!isEntryPoint && /^export\s+default\s+/.test(trimmed)) {
      line = line.replace(/^(\s*)export\s+default\s+/, '$1');
    } else if (/^export\s+(async\s+function|function|const|let|var|class)\s+/.test(trimmed)) {
      line = line.replace(/^(\s*)export\s+/, '$1');
    }

    out.push(line);
  }

  return out.join('\n');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// هر ماژول محلی که import می‌شود باید در MODULE_ORDER باشد؛ در غیر این صورت
// کد آن بی‌صدا از باندل حذف می‌شد و Worker با خطای زمان اجرا از کار می‌افتاد.
function assertAllModulesListed() {
  const missing = new Set();
  for (const relPath of MODULE_ORDER) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`فایل ماژول یافت نشد: ${relPath}`);
    }
    const code = fs.readFileSync(fullPath, 'utf8');
    const dir = path.dirname(fullPath);
    const importRe = /from\s+['"](\.[^'"]+)['"]/g;
    let match = null;
    while ((match = importRe.exec(code))) {
      const resolved = path.relative(ROOT_DIR, path.resolve(dir, match[1])).split(path.sep).join('/');
      if (!MODULE_ORDER.includes(resolved)) missing.add(`${relPath} → ${resolved}`);
    }
  }
  if (missing.size > 0) {
    throw new Error(`این ماژول‌ها در MODULE_ORDER نیستند و از باندل حذف می‌شوند:\n  ${[...missing].join('\n  ')}`);
  }
}

async function buildAll() {
  console.log('⚡ [miliconfig] در حال ساخت و باندل کردن ماژول‌های پروژه...');
  assertAllModulesListed();

  const chunks = [`import { connect as cfConnect } from 'cloudflare:sockets';\n`];

  for (const relPath of MODULE_ORDER) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`فایل ماژول یافت نشد: ${relPath}`);
    }
    const raw = fs.readFileSync(fullPath, 'utf8');
    const isEntry = relPath === 'src/index.js';
    const cleaned = stripLocalImportsAndExports(raw, isEntry);
    chunks.push(`// --- MODULE: ${relPath} ---\n${cleaned}\n`);
  }

  const rawBundle = chunks.join('\n');

  const distDir = path.join(ROOT_DIR, 'dist');
  const publicDir = path.join(ROOT_DIR, 'public');
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  // اجرای مبهم‌سازی پیشرفته + تزریق کد مرده بدون خطای 1101
  console.log('🔒 [miliconfig] در حال اعمال مبهم‌سازی پیشرفته + تزریق کد مرده (Advanced Obfuscation + Dead Code)...');
  const { code: obfuscatedCode, meta: obfuscationMeta, injectedCode } = await obfuscateWorkerBundle(rawBundle);

  // نسخه خوانا = دقیقاً همان کدی که مبهم‌سازی می‌شود (شامل بلوک‌های کد مرده تزریق‌شده)
  const readableBundle = injectedCode || rawBundle;
  fs.writeFileSync(path.join(distDir, 'worker.readable.js'), readableBundle, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, '明文源吗'), readableBundle, 'utf8');

  // نوشتن خروجی‌های نهایی برای Cloudflare Workers و Cloudflare Pages
  fs.writeFileSync(path.join(distDir, '_worker.js'), obfuscatedCode, 'utf8');
  fs.writeFileSync(path.join(publicDir, '_worker.js'), obfuscatedCode, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, '_worker.js'), obfuscatedCode, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, '少年你相信光吗'), obfuscatedCode, 'utf8');

  // فایل‌های استاتیک کمکی برای Cloudflare Pages
  const staticAssetsHtml = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>miliconfig</title></head><body>miliconfig Cloudflare Pages Active</body></html>`;
  fs.writeFileSync(path.join(distDir, 'status-static.html'), staticAssetsHtml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'status-static.html'), staticAssetsHtml, 'utf8');
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
  fs.writeFileSync(path.join(publicDir, '.nojekyll'), '', 'utf8');

  // همه درخواست‌ها از خود Worker عبور کنند؛ در غیر این صورت فایل‌های خامی مانند
  // worker.readable.js روی دامنه Pages قابل دانلود می‌شدند و سورس لو می‌رفت.
  const routesJson = `${JSON.stringify({ version: 1, include: ['/*'], exclude: [] }, null, 0)}\n`;
  fs.writeFileSync(path.join(distDir, '_routes.json'), routesJson, 'utf8');
  fs.writeFileSync(path.join(publicDir, '_routes.json'), routesJson, 'utf8');

  // سازگاری خودکار با محیط بیلد Cloudflare Pages (تشخیص متغیر CF_PAGES=1)
  if (process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true') {
    console.log('☁️ [miliconfig] محیط Cloudflare Pages تشخیص داده شد؛ تنظیم خودکار wrangler.toml برای Pages...');
    const pagesWrangler = `name = "miliconfig"
pages_build_output_dir = "dist"
compatibility_date = "2024-09-23"

[vars]
BRAND = "miliconfig"
`;
    fs.writeFileSync(path.join(ROOT_DIR, 'wrangler.toml'), pagesWrangler, 'utf8');
  }

  console.log(`✅ [miliconfig] بیلد و مبهم‌سازی با موفقیت کامل شد! حجم باندل مبهم‌شده: ${(obfuscatedCode.length / 1024).toFixed(1)} KB`);
  console.log(`🧩 [miliconfig] تزریق کد مرده: ${obfuscationMeta.deadCodeBlocks} بلوک | موتور مبهم‌سازی: ${obfuscationMeta.obfuscator}`);
  console.log('🚀 [miliconfig] خروجی آماده استقرار روی هر دو بستر بدون سکرت: Cloudflare Pages (پوشه dist) و Cloudflare Worker (src/index.js).');

  // مانیفست بیلد: مبنای بررسی خودکار تست‌ها و گزارش استقرار
  const artifactPaths = ['dist/_worker.js', 'public/_worker.js', '_worker.js'];
  const artifactSha = sha256(obfuscatedCode);
  const manifest = {
    brand: 'miliconfig',
    version: pkgVersion,
    builtAt: new Date().toISOString(),
    targets: ['cloudflare-pages-advanced-mode', 'cloudflare-worker'],
    requiresSecrets: false,
    pagesOutputDir: 'dist',
    workerEntry: 'src/index.js',
    obfuscation: obfuscationMeta,
    obfuscatedBytes: Buffer.byteLength(obfuscatedCode, 'utf8'),
    readableBundle: {
      path: 'dist/worker.readable.js',
      bytes: Buffer.byteLength(readableBundle, 'utf8'),
      deadCodeMarker: DEAD_CODE_MARKER,
      deadCodeOccurrences: readableBundle.split(DEAD_CODE_MARKER).length - 1
    },
    artifacts: artifactPaths.map(rel => ({
      path: rel,
      bytes: Buffer.byteLength(obfuscatedCode, 'utf8'),
      sha256: artifactSha
    }))
  };
  fs.writeFileSync(path.join(distDir, 'build-info.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

buildAll().catch(err => {
  console.error('❌ خطا در بیلد پروژه:', err);
  process.exit(1);
});
