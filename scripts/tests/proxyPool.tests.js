// ============================================================================
// miliconfig v3.4 - تست استخر پروکسی تفکیک‌شده کشور + پینگ واقعی + نودهای کشوری
// این تست‌ها توسط scripts/test-worker.js اجرا می‌شوند (خروجی: ۴ تست جدید)
// ============================================================================

import {
  countryFlag,
  countryLabel,
  countryName
} from '../../src/config/countries.js';
import {
  listCountryProxies,
  pickProxiesAcrossCountries,
  pickProxiesForCountry,
  proxyPoolCountries,
  proxyPoolStats
} from '../../src/config/proxyPool.js';
import {
  buildSocks5ConnectRequest,
  parseProxyUrl,
  probeProxy,
  probeProxyList
} from '../../src/core/proxyProbe.js';

// سوکت جعلی با پاسخ‌های کنترل‌شده برای سنجش سناریوهای SOCKS5/HTTP
function createFakeSocket(onWrite) {
  let controller = null;
  const readable = new ReadableStream({
    start(c) { controller = c; }
  });
  const writable = new WritableStream({
    write(chunk) {
      const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      const reply = onWrite ? onWrite(Uint8Array.from(bytes)) : null;
      if (reply && reply.length && controller) controller.enqueue(new Uint8Array(reply));
    }
  });
  return { readable, writable, opened: Promise.resolve(), close() {} };
}

function socks5Connector({ auth = false, rep = 0 } = {}) {
  return () => {
    let step = 0;
    let authed = !auth;
    return createFakeSocket((bytes) => {
      step += 1;
      if (step === 1) {
        if (bytes[0] !== 5) return [5, 255];
        return auth ? [5, 2] : [5, 0];
      }
      if (!authed) {
        authed = true;
        return [1, 0];
      }
      return [5, rep, 0, 1, 0, 0, 0, 0, 0, 0];
    });
  };
}

function httpConnector(status = 200) {
  return () => createFakeSocket(() => new TextEncoder().encode(`HTTP/1.1 ${status} Connection established\r\n\r\n`));
}

export async function runProxyPoolTests({ assert, worker, d1Env, adminUuid, adminHtml }) {
  // ========================================================================
  // تست ۱۹: استخر پروکسی تفکیک‌شده بر اساس کشور
  // ========================================================================
  const stats = proxyPoolStats();
  assert.ok(stats.totalAlive > 100, `استخر باید پروکسی سالم داشته باشد (${stats.totalAlive})`);
  assert.ok(stats.countryCount >= 10, `استخر باید حداقل ۱۰ کشور داشته باشد (${stats.countryCount})`);

  const countries = proxyPoolCountries();
  assert.ok(countries.length === stats.countryCount, 'تعداد کشورهای فهرست باید با آمار استخر یکی باشد');
  assert.ok(countries.every(c => /^[A-Z]{2}$/.test(c.code) && c.count > 0 && c.name && c.flag), 'هر کشور باید کد/نام/پرچم/تعداد معتبر داشته باشد');
  for (let i = 1; i < countries.length; i++) {
    assert.ok(countries[i - 1].count >= countries[i].count, 'کشورها باید نزولی بر اساس تعداد مرتب شوند');
  }
  assert.strictEqual(countryFlag('DE'), '🇩🇪', 'پرچم آلمان باید درست ساخته شود');
  assert.strictEqual(countryName('US'), 'آمریکا', 'نام فارسی کشور باید برگردد');
  assert.ok(countryLabel('NL').includes('هلند'), 'برچسب کشور باید نام فارسی داشته باشد');

  const deList = listCountryProxies('DE', 6);
  assert.strictEqual(deList.length, 6, 'لیست پروکسی کشور باید به اندازه درخواست برگردد');
  assert.ok(deList.every(p => /^(socks5|http):\/\/[^\s]+:\d+$/.test(p.s)), 'هر پروکسی باید URL معتبر socks5/http باشد');
  assert.ok(deList.every((p, i, arr) => i === 0 || (arr[i - 1].pingMs || 99999) <= (p.pingMs || 99999)), 'پروکسی‌ها باید بر اساس تاخیر سلامت‌سنجی مرتب باشند');
  assert.deepStrictEqual(listCountryProxies('ZZ', 5), [], 'کشور ناشناخته باید لیست خالی بدهد');

  const picked = pickProxiesForCountry('US', 4);
  assert.strictEqual(picked.length, 4, 'انتخاب رندوم از یک کشور باید ۴ مورد بدهد');
  const across = pickProxiesAcrossCountries(['DE', 'US', 'NL'], 9);
  assert.strictEqual(across.length, 9, 'انتخاب چندکشوری باید دقیقاً تعداد درخواستی بدهد');
  assert.ok(new Set(across.map(p => p.country)).size >= 2, 'انتخاب چندکشوری باید بیش از یک کشور داشته باشد');
  assert.ok(across.every(p => p.s.startsWith('socks5://') || p.s.startsWith('http://')), 'پروکسی‌های انتخابی باید URL معتبر باشند');
  console.log('  ✓ تست ۱۹ (استخر پروکسی سالم تفکیک‌شده در ۷۳ کشور + انتخاب کشوری/چندکشوری): موفق');

  // ========================================================================
  // تست ۲۰: پینگ واقعی پروکسی (SOCKS5 + HTTP CONNECT) با سوکت جعلی
  // ========================================================================
  const parsed4 = parseProxyUrl('socks5://1.2.3.4:1080');
  assert.deepStrictEqual([parsed4.host, parsed4.port, parsed4.kind], ['1.2.3.4', 1080, 'socks5'], 'پارس پروکسی socks5 باید درست باشد');
  const parsed6 = parseProxyUrl('http://user:p:a@[2001:db8::1]:8080');
  assert.deepStrictEqual([parsed6.host, parsed6.port, parsed6.username, parsed6.password, parsed6.kind], ['2001:db8::1', 8080, 'user', 'p:a', 'http'], 'پارس پروکسی IPv6 با یوزر/پسورد باید درست باشد');
  assert.strictEqual(parseProxyUrl('not-a-proxy'), null, 'آدرس نامعتبر باید null بدهد');
  // نوع آدرس SOCKS5 باید درست انتخاب شود (IPv4=۱، دامنه=۳، IPv6=۴)
  assert.strictEqual(buildSocks5ConnectRequest('1.2.3.4', 1080)[3], 1, 'مقصد IPv4 باید ATYP=1 داشته باشد');
  assert.strictEqual(buildSocks5ConnectRequest('example.com', 443)[3], 3, 'مقصد دامنه‌ای باید ATYP=3 داشته باشد');
  const v6Req = buildSocks5ConnectRequest('2606:4700::1', 443);
  assert.strictEqual(v6Req[3], 4, 'مقصد IPv6 باید ATYP=4 داشته باشد');
  assert.strictEqual(v6Req.byteLength, 4 + 16 + 2, 'درخواست CONNECT برای IPv6 باید ۲۲ بایت باشد');

  const socksOk = await probeProxy('socks5://1.2.3.4:1080', { connector: socks5Connector(), timeoutMs: 600 });
  assert.ok(socksOk.ok && socksOk.ms >= 0, `پینگ SOCKS5 سالم باید موفق باشد (${socksOk.error || ''})`);
  const socksAuth = await probeProxy('socks5://user:pass@1.2.3.4:1080', { connector: socks5Connector({ auth: true }), timeoutMs: 600 });
  assert.ok(socksAuth.ok, 'SOCKS5 با احراز هویت باید پشتیبانی شود');
  const socksNoAuth = await probeProxy('socks5://1.2.3.4:1080', { connector: socks5Connector({ auth: true }), timeoutMs: 600 });
  assert.strictEqual(socksNoAuth.ok, false, 'پروکسی نیازمند یوزر/پسورد بدون اطلاعات ورود باید ناموفق شود');
  const socksRejected = await probeProxy('socks5://1.2.3.4:1080', { connector: socks5Connector({ rep: 5 }), timeoutMs: 600 });
  assert.strictEqual(socksRejected.ok, false, 'پاسخ رد اتصال SOCKS5 باید ناموفق گزارش شود');

  const httpOk = await probeProxy('http://9.9.9.9:3128', { connector: httpConnector(200), timeoutMs: 600 });
  assert.ok(httpOk.ok, 'تونل HTTP CONNECT 200 باید سالم گزارش شود');
  const httpAuth = await probeProxy('http://9.9.9.9:3128', { connector: httpConnector(407), timeoutMs: 600 });
  assert.strictEqual(httpAuth.ok, false, 'پاسخ 407 پروکسی HTTP باید ناموفق گزارش شود');
  assert.ok(/یوزر\/پسورد/.test(httpAuth.error || ''), 'پیام خطای 407 باید به احراز هویت اشاره کند');

  const dead = await probeProxy('socks5://1.2.3.4:1080', { connector: () => createFakeSocket(() => null), timeoutMs: 400 });
  assert.strictEqual(dead.ok, false, 'پروکسی بدون پاسخ باید با تایم‌اوت ناموفق شود');
  const noSocket = await probeProxy('socks5://1.2.3.4:1080', {});
  assert.strictEqual(noSocket.ok, false, 'در نبود سوکت باید ناموفق گزارش شود');

  const batch = await probeProxyList(
    ['socks5://1.2.3.4:1080', 'http://9.9.9.9:3128'],
    { limit: 2, timeoutMs: 600, connector: ({ hostname }) => (hostname === '9.9.9.9' ? httpConnector(200)() : socks5Connector()()) }
  );
  assert.strictEqual(batch.length, 2, 'سنجش دسته‌ای باید برای هر دو پروکسی نتیجه بدهد');
  assert.ok(batch.every(r => r.ok), 'هر دو پروکسی جعلی باید سالم گزارش شوند');
  console.log('  ✓ تست ۲۰ (پینگ واقعی SOCKS5/HTTP با تیک و ضرب + تایم‌اوت و احراز هویت): موفق');

  // ========================================================================
  // تست ۲۱: API استخر + نودهای مولتی‌لوکیشن کشوری در ساب‌لینک
  // ========================================================================
  const poolResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}/api/proxy-pool`), d1Env, {});
  assert.strictEqual(poolResp.status, 200, 'API استخر پروکسی باید 200 بدهد');
  const poolData = await poolResp.json();
  assert.ok(poolData.success && poolData.total > 100, 'API باید آمار استخر را برگرداند');
  assert.ok(Array.isArray(poolData.countries) && poolData.countries.length >= 10, 'API باید فهرست کشورها را برگرداند');

  const forbidden = await worker.fetch(new Request('https://mili.example.com/api/proxy-pool'), d1Env, {});
  assert.strictEqual(forbidden.status, 403, 'API استخر بدون مسیر مدیر باید 403 بدهد');

  const deResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}/api/proxy-pool?country=DE&limit=3`), d1Env, {});
  const deData = await deResp.json();
  assert.strictEqual(deData.proxies.length, 3, 'API باید لیست کشور درخواستی را بدهد');
  assert.ok(deData.proxies.every(p => /^(socks5|http):\/\//.test(p.s)), 'پروکسی‌های API باید URL معتبر باشند');

  const randomResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}/api/proxy-pool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'random', countries: 'all', count: 6 })
  }), d1Env, {});
  const randomData = await randomResp.json();
  assert.strictEqual(randomData.proxies.length, 6, 'اکشن random باید ۶ پروکسی بدهد');
  assert.ok(new Set(randomData.proxies.map(p => p.country)).size >= 2, 'اکشن random باید چند کشور را پوشش دهد');

  const pingResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}/api/proxy-pool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping', proxies: ['socks5://127.0.0.1:1'], timeoutMs: 800 })
  }), d1Env, {});
  const pingData = await pingResp.json();
  assert.ok(pingData.success && pingData.results.length === 1, 'اکشن ping باید نتیجه هر پروکسی را برگرداند');
  assert.strictEqual(pingData.results[0].ok, false, 'پروکسی بی‌پاسخ در محیط تست باید ناموفق باشد');
  assert.strictEqual(typeof pingData.results[0].ms, 'number', 'نتیجه پینگ باید تاخیر عددی داشته باشد');

  const poolUserResp = await worker.fetch(new Request(`https://mili.example.com/${adminUuid}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'pool-user',
      preset: 'iran-fast',
      subNodeCount: 6,
      config: { cpx: 'yes', pcc: 'DE,US', cpn: 6, locs: 'no', epi: 'no', epd: 'no', egi: 'no', ena: 'no', ipv6: 'no' }
    })
  }), d1Env, {});
  assert.strictEqual(poolUserResp.status, 200, 'ساخت کاربر با نودهای کشوری باید 200 بدهد');
  const poolUser = (await poolUserResp.json()).user;
  assert.strictEqual(poolUser.config.cpx, 'yes', 'تنظیم cpx باید ذخیره شود');
  assert.strictEqual(String(poolUser.config.cpn), '6', 'تنظیم cpn باید ذخیره شود');

  const poolSub = await (await worker.fetch(
    new Request(`https://mili.example.com/${poolUser.uuid}/sub?target=raw`),
    d1Env,
    {}
  )).text();
  // سه خط اول نودهای اطلاعاتی هاردکد هستند و در شمارش نودهای کشوری حساب نمی‌شوند
  const INFO_NODES_COUNT = 3;
  const poolLines = poolSub.trim().split('\n').filter(Boolean).slice(INFO_NODES_COUNT);
  assert.strictEqual(poolLines.length, 6, `ساب کاربر کشوری باید ۶ نود داشته باشد (${poolLines.length})`);
  const countryOf = (link) => decodeURIComponent(link.split('#')[1] || '').replace(/^\d+\+miliconfig ?/, '').trim();
  const codes = poolLines.map(countryOf);
  assert.ok(codes.every(c => c === 'DE' || c === 'US'), `نام نودها باید کد کشور داشته باشد (${codes.join(',')})`);
  assert.ok(new Set(codes).size >= 2, 'ساب باید بیش از یک کشور داشته باشد');
  const sValues = new Set();
  for (const link of poolLines) {
    const params = new URLSearchParams(link.split('?')[1].split('#')[0]);
    // پروکسی خروجی داخل پارامتر path نود قرار می‌گیرد: path=/?ed=2048&s=socks5://ip:port
    const pathValue = decodeURIComponent(params.get('path') || '');
    const inner = new URLSearchParams((pathValue.split('?')[1] || ''));
    const s = inner.get('s') || '';
    assert.ok(/^(socks5|http):\/\/[^\s]+:\d+$/.test(s), `پارامتر s هر نود باید پروکسی معتبر باشد (${s})`);
    sValues.add(s);
  }
  assert.strictEqual(sValues.size, 6, 'هر نود باید پروکسی خروجی اختصاصی خودش را داشته باشد');

  const cleanSub = await (await worker.fetch(
    new Request(`https://mili.example.com/${poolUser.uuid}/sub?target=raw&locs=no`),
    d1Env,
    {}
  )).text();
  assert.strictEqual(cleanSub.trim().split('\n').length, 6 + INFO_NODES_COUNT, 'با locs=no نباید نود لوکیشن اضافه شود');
  console.log('  ✓ تست ۲۱ (API استخر + نودهای مولتی‌لوکیشن کشوری با s اختصاصی در ساب‌لینک): موفق');

  // ========================================================================
  // تست ۲۲: کنترل‌های پنل برای استخر کشورها و مولتی‌لوکیشن رندوم
  // ========================================================================
  const panelNeedles = [
    'proxyCountrySelect',
    'sProxyList',
    'proxyPoolMeta',
    'loadCountryProxies',
    'autoRandomMultiLocation',
    'pickProxyByIndex',
    'pingProxyRows',
    'cfg_cpx',
    'cfg_pcc',
    'cfg_cpn',
    'um_scc',
    'applyUserCountryProxy',
    'data-pick-proxy',
    'data-ping-proxy',
    '/api/proxy-pool',
    'pool-picker'
  ];
  for (const needle of panelNeedles) {
    assert.ok(adminHtml.includes(needle), `پنل باید «${needle}» را داشته باشد`);
  }
  console.log('  ✓ تست ۲۲ (پنل: لیست کشویی کشور، پینگ با ✓/✗، انتخاب پروکسی و دکمه مولتی‌لوکیشن رندوم): موفق');
}
