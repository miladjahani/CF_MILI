# HOW — استقرار خودکار miliconfig روی Cloudflare Pages

این فایل فقط «دستورها»ست: از صفر تا پنل ادمینِ کارکننده، بدون کار دستی در داشبورد (به‌جز یک مورد که در بخش ۴ توضیح داده شده).

---

## ۰) خلاصه در سه خط

```bash
npm run cf:setup     # ساخت D1 + ساخت پروژه Pages + ست‌کردن متغیرها
npm run cf:bind      # ترمیم/تأیید متغیرها + اتصال D1 (قابل تکرار)
npm run deploy:pages # بیلد + آپلود روی Pages
```

بعد از این سه دستور، آدرس پنل ادمین چاپ می‌شود: `https://<project>.pages.dev/<کلید ادمین>`

---

## ۱) پیش‌نیازها

| مورد | مقدار لازم |
|---|---|
| Node.js | ۱۸ یا بالاتر |
| توکن API کلودفلر | مجوزهای `Pages:Edit`، `D1:Edit`، `Account:Read` |
| شناسه حساب | از داشبورد یا URL حساب |
| متغیرهای محیطی | `CLOUDFLARE_API_TOKEN` و `CLOUDFLARE_ACCOUNT_ID` |

متغیرها را در `.env.local` بگذارید (این فایل در `.gitignore` است و هرگز کامیت نمی‌شود):

```bash
# در ترمینال معمولی:
printf 'CLOUDFLARE_API_TOKEN=%s\nCLOUDFLARE_ACCOUNT_ID=%s\n' 'YOUR_TOKEN' 'YOUR_ACCOUNT_ID' >> .env.local
```

اگر داخل Freebuff هستید، به‌جای آن (مقدار را در فایل نمی‌نویسد و امن‌تر است):

```bash
freebuff-env set --file .env.local '{"CLOUDFLARE_API_TOKEN":"...","CLOUDFLARE_ACCOUNT_ID":"..."}'
```

> توکن را هرگز داخل `README`، `HOW.md`، `wrangler.toml` یا کد نگذارید. اگر لو رفت، از داشبورد Cloudflare → My Profile → API Tokens حذف/بازسازی کنید.

---

## ۲) استقرار (مرحله به مرحله)

### گام ۱ — زیرساخت
```bash
npm run cf:setup
```
این کار انجام می‌شود:
1. ساخت دیتابیس D1 با نام `miliconfig-db` (اگر نباشد).
2. ساخت پروژه Pages با نام `mili-cfg` (اگر نباشد).
3. ست‌کردن `u` (کلید ادمین) و `BRAND`.
4. چاپ کلید ادمین، شناسه D1 و دستورهای بعدی.

نکته: اگر پروژه از قبل `u` داشته باشد، **همان کلید حفظ می‌شود** تا اجرای دوباره مسیر پنل را عوض نکند.

### گام ۲ — اتصال D1 و تأیید متغیرها
```bash
npm run cf:bind
```
- اگر `u` حذف شده باشد، بازگردانده می‌شود.
- بایند D1 به شکل `DB → miliconfig-db` ست می‌شود.
- اگر API بایند را نپذیرد، خودش پیام می‌دهد که یک‌بار از داشبورد اضافه کنید:
  `Workers & Pages → mili-cfg → Settings → Bindings → D1 database → Variable name: DB`

### گام ۳ — استقرار
```bash
npm run deploy:pages
```
- بیلد در `dist/` انجام می‌شود (`_worker.js` + `_routes.json`).
- آدرس استقرار چاپ می‌شود؛ مثلاً `https://<hash>.mili-cfg-888.pages.dev`.

### گام ۴ — بررسی
```bash
npm run cf:status
curl -s -o /dev/null -w "%{http_code}\n" https://mili-cfg-888.pages.dev/
```
باید `200` باشد. سپس آدرس `https://mili-cfg-888.pages.dev/<کلید ادمین>` را باز کنید.

---

## ۳) «رمز» پنل چیست؟

پنل **رمز عبور ندارد**. کلید ادمین همان `u` است که در URL می‌آید:

```
https://mili-cfg-888.pages.dev/mili-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

سه راه دیدنش:
1. خروجی `npm run cf:setup` یا `npm run cf:bind` (خط «مسیر ادمین»).
2. داشبورد: `Workers & Pages → mili-cfg → Settings → Variables and Secrets → u`.
3. لاگ Worker: اگر `u` ست نشده باشد، برنامه یک کلید یکتا می‌سازد و یک‌بار در لاگ چاپ می‌کند (`[miliconfig] ADMIN KEY: ...`) و در D1 ذخیره می‌کند.

### تغییر یا چرخش کلید
```bash
ADMIN_KEY=my-secret-path npm run cf:bind
npm run deploy:pages          # تغییر u فقط با استقرار جدید اعمال می‌شود
```
یا در داشبورد متغیر `u` را عوض کنید و یک استقرار جدید بزنید.
اگر `u` را حذف کنید، برنامه کلید یکتا می‌سازد (فقط وقتی D1 وصل باشد پایدار می‌ماند).

---

## ۴) چرا D1 لازم است؟

بدون D1 برنامه در حالت حافظه اجرا می‌شود: کار می‌کند ولی کاربران، مصرف و کلید ادمین با ری‌استارت ایزوله از دست می‌روند.
با اتصال `DB`، جدول‌ها در اولین درخواست خودکار ساخته می‌شوند (بدون `wrangler d1 execute`).

بررسی اتصال:
```bash
curl -s https://mili-cfg-888.pages.dev/<کلید>/api/stats | head -c 300
```
اگر `d1Enabled:true` بود، دیتابیس وصل است.

---

## ۵) عیب‌یابی خطاهای رایج

| خطا | معنا | راه‌حل |
|---|---|---|
| `522` / `Host Error` | دامنه `*.pages.dev` هیچ استقرار موفقی ندارد | `npm run deploy:pages` |
| `8000119 Pages project blocked` | مسدودسازی سمت Cloudflare (نه کد) | ایمیل به `abusereply@cloudflare.com`؛ تا رفع آن هیچ استقرار جدیدی اعمال نمی‌شود |
| `8000006 Request body is incorrect` | شکل بایند D1 در API | از `npm run cf:bind` استفاده کنید (شکل درست: `{DB:{id}}` نقشه‌ای) |
| `10000 Authentication error` | توکن مجوز/حساب اشتباه | توکن با `Pages:Edit` و `D1:Edit` روی همان `ACCOUNT_ID` |
| `1101` (Worker) | خطای اجرای اسکریپت در Workers | استقرار Pages را استفاده کنید؛ `deploy:worker` برای همین حساب جواب نمی‌دهد |
| `404` روی `/<کلید>` | `u` روی استقرار فعلی ست نشده | `npm run cf:bind && npm run deploy:pages` |
| `403 دسترسی غیرمجاز` در `/api/*` | مسیر ادمین در URL اشتباه است | همان مقدار `u` را در مسیر بگذارید |
| نودها وصل نمی‌شوند | پروکسی/آی‌پی سالم نیست | در پنل دکمه «⚡ لیست + پینگ واقعی» و سپس قفل با `qj=only` |

---

## ۶) متغیرهای لازم

| نام | نوع | توضیح |
|---|---|---|
| `u` | Secret/Plain | کلید ادمین؛ مسیر پنل `/<u>` |
| `BRAND` | Plain | نام برند (پیش‌فرض `miliconfig`) |
| `DB` | Binding (D1) | دیتابیس `miliconfig-db` |

هیچ متغیر دیگری برای کارکرد لازم نیست.

---

## ۷) امنیت انتشار

- `_routes.json` با `include:["/*"]` ساخته می‌شود؛ بنابراین `worker.readable.js` و فایل‌های خام روی دامنه در دسترس نیستند (با `curl` بررسی کنید: باید `404` بدهد).
- توکن کلودفلر و کلید ادمین را کامیت نکنید؛ `.env.local` در گیت ایگنور است.
- برای چرخش دوره‌ای کلید: `ADMIN_KEY=<new> npm run cf:bind && npm run deploy:pages`.

---

## ۸) چک‌لیست پس از استقرار

- [ ] `npm run cf:status` → آخرین استقرار `stage=deploy`, `status=success`
- [ ] `curl /` → `200`
- [ ] `curl /worker.readable.js` → `404`
- [ ] `curl /<کلید>` → `200` (پنل باز می‌شود)
- [ ] `curl /<کلید>/api/stats` → `d1Enabled:true`
- [ ] ساخت یک کاربر تست، گرفتن ساب و تأیید سه نود اطلاعاتی ابتدای لیست
- [ ] بررسی قفل دستگاه با `ipLimit=3` روی سه گوشی/آی‌پی مختلف
