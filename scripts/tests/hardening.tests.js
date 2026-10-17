// ============================================================================
// تست‌های سخت‌سازی v3.3:
//   ۲۳) سه نود اطلاعاتی هاردکد در همه ساب‌ها
//   ۲۴) مصرف واقعی (upload/download) در هدر Subscription-Userinfo
//   ۲۵) قفل سخت‌افزاری ipLimit (پذیرش تا سقف و رد دستگاه اضافه)
//   ۲۶) کلید ادمین یکتا برای هر استقرار
//   ۲۷) UI موبایل: drawer راست + پرده محو + دکمه روشن/خاموش جلوه‌ها
// ============================================================================
import { generateUserNodesList, handleSubscriptionResponse } from '../../src/subscription/generator.js';
import { checkUserIpLimit, releaseUserIps, resolveAdminKey } from '../../src/db/d1.js';
import { INFO_NODE_LABELS, prependInfoNodes } from '../../src/core/utils.js';
import { FX_MARKUP } from '../../src/ui/fx.js';

export async function runHardeningTests({ assert, adminHtml }) {
  // ========================================================================
  // تست ۲۳: نودهای اطلاعاتی هاردکد در ابتدای ساب + کارکردن (کپی میزبان واقعی)
  // ========================================================================
  const user = {
    id: 'u-hardening',
    uuid: '351c9981-04b6-4103-aa4b-864aa9c91469',
    username: 'hardening',
    subNodeCount: 4,
    enabled: true,
    ipLimit: 2,
    nodeScope: 'all',
    config: {}
  };
  const links = await generateUserNodesList(user, 'mili.example.com', { limit: 4 });
  assert.ok(links.length >= INFO_NODE_LABELS.length + 1, 'ساب باید حداقل سه نود اطلاعاتی + یک نود واقعی داشته باشد');
  const names = links.map(l => {
    const i = l.indexOf('#');
    return i > -1 ? decodeURIComponent(l.substring(i + 1)) : '';
  });
  INFO_NODE_LABELS.forEach((label, idx) => {
    assert.strictEqual(names[idx], label, `نود اطلاعاتی شماره ${idx + 1} باید «${label}» باشد`);
  });
  assert.ok(links[0].startsWith('vless://'), 'نود اطلاعاتی باید لینک معتبر vless باشد');
  INFO_NODE_LABELS.forEach((_label, idx) => {
    const infoBase = links[idx].split('#')[0];
    const realBase = links[INFO_NODE_LABELS.length + idx].split('#')[0];
    assert.strictEqual(infoBase, realBase, 'هر نود اطلاعاتی باید میزبان یک نود واقعی را کپی کند تا اتصالش کار کند');
  });
  assert.strictEqual(prependInfoNodes([]).length, 0, 'آرایه خالی نباید نود اطلاعاتی بسازد');
  console.log('  ✓ تست ۲۳ (سه نود اطلاعاتی هاردکد در ابتدای همه ساب‌ها): موفق');

  // ========================================================================
  // تست ۲۴: مصرف واقعی آپلود/دانلود در ساب ارسالی به کاربر
  // ========================================================================
  const subUrl = new URL('https://mili.example.com/sub?target=raw');
  const profile = {
    ...user,
    usedBytes: 5 * 1048576,
    uploadBytes: 2 * 1048576,
    downloadBytes: 3 * 1048576,
    dataLimitGb: 10,
    expireAt: 1800000000000
  };
  const subRes = await handleSubscriptionResponse(new Request(subUrl.toString()), profile, subUrl);
  const userInfo = subRes.headers.get('Subscription-Userinfo') || '';
  assert.ok(userInfo.includes('upload=2097152'), `هدر مصرف باید آپلود واقعی را داشته باشد: ${userInfo}`);
  assert.ok(userInfo.includes('download=3145728'), `هدر مصرف باید دانلود واقعی را داشته باشد: ${userInfo}`);
  assert.ok(userInfo.includes('total=10737418240'), `هدر مصرف باید سقف حجم را داشته باشد: ${userInfo}`);
  assert.ok(!userInfo.includes('upload=0;'), 'آپلود نباید صفر هاردکد شود');
  console.log('  ✓ تست ۲۴ (مصرف واقعی آپلود/دانلود در هدر ساب): موفق');

  // ========================================================================
  // تست ۲۵: قفل سخت‌افزاری — بیش از سقف ipLimit پذیرفته نشود
  // ========================================================================
  const lockUser = { id: 'u-ip-lock-' + Date.now(), ipLimit: 2 };
  await releaseUserIps({}, lockUser.id);
  const first = await checkUserIpLimit({}, lockUser, '1.1.1.1');
  const second = await checkUserIpLimit({}, lockUser, '2.2.2.2');
  const third = await checkUserIpLimit({}, lockUser, '3.3.3.3');
  const repeat = await checkUserIpLimit({}, lockUser, '1.1.1.1');
  assert.strictEqual(first.allowed, true, 'دستگاه اول باید پذیرفته شود');
  assert.strictEqual(second.allowed, true, 'دستگاه دوم باید پذیرفته شود');
  assert.strictEqual(third.allowed, false, 'دستگاه سوم باید رد شود (سقف ۲)');
  assert.strictEqual(third.reason, 'ip-limit-reached');
  assert.strictEqual(repeat.allowed, true, 'دستگاه قبلاً ثبت‌شده باید دوباره پذیرفته شود');
  await releaseUserIps({}, lockUser.id);
  const afterRelease = await checkUserIpLimit({}, lockUser, '4.4.4.4');
  assert.strictEqual(afterRelease.allowed, true, 'پس از آزادسازی، دستگاه جدید باید پذیرفته شود');
  const noIp = await checkUserIpLimit({}, lockUser, '');
  assert.strictEqual(noIp.allowed, true, 'بدون آی‌پی نباید اتصال مسدود شود');
  console.log('  ✓ تست ۲۵ (قفل سخت‌افزاری ipLimit و آزادسازی دستگاه‌ها): موفق');

  // ========================================================================
  // تست ۲۶: کلید ادمین یکتا برای هر استقرار
  // ========================================================================
  const key1 = await resolveAdminKey({});
  const key2 = await resolveAdminKey({});
  assert.ok(key1.startsWith('mili-'), `کلید ادمین باید با mili- شروع شود: ${key1}`);
  assert.ok(key1.length > 20, 'کلید ادمین باید به اندازه کافی بلند باشد');
  assert.strictEqual(key1, key2, 'کلید ادمین باید بین درخواست‌ها پایدار بماند');
  const envKey = await resolveAdminKey({ u: 'Custom-Path-123' });
  assert.strictEqual(envKey, 'custom-path-123', 'اگر u در محیط تعیین شود، همان مسیر ادمین است');
  assert.strictEqual((await resolveAdminKey({})), key1, 'بازگشت به کلید ذخیره‌شده پس از کلید محیطی');
  console.log('  ✓ تست ۲۶ (کلید ادمین یکتا و پایدار برای هر استقرار): موفق');

  // ========================================================================
  // تست ۲۷: UI موبایل (drawer راست + پرده محو) و دکمه روشن/خاموش FX
  // ========================================================================
  assert.ok(adminHtml.includes('sb-scrim'), 'پنل باید پرده محو پشت منوی کشویی داشته باشد');
  assert.ok(adminHtml.includes("classList.toggle('drawer-open'"), 'کلاس drawer باید در پنل مدیریت شود');
  assert.ok(adminHtml.includes('drawer-lock'), 'قفل اسکرول بدنه هنگام باز بودن منو لازم است');
  assert.ok(/\.sidebar[\s\S]{0,2000}translate3d\(104%/.test(adminHtml), 'منوی موبایل باید از سمت راست سُر بخورد');
  assert.ok(adminHtml.includes('backdrop-filter: blur(24px)'), 'منوی موبایل باید حس شیشه‌ای iOS داشته باشد');
  assert.ok(adminHtml.includes('آپلود ↑') && adminHtml.includes('دانلود ↓'), 'پنل باید مصرف واقعی آپلود/دانلود را جداگانه نشان دهد');
  assert.ok(FX_MARKUP.includes('fxPowerBtn'), 'دکمه روشن/خاموش جلوه‌ها باید در همه صفحات باشد');
  assert.ok(FX_MARKUP.includes('aria-pressed'), 'دکمه FX باید وضعیت دسترس‌پذیری داشته باشد');
  console.log('  ✓ تست ۲۷ (منوی کشویی راست + حس iOS + دکمه روشن/خاموش FX): موفق');
}
