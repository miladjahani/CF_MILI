// ============================================================================
// miliconfig v3.1 - نقطه ورود اصلی Cloudflare Workers & Pages
// مجهز به لایه دیتابیس D1، مدیریت چندکاربره، نام‌گذاری number+miliconfig و محافظ ضد خطای 1101
// ============================================================================

import { BRAND_NAME, DIRECT_DOMAINS, OFFICIAL_DIRECT_IPS } from './config/defaults.js';
import {
  ensureD1Schema,
  getAdminUuid,
  getStorageDiagnostics,
  resolveAdminKey,
  getUserByIdOrToken,
  listUsers,
  loadGlobalConfig,
  recordUserActivity
} from './db/d1.js';
import { handleWebSocketUpgrade, handleXhttpPostRequest } from './core/runtime.js';
import { generateUserNodesList, handleSubscriptionResponse } from './subscription/generator.js';
import {
  handleConfigApi,
  handleDashboardStatsApi,
  handlePreferredIpsApi,
  handleProxyPoolApi,
  handlePublicUserStatusApi,
  handleScannerApi,
  handleUsersApi
} from './api/handlers.js';
import { VIEWPORT_META } from './ui/baseCss.js';
import { renderLoginGatewayHtml } from './ui/loginHtml.js';
import { renderUserStatusPageHtml } from './ui/statusHtml.js';
import { renderAdminDashboardHtml } from './ui/adminHtml.js';

function normalizeCleanPath(p = '') {
  return String(p || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

// مسیرهای دارای درصد ناقص (مثل /status/%E0) نباید URIError بدهند؛
// در غیر این صورت درخواست با پاسخ ۲۰۰ «recovered» اشتباه برگردانده می‌شد.
function decodePathToken(value) {
  try {
    return decodeURIComponent(String(value ?? ''));
  } catch (_e) {
    return String(value ?? '');
  }
}

function isAdminAuthorizedPath(prefixPath, adminUuid, customPath) {
  const cleanPrefix = normalizeCleanPath(prefixPath);
  if (!cleanPrefix) return false;
  const cleanAdmin = normalizeCleanPath(adminUuid);
  const cleanCustom = normalizeCleanPath(customPath);
  if (cleanCustom) {
    return cleanPrefix === cleanCustom || cleanPrefix === cleanAdmin;
  }
  return cleanPrefix === cleanAdmin;
}

export default {
  async fetch(request, env = {}, ctx = {}) {
    try {
      const url = new URL(request.url);
      const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase();
      const isWebSocket = upgradeHeader === 'websocket';

      // اطمینان از آماده بودن اسکیمای D1 یا حافظه پشتیبان بدون هیچ خطایی
      await ensureD1Schema(env);
      // کلید ادمین هر استقرار: اگر متغیر محیطی u تعیین شده باشد همان،
      // در غیر این صورت یک کلید یکتا ساخته و در D1 ذخیره می‌شود.
      const adminUuid = await resolveAdminKey(env);
      const globalCfg = await loadGlobalConfig(env);
      const allUsers = await listUsers(env);

      // ۱. هندل کردن ترافیک پروکسی WebSocket (VLESS + Trojan + UDP DNS)
      if (isWebSocket) {
        return await handleWebSocketUpgrade(request, env, ctx, globalCfg, allUsers, adminUuid);
      }

      const pathParts = url.pathname.split('/').filter(Boolean);

      // ۲. هندل کردن APIهای مدیریتی و عمومی
      if (url.pathname.includes('/api/')) {
        const apiIdx = pathParts.indexOf('api');
        const prefix = pathParts.slice(0, apiIdx).join('/');
        const apiSubPath = pathParts.slice(apiIdx + 1).join('/');

        // API عمومی صفحه وضعیت کاربر
        if (apiSubPath.startsWith('status/')) {
          const token = decodePathToken(apiSubPath.slice('status/'.length));
          return await handlePublicUserStatusApi(request, env, token);
        }

        // بررسی دسترسی مدیر برای APIهای مدیریتی
        if (!isAdminAuthorizedPath(prefix, adminUuid, globalCfg.d)) {
          return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز (مسیر مدیریت نامعتبر است)' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        }

        if (apiSubPath === 'config') {
          return await handleConfigApi(request, env);
        }
        if (apiSubPath === 'users') {
          return await handleUsersApi(request, env);
        }
        if (apiSubPath === 'preferred-ips') {
          return await handlePreferredIpsApi(request, env, true);
        }
        if (apiSubPath === 'scanner') {
          return await handleScannerApi(request, env, true);
        }
        if (apiSubPath === 'proxy-pool') {
          return await handleProxyPoolApi(request, env, true);
        }
        if (apiSubPath === 'stats' || apiSubPath === 'd1-init') {
          return await handleDashboardStatsApi(request, env);
        }

        return new Response(JSON.stringify({ error: 'مسیر API یافت نشد' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // ۳. هندل کردن پروتکل xhttp (درخواست‌های POST غیر API)
      if (request.method === 'POST') {
        return await handleXhttpPostRequest(request, env, ctx, globalCfg, allUsers, adminUuid);
      }

      // ۴. هندل کردن درخواست‌های GET
      if (request.method === 'GET' || request.method === 'HEAD') {
        // ۴-الف: صفحه اصلی /
        if (url.pathname === '/' || pathParts.length === 0) {
          if (globalCfg.homepage && String(globalCfg.homepage).trim()) {
            try {
              const camouflageResp = await fetch(String(globalCfg.homepage).trim(), {
                method: 'GET',
                headers: {
                  'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
                  Accept: request.headers.get('Accept') || '*/*'
                },
                redirect: 'follow'
              });
              if (camouflageResp.ok) {
                return new Response(await camouflageResp.text(), {
                  status: camouflageResp.status,
                  headers: {
                    'Content-Type': camouflageResp.headers.get('Content-Type') || 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                  }
                });
              }
            } catch (_e) {}
          }
          return new Response(renderLoginGatewayHtml({ customPath: globalCfg.d }), {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // ۴-ب: مسیرهای سازگار با کد پایه /{prefix}/region و /{prefix}/test-api
        if (pathParts.length === 2 && (pathParts[1] === 'region' || pathParts[1] === 'test-api')) {
          const prefix = pathParts[0];
          if (!isAdminAuthorizedPath(prefix, adminUuid, globalCfg.d)) {
            return new Response(JSON.stringify({ error: 'Access Denied' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          if (pathParts[1] === 'region') {
            return new Response(
              JSON.stringify({
                region: globalCfg.wk ? globalCfg.wk.toUpperCase() : globalCfg.p ? 'CUSTOM' : 'CF',
                detectionMethod: globalCfg.wk ? 'تعیین دستی منطقه' : globalCfg.p ? 'ProxyIP سفارشی' : 'اتصال مستقیم رسمی CF',
                timestamp: new Date().toISOString()
              }),
              { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
          return new Response(
            JSON.stringify({
              detectedRegion: 'CF',
              message: 'API تست با موفقیت انجام شد',
              timestamp: new Date().toISOString()
            }),
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // ۴-ج: صفحه وضعیت اختصاصی برای ارسال به کاربر (/status/{token} یا /{token}/status)
        if (
          (pathParts[0] === 'status' && pathParts[1]) ||
          (pathParts.length === 2 && pathParts[1] === 'status')
        ) {
          const token = decodePathToken(pathParts[0] === 'status' ? pathParts[1] : pathParts[0]);
          let userObj = await getUserByIdOrToken(env, token);
          if (!userObj && isAdminAuthorizedPath(token, adminUuid, globalCfg.d)) {
            userObj = allUsers[0] || {
              id: 'mili-admin',
              username: 'Admin',
              uuid: adminUuid,
              subNodeCount: globalCfg.subNodeCount || 50,
              enabled: true,
              status: 'active',
              dataLimitGb: 0,
              usedBytes: 0,
              lifetimeBytes: 0,
              requestCount: 0,
              expireDays: 0,
              expireAt: 0,
              startOnFirstUse: true,
              ipLimit: 50,
              nodeScope: 'all',
              config: globalCfg
            };
          }
          if (!userObj) {
            return new Response('کاربر مورد نظر یافت نشد', {
              status: 404,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          }
          const nodes = await generateUserNodesList(userObj, url.hostname, {
            limit: userObj.subNodeCount
          });
          return new Response(renderUserStatusPageHtml(userObj, nodes, request.url), {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          });
        }

        // ۴-د: لینک اشتراک کلاینت‌ها (/{token}/sub یا /sub/{token})
        if (
          (pathParts.length >= 2 && pathParts[pathParts.length - 1] === 'sub') ||
          (pathParts[0] === 'sub' && pathParts[1])
        ) {
          const token = pathParts[0] === 'sub'
            ? decodePathToken(pathParts.slice(1).join('/'))
            : decodePathToken(pathParts.slice(0, -1).join('/'));

          let targetUser = await getUserByIdOrToken(env, token);
          if (!targetUser && isAdminAuthorizedPath(token, adminUuid, globalCfg.d)) {
            targetUser = {
              id: allUsers[0]?.id || null,
              username: BRAND_NAME,
              uuid: adminUuid,
              subNodeCount: globalCfg.subNodeCount || 50,
              enabled: true,
              dataLimitGb: 0,
              usedBytes: 0,
              expireAt: 0,
              nodeScope: 'all',
              config: globalCfg
            };
          }
          if (!targetUser) {
            return new Response(JSON.stringify({ error: 'شناسه اشتراک نامعتبر است' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          if (targetUser.id) {
            const p = recordUserActivity(env, targetUser.id, 0, 1).catch(() => {});
            if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p);
          }
          return await handleSubscriptionResponse(request, targetUser, url);
        }

        // ۴-هـ: دسترسی به پنل مدیریت ادمین یا صفحه وضعیت کاربر با /{token}
        const fullCleanPath = normalizeCleanPath(url.pathname);
        if (isAdminAuthorizedPath(fullCleanPath, adminUuid, globalCfg.d)) {
          if (url.searchParams.get('view') === 'status') {
            const adminUser = allUsers[0] || {
              id: 'mili-admin',
              username: BRAND_NAME,
              uuid: adminUuid,
              subNodeCount: globalCfg.subNodeCount || 50,
              enabled: true,
              config: globalCfg
            };
            const nodes = await generateUserNodesList(adminUser, url.hostname, {
              limit: adminUser.subNodeCount
            });
            return new Response(renderUserStatusPageHtml(adminUser, nodes, request.url), {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }

          const diag = await getStorageDiagnostics(env);
          const customYxCount = (globalCfg.yx || '').split(',').filter(Boolean).length;
          return new Response(
            renderAdminDashboardHtml({
              config: globalCfg,
              users: allUsers,
              diagnostics: {
                ...diag,
                healthyCfIps: customYxCount + DIRECT_DOMAINS.length + OFFICIAL_DIRECT_IPS.length
              },
              adminPath: fullCleanPath
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store'
              }
            }
          );
        }

        // اگر توکن متعلق به یکی از کاربران ثبت‌شده در D1 باشد، صفحه وضعیت اختصاصی همان کاربر نمایش داده می‌شود
        const matchedUser = await getUserByIdOrToken(env, fullCleanPath);
        if (matchedUser) {
          const nodes = await generateUserNodesList(matchedUser, url.hostname, {
            limit: matchedUser.subNodeCount
          });
          return new Response(renderUserStatusPageHtml(matchedUser, nodes, request.url), {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          });
        }
      }

      // مسیر ناشناس: برای درخواست‌های صفحه یک راهنمای خوانا برگردانده می‌شود تا
      // کاربر بداند باید کلید ادمین (مسیر u) را وارد کند یا UUID یک کاربر.
      const wantsHtml = !url.pathname.includes('/api/') &&
        String(request.headers.get('Accept') || '').includes('text/html');
      if (wantsHtml) {
        const helpHtml = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8">${VIEWPORT_META}<title>مسیر ناشناس — ${BRAND_NAME}</title></head>
<body style="margin:0;background:#060b06;color:#e6f2e6;font-family:system-ui,-apple-system,Segoe UI,Tahoma,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:20px">
<div style="max-width:520px;width:100%;background:rgba(12,20,12,.9);border:1px solid rgba(163,230,53,.25);border-radius:20px;padding:22px">
  <h1 style="margin:0 0 10px;font-size:1.15rem">این آدرس به پنل یا کاربری تعلق ندارد</h1>
  <p style="margin:0 0 14px;line-height:1.9;font-size:.9rem;color:#b8ceb8">
    «${BRAND_NAME}» را با <b>کلید ادمین</b> باز کنید: <code>/${BRAND_NAME}/&lt;u&gt;</code>؛ مقدار <code>u</code> را در
    Cloudflare (Pages → Settings → Variables) یا با <code>npm run cf:bind</code> ببینید.
    اگر قصد داشتید صفحه وضعیت یک کاربر را ببینید، UUID همان کاربر را وارد کنید.
  </p>
  <a href="/" style="display:inline-block;padding:12px 16px;border-radius:12px;background:rgba(163,230,53,.16);border:1px solid rgba(163,230,53,.4);color:#d9f99d;text-decoration:none;font-weight:700">↩ بازگشت به صفحه ورود</a>
</div></body></html>`;
        return new Response(helpHtml, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (err) {
      // محافظ سطح بالا جهت جلوگیری ۱۰۰٪ از بروز خطای Cloudflare Error 1101
      return new Response(
        JSON.stringify({
          status: 'recovered',
          brand: BRAND_NAME,
          message: err?.message || String(err)
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }
  }
};
