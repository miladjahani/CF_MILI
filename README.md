# miliconfig v3.3 — مرکز کنترل زیرساخت پروکسی روی Cloudflare Workers & Pages + D1

![Version](https://img.shields.io/badge/version-v3.3--D1-b5ff4d?style=flat-square&labelColor=0b140b)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%26%20Pages-84cc16?style=flat-square&labelColor=0b140b)
![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare%20D1%20Auto--Migrate-a3e635?style=flat-square&labelColor=0b140b)
![Obfuscation](https://img.shields.io/badge/Security-Obfuscation%20%2B%20Dead%20Code-b5ff4d?style=flat-square&labelColor=0b140b)
![Deploy](https://img.shields.io/badge/Deploy-Zero%20Secret%20(Pages%20%2B%20Workers)-a3e635?style=flat-square&labelColor=0b140b)

**زبان:** [فارسی](فارسی.md) | [English](#english-overview)

> 🚀 **راهنمای گام‌به‌گام استقرار خودکار روی Pages: [HOW.md](HOW.md)** — از توکن و D1 تا کلید ادمین و عیب‌یابی 522/8000119.

---

## ویژگی‌های کلیدی نسخه `miliconfig v3.1`

1. **معماری ماژولار چندفایلی (Multi-File Modular Architecture)**:
   - دیگر یک اسکریپت تک‌فایلی شلوغ نیست؛ کدها در دایرکتری `src/` به تفکیک `config/`، `db/`، `core/`، `subscription/`، `api/` و `ui/` سازماندهی شده‌اند.
   - همزمان فایل‌های باندل و مبهم‌سازی‌شده (`_worker.js`, `dist/_worker.js`, `public/_worker.js`, `少年你相信光吗`) به صورت خودکار تولید می‌شوند تا در هر روش استقراری بلافاصله کار کنند.

2. **دیتابیس Cloudflare D1 بدون هیچ خطایی در استقرار دستی یا اتوماتیک**:
   - **تشخیص خودکار بایندینگ D1**: فرقی نمی‌کند نام متغیر D1 را در کلودفلر `DB`، `D1`، `miliconfig` یا هر نام دیگری بگذارید؛ سیستم به صورت خودکار آن را شناسایی می‌کند.
   - **ساخت خودکار جداول (Auto-Migration)**: نیازی به زدن دستورات SQL یا `wrangler d1 execute` نیست! در اولین درخواست، جداول `users`، `system_config`، `preferred_nodes`، `audit_logs` و `traffic_hourly` به صورت خودکار ساخته می‌شوند.
   - **محافظ ضد خطای D1 و ضد خطای `Error 1101`**: حتی اگر قبل از اتصال D1 پروژه را به صورت دستی یا از گیت‌هاب مستقر کنید، برنامه کرش نمی‌کند و بدون خطای ۱۱۰۱ با حافظه پشتیبان کار می‌کند تا هر زمان که خواستید D1 را متصل نمایید.

3. **مدیریت پیشرفته کاربران + کپی تمام تنظیمات پیش‌فرض کد پایه**:
   - با کلیک روی دکمه **«+ کاربر جدید (پیشرفته)»** یا **«ساخت سریع کاربر»**، علاوه بر **نام کاربر (`username`)** و **تعداد نودها در ساب (`subNodeCount`)**، **تمام ۳۱ تنظیم پیش‌فرض کد پایه (`wk`, `ev`, `et`, `ex`, `ech`, `tp`, `customDNS`, `customECHDomain`, `alpn`, `d`, `p`, `yx`, `yxURL`, `s`, `homepage`, `scu`, `ena`, `epd`, `epi`, `egi`, `ae`, `rm`, `qj`, `dkby`, `yxby`, `ipv4`, `ipv6`, `ispMobile`, `ispUnicom`, `ispTelecom`, `jk`)** برای کاربر وجود دارد و قابل شخصی‌سازی است.

4. **برندینگ `miliconfig` و نام‌گذاری کانفیگ‌ها به فرمت `number+miliconfig`**:
   - تمامی کانفیگ‌های خروجی در همه کلاینت‌ها (v2rayNG, Streisand, Shadowrocket, Amnezia, Exclusive, Clash Meta/Mihomo, Sing-box/Hiddify, Surge, Loon, Quantumult X) دقیقاً با فرمت **`1+miliconfig`**، **`2+miliconfig`**، **`3+miliconfig`** تا **`N+miliconfig`** (بر اساس تعداد نودهای تعیین‌شده در تنظیمات کاربر) نام‌گذاری می‌شوند.

5. **صفحه وضعیت اختصاصی برای ارسال به هر کاربر (`/status/{user_id}`)**:
   - هر کاربر دارای یک لینک اختصاصی **پنجره وضعیت** است که می‌توانید مستقیماً برای مشتری ارسال کنید (شامل حلقه مصرف، وضعیت حجم و انقضا، جستجو در نودها، انتخاب محدوده نودها، سابلینک لوکیشن‌محور ۱۱ کشور، سابلینک اختصاصی ۱۶ کلاینت در ۵ خانواده، لینک دانلود کلاینت‌ها و کپی تکی کانفیگ‌ها).

6. **رابط کاربری بازطراحی‌شده با پس‌زمینه زنده (UI/UX + Animated Background FX)**:
   - هر سه صفحه (درگاه ورود، پنل مدیریت، صفحه وضعیت کاربر) یک لایه جلوه‌های مشترک دارند: پس‌زمینه Aurora متحرک، **بوم ذرات (Canvas) با واکنش به اشاره‌گر**، گرید متحرک، اسکن‌لاین، وینیت و نور دنبال‌کننده نشانگر.
   - انیمیشن‌های روان: ورود پله‌ای کارت‌ها (IntersectionObserver)، شمارنده‌های عددی (Count-up)، حلقه مصرف با `conic-gradient` متحرک، ریپل روی دکمه‌ها، درخشش کارت‌ها، نوار پیشرفت اسکرول، آکاردئون با `max-height` متحرک و توست‌های نرم.
   - احترام کامل به `prefers-reduced-motion` (کاهش حرکت) و سبک‌سازی خودکار جلوه‌ها روی موبایل.

7. **مبهم‌سازی پیشرفته + تزریق کد مرده (Advanced Obfuscation + Dead Code Injection)**:
   - جدول رشته‌های رمزنگاری‌شده XOR/Base64، تغییر نام شناسه‌ها، تبدیل اعداد به عبارت و فشرده‌سازی در چند پاس.
   - **تزریق کد مرده با محمول مبهم (Opaque Predicate)**: بلوک‌هایی که هرگز اجرا نمی‌شوند ولی تحلیل ایستا و مهندسی معکوس را سخت می‌کنند؛ تعداد بلوک‌ها و نام موتور در `dist/build-info.json` گزارش می‌شود.

8. **استقرار روی هر دو بستر کلودفلر بدون هیچ سکرت (Zero-Secret Deploy)**:
   - یک خروجی، دو بستر: `dist/` حالت **Pages Advanced Mode** (فایل `_worker.js`) و همان باندل یک **Worker** استاندارد (`export default { fetch }`) است.
   - هیچ توکن/سکرتی داخل کد یا کانفیگ لازم نیست؛ با اتصال Git پنل کلودفلر، آپلود دستی یا `wrangler login` مستقر می‌شود (جزئیات پایین‌تر).

---

## نودهای اطلاعاتی، مصرف واقعی، قفل دستگاه و راه‌اندازی خودکار (v3.3)

### ۱) سه نود اطلاعاتی هاردکد در **همه** ساب‌ها
- هر ساب‌لینک (فارسی/انگلیسی، base64، Clash، Sing-box، Surge، Loon، QuanX) با سه نود اطلاعاتی شروع می‌شود:
  - `🎁 میلی رایگان است`
  - `⚠️ این کانفیگ را نفروشید — حرام است`
  - `📣 کانال پشتیبانی @miliconfig`
- این سه نود از میزبان و تنظیمات نود واقعی کپی می‌شوند (اتصالشان هم کار می‌کند) و از سقف `subNodeCount` کاربر کم نمی‌شوند.

### ۲) مصرف واقعی از **اولین اتصال**
- آپلود و دانلود جداگانه در هر سشن پروکسی شمرده می‌شوند (VLESS / Trojan / Shadowsocks) و در D1 ذخیره می‌شوند؛ ثبت مصرف دقیقاً با اولین بایت عبوری آغاز می‌شود.
- اگر کاربر با «شروع از اولین اتصال» ساخته شده باشد، تاریخ انقضا هم از همان لحظه محاسبه می‌شود.
- هدر استاندارد `Subscription-Userinfo: upload=…; download=…; total=…; expire=…` در همه ساب‌ها واقعی است، پس مصرف در v2rayNG/Hiddify/Streisand هم نمایش داده می‌شود.
- پنل مدیریت همان اعداد تفکیکی را برای هر کاربر نشان می‌دهد (بخش «مصرف واقعی»).

### ۳) قفل سخت‌افزاری (ipLimit) واقعاً عمل می‌کند
- آی‌پی هر دستگاه در جدول `user_ips` با TTL ذخیره می‌شود؛ دستگاه جدید تا سقف تعیین‌شده مدیر (مثلاً ۳ دستگاه) پذیرفته می‌شود و بعد از آن اتصال با باگ `device-limit` (کد ۱۰۰۸) رد می‌شود.
- فهرست دستگاه‌های فعال هر کاربر و دکمه «آزادسازی دستگاه‌ها» در پنل موجود است.

### ۴) کلید ادمین یکتا برای هر استقرار
- اگر متغیر محیطی `u` را در Cloudflare تعیین کنید، همان مسیر پنل می‌شود.
- اگر تعیین نکنید، برنامه یک کلید یکتا (`mili-…`) می‌سازد و در `system_config` دیتابیس D1 ذخیره می‌کند تا بعد از هر ری‌استارت/ایزوله همان بماند؛ کلید یک‌بار در لاگ Worker چاپ می‌شود.
- مسیر پنل، همان `/<u>` است (مثلاً `/mili-9f2c…`).

### ۵) عیب‌یابی استقرار Pages (خطای 522 و پروژه مسدود)
```bash
npm run cf:status          # وضعیت پروژه‌ها، آخرین استقرار، متغیرها و بایند D1
npm run cf:bind            # ست‌کردن env vars و اتصال D1 (idempotent)
npm run deploy:pages       # بیلد + آپلود روی Cloudflare Pages
```
- **خطای 522 (`Host Error`)** یعنی دامنه `*.pages.dev` هیچ استقراری ندارد یا استقرار خراب است؛ نه مشکل کد. با یک استقرار موفق رفع می‌شود.
- **خطای `8000119 Pages project blocked`** یک مسدودسازی سمت Cloudflare است (معمولاً برای پروژه‌های پروکسی) و با کد قابل رفع نیست؛ باید به `abusereply@cloudflare.com` ایمیل زد. تا رفع آن هیچ استقرار جدیدی اعمال نمی‌شود.
- فایل `_routes.json` در بیلد ساخته می‌شود تا همه مسیرها از Worker عبور کنند و فایل‌های خامی مثل `worker.readable.js` روی دامنه قابل دانلود نباشند.

### ۶) ساخت خودکار همه متغیرهای Cloudflare
```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npm run cf:setup
```
اسکریپت `scripts/cloudflare-setup.js` این کارها را انجام می‌دهد: ساخت D1 (اگر نباشد)، ساخت/به‌روزرسانی پروژه Pages، ست‌کردن `u` و `BRAND`، اتصال بایند `DB` و چاپ مسیر پنل ادمین. اگر `ADMIN_KEY` بدهید همان استفاده می‌شود، وگرنه یک کلید یکتا ساخته می‌شود. **توکن را هرگز داخل فایل یا گیت نگذارید.**

### ۷) موبایل با حس iOS و منوی کشویی راست
- منوی موبایل به شکل یک drawer شیشه‌ای (blur + گوشه‌های گرد + Safe-Area) از لبه راست سُر می‌خورد، با پرده محو پشت آن و بستن با لمس بیرون/`Esc`.
- دکمه گرد **✨** در گوشه صفحه، جلوه‌های بصری (پس‌زمینه زنده، انیمیشن‌ها) را روشن/خاموش می‌کند و انتخاب کاربر در حافظه مرورگر می‌ماند (🌙 = خاموش).

---

## آی‌پی‌های واقعی، مولتی‌لوکیشن، IPv6 و اسکنر داخلی (v3.2)

### ۱) هیچ نودی با دامنه ساخته نمی‌شود
- تمام آدرس نودها از `src/config/locations.js` می‌آیند و **فقط آی‌پی ثابت** هستند.
- استخر لبه: ۱۶ آی‌پی IPv4 که با اتصال واقعی TLS + SNI پاسخ ۲۰۰ داده‌اند (آی‌پی‌های مردهٔ رنج‌های `172.71` و `162.158` حذف شدند) + ۱۲ آی‌پی IPv6 مشتق از نگاشت واقعی دوپشته کلودفلر (`104.16.133.229 ↔ 2606:4700::6810:85e5`).
- فهرست دامنه‌های قدیمی (`DIRECT_DOMAINS`) فقط با فعال‌کردن دستی `epd` قابل استفاده است و به‌صورت پیش‌فرض خاموش است.

### ۲) مولتی‌لوکیشن واقعی با خروجی ثابت (`p` + `pm`)
- ۱۶ لوکیشن با **آی‌پی خروجی ثابت و تأییدشده**:

| لوکیشن | colo | آی‌پی خروجی |
|---|---|---|
| 🇩🇪 آلمان (فرانکفورت) | FRA | `185.221.237.96` |
| 🇳🇱 هلند (آمستردام) | AMS | `147.90.229.230` |
| 🇬🇧 بریتانیا (لندن) | LHR | `51.6.54.142` |
| 🇫🇷 فرانسه | FRA | `88.218.77.37` |
| 🇨🇭 سوئیس (زوریخ) | ZRH | `87.120.222.168` |
| 🇸🇪 سوئد (استکهلم) | ARN | `185.153.180.235` |
| 🇫🇮 فنلاند | HEL | `91.211.114.208` |
| 🇵🇱 لهستان (ورشو) | WAW | `191.44.81.93` |
| 🇺🇸 آمریکا (نیویورک) | EWR | `46.17.107.199` |
| 🇨🇦 کانادا (مونترال) | YUL | `45.133.17.27` |
| 🇸🇬 سنگاپور | SIN | `188.239.9.91` |
| 🇯🇵 ژاپن (اوساکا) | KIX | `64.176.62.94` |
| 🇰🇷 کره جنوبی (سئول) | ICN | `131.186.26.94` |
| 🇭🇰 هنگ‌کنگ | HKG | `156.239.245.134` |
| 🇮🇳 هند (بمبئی) | BOM | `216.10.243.159` |
| 🇦🇺 استرالیا (سیدنی) | SYD | `125.7.24.251` |

- هر نود لوکیشن، مسیر WebSocket را به شکل `/?ed=2048&p=<egress-ip>:443&pm=1` می‌سازد؛ `runtime` در حالت `pm` ترافیک TLS پورت ۴۴۳ را از همان آی‌پی ثابت خارج می‌کند.
- **محدودیت مهم و تست‌شده:** مسیر ProxyIP فقط مقاصدی را رد می‌کند که خودشان روی کلودفلر میزبانی شده‌اند (تست واقعی: `discord.com` از خروجی DE پاسخ ۲۰۰ داد). برای مقاصد خارج از کلودفلر مثل `google.com` یا `gemini.google.com` لبهٔ کلودفلر با ۴۰۳ پاسخ می‌دهد؛ برای این موارد باید پروکسی خروجی `s` تنظیم شود.
- کنترل با دو کلید `locs` (مثلاً `all` یا `DE,NL,GB`) و `pm` (`""`, `yes`, `only`) در تنظیمات پنل؛ مقدار `only` در صورت خطا به مسیر مستقیم برنمی‌گردد.
- نام نودها همچنان با قرارداد `number+miliconfig` است و کد لوکیشن به آن اضافه می‌شود: `1+miliconfig DE-FRA`.

### ۳) IPv6 و پشتیبانی از همراه اول ایران
- ۱۲ نود IPv6 با آدرس `[2606:4700:…]:443` و نام `N+miliconfig V6` برای شبکه‌هایی که IPv6 دارند (همراه اول/ایرانسل).
- پریست آماده **«همراه اول ایران — IPv6 ثابت»** در بخش ساخت سریع کاربر: `ipv4=no`، `ipv6=yes`، `locs=no`، بدون وابستگی به خروجی IPv4.
- کلیدهای `ipv4`/`ipv6` در پنل تعیین می‌کنند کدام خانواده آدرس در ساب‌لینک باشد.

### ۴) اسکنر داخلی (معادل cfnew) — داخل مخزن
- موتور: `src/core/scanner.js` با سه مرحله واقعی:
  1. ساخت کاندید از رنج‌های رسمی کلودفلر (`CF_IPV4_RANGES` / `CF_IPV6_RANGES`).
  2. **اتصال TCP + ارسال ClientHello واقعی TLS با SNI** و انتظار `ServerHello` (آی‌پی‌هایی که فقط پورت باز دارند رد می‌شوند).
  3. تبدیل دامنه‌ها به آی‌پی ثابت با DNS-over-HTTPS.
- API مدیریتی: `GET/POST /{uuid}/api/scanner` (فقط با مسیر مدیر).
- پنل: تب **«نودها و تست تاخیر»** → «اسکن واقعی آی‌پی‌ها» / «اسکن + ذخیره سالم‌ها» / «تبدیل دامنه‌ها به آی‌پی ثابت».
- خط فرمان (روی سیستم شما یا GitHub Actions):

```bash
npm run scan -- --count 24 --port 443
npm run scan -- --v6 --count 12
npm run scan -- --resolve ProxyIP.DE.CMLiussss.net,ProxyIP.NL.CMLiussss.net
```

به‌روزرسانی استخر پروکسی کشوری (بعد از هر تغییر در کد):

```bash
npm run proxy:pipeline   # fetch + سلامت‌سنجی + pool:embed
npm run pool:embed       # فقط ساخت src/config/proxyPoolData.js از data/by-country/pool.json
```

> مهم: ماژول باندلر لیست ثابتی از فایل‌ها دارد (`MODULE_ORDER` در `scripts/build.js`).
> اگر ماژول جدیدی اضافه کردید، آن را به این لیست اضافه کنید؛ بیلد خودش بررسی می‌کند
> و در صورت جا ماندن، با خطای صریح متوقف می‌شود (به‌جای حذف بی‌صدای کد از باندل).

- تست واقعی انجام‌شده روی همین مخزن (CLI): از ۲۴ کاندید، ۱۷ آی‌پی پاسخ TLS معتبر دادند و ۷ آی‌پی مرده حذف شدند (نمونه: `188.114.97.10` با ۱۴ms سالم و `172.70.193.158` ناموفق).
- محدودیت vantage: وقتی اسکن از داخل خود Worker اجرا می‌شود، کلودفلر اتصال به بعضی آی‌پی‌های لبهٔ خودش (مثل `104.16.x` و `188.114.96.x`) را فوراً قطع می‌کند (`Stream was cancelled`)؛ این خطا یعنی «از این vantage قابل سنجش نیست»، نه «نود مرده». برای اعتبارسنجی دقیق از `npm run scan` استفاده کنید.

### ۵) Shadowsocks با چند رمزنگاری (AEAD)
- سه روش رمزنگاری واقعی: `chacha20-ietf-poly1305` (پیاده‌سازی کامل RFC 8439)، `aes-256-gcm` و `aes-128-gcm` (WebCrypto)؛ مقدار `ssc` می‌تواند یک روش، لیست کاما‌دار یا `all` باشد.
- سرور در `src/core/shadowsocks.js`: کلید `EVP_BytesToKey` (MD5)، زیرکلید `HKDF-SHA1` با info=`ss-subkey`، nonce شمارنده ۱۲ بایتی و فریم‌بندی chunk استاندارد Shadowsocks AEAD 2017.
- تشخیص خودکار پروتکل: اگر اولین فریم WebSocket با AEAD هیچ کاربری باز نشود، VLESS/Trojan امتحان می‌شود؛ با فعال بودن `ss` فریم شادوساکس روی همان WebSocket پذیرفته می‌شود.
- رمز پیش‌فرض هر کاربر = UUID او؛ با کلید `ssp` قابل تغییر است. فعال‌سازی: پنل → شبکه → «فعال‌سازی Shadowsocks» + انتخاب روش رمزنگاری.
- لینک خروجی با فرمت SIP002:

```
ss://base64url(method:password)@<edge-ip>:443?plugin=v2ray-plugin%3Btls%3Bhost%3D<worker-host>%3Bpath%3D%2F%3Fed%3D2048#1+miliconfig
```

- نودهای `ss` در Clash/Mihomo (با `plugin: v2ray-plugin`) و Sing-box (`type: shadowsocks`) هم ساخته می‌شوند.
- پیش‌نیاز کلاینت: پلاگین `v2ray-plugin` (v2rayN، Shadowrocket، NekoBox).
- تست‌های خودکار: بردار رسمی RFC 8439، رفت‌وبرگشت سه رمزنگاری با فریم‌های تکه‌تکه، احراز هویت درست/غلط، آدرس IPv4/IPv6 و خروجی Clash/Sing-box.

### ۶) پریست تحریم‌شکن
- پریست **«تحریم‌شکن — خروجی ثابت + پروکسی s»** با `pm=yes`، `qj=only` و لوکیشن‌های `DE,NL,FR,CH,GB,SE,US,CA`.
- برای سرویس‌های میزبانی‌شده روی کلودفلر (Discord، Medium، ...) خروجی ثابت لوکیشن مستقیماً کار می‌کند.
- برای **Gemini / OpenAI / Spotify** که خارج از کلودفلر هستند، فیلد `s` (پروکسی خروجی SOCKS5/HTTP مانند WARP) را در تنظیمات شبکه پر کنید؛ `qj=only` باعث می‌شود همهٔ ترافیک از همان مسیر برود و در صورت خطا به مسیر مستقیم برنمی‌گردد.

### ۷) استخر پروکسی سالم تفکیک‌شده بر اساس کشور (s) + مولتی‌لوکیشن رندوم
- منبع داده: `data/by-country/pool.json` که با پایپ‌لاین `npm run proxy:pipeline` (fetch + سلامت‌سنجی + `npm run pool:embed`) ساخته می‌شود؛ ماژول باندل‌شده: `src/config/proxyPoolData.js` (۷۱۳۳ پروکسی سالم در ۷۳ کشور).
- ماژول‌ها: `src/config/countries.js` (نام فارسی + پرچم خودکار از کد ISO)، `src/config/proxyPool.js` (آمار، لیست هر کشور، انتخاب یک‌کشوری/چندکشوری) و `src/core/proxyProbe.js` (سنجش واقعی تونل).
- پنل → شبکه → بخش «۲.۵ استخر پروکسی تفکیک‌شده کشور»:
  1. **لیست کشویی جذاب کشورها** (پرچم + نام + تعداد پروکسی).
  2. **پینگ واقعی همان‌جا**: هر پروکسی با `✓` و تاخیر میلی‌ثانیه یا `✕` و دلیل خطا نشان داده می‌شود (SOCKS5: greeting + CONNECT، HTTP/HTTPS: CONNECT و انتظار 2xx) — پس فقط پورت باز بودن سنجیده نمی‌شود و پروکسی مستقیم واقعاً کار می‌کند.
  3. **انتخاب** یک پروکسی و نوشتن خودکار آن در فیلد `s` (پروکسی خروجی).
  4. **🎲 ساخت خودکار مولتی‌لوکیشن رندوم**: `cpx=yes`، `pcc=<کشورهای انتخابی>`، `cpn=<تعداد>` را ست و تنظیمات را ذخیره می‌کند.
- نودهای مولتی‌لوکیشن کشوری: هر نود آدرس لبه CF را با پروکسی خروجی همان کشور در مسیر ساب ترکیب می‌کند (`/?ed=2048&s=socks5://ip:port`) و نام نود کد کشور را می‌گیرد: `1+miliconfig DE`، `2+miliconfig US` ...
- کلیدهای تنظیمات: `cpx` (روشن/خاموش)، `pcc` (`all` یا لیست مثل `DE,US,NL`) و `cpn` (تعداد نود، ۱ تا ۲۰۰). انتخاب پروکسی‌ها در طول یک روز پایدار و روزانه چرخشی است.
- API مدیریتی: `GET /{uuid}/api/proxy-pool` (آمار و کشورها)، `GET /{uuid}/api/proxy-pool?country=DE&limit=40`، `POST {"action":"ping"|"random"}` (فقط با مسیر مدیر).
- این مسیر برای مقاصدی که روی کلودفلر نیستند (Gemini/OpenAI/Spotify) کار می‌کند؛ برای اجبار به خروج از پروکسی، `qj` را روی `only` بگذارید.

> یادآوری: آی‌پی‌های لبه (anycast) برای هر کاربر بر اساس موقعیت شبکهٔ او انتخاب می‌شوند؛ «لوکیشن» نود از خروجی ثابت (`p`) می‌آید. اگر روی شبکهٔ خودتان IPv6 ندارید، نودهای `V6` کار نمی‌کنند؛ برای همراه اول از پریست IPv6 استفاده کنید.

---

## کانال پشتیبانی

- **کانال رسمی پشتیبانی: [@miliconfig](https://t.me/miliconfig)**
- همین لینک در پنل مدیریت، صفحه وضعیت کاربر و درگاه ورود نمایش داده می‌شود.
- برای تغییر آن، فقط این دو ثابت را در `src/config/defaults.js` ویرایش کنید: `SUPPORT_CHANNEL_HANDLE` و `SUPPORT_CHANNEL_URL`.

---

## راهنمای استقرار بدون سکرت (Cloudflare Pages + Cloudflare Workers)

> خروجی این پروژه به گونه‌ای ساخته می‌شود که **هیچ سکرت، توکن یا متغیر محیطی اجباری نداشته باشد**. D1 اختیاری است و در صورت نبود آن، برنامه با حافظه پشتیبان و بدون خطای ۱۱۰۱ کار می‌کند.

### روش اول (پیشنهادی): اتصال Git از پنل کلودفلر — کاملاً بدون سکرت

**الف) روی Cloudflare Pages**
1. وارد پنل Cloudflare شوید: **Workers & Pages → Create → Pages → Connect to Git**.
2. مخزن گیت‌هاب خود را انتخاب کنید و این تنظیمات را بگذارید:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. بیلد کلودفلر خودش `npm install` می‌کند و پوشه `dist` (که شامل `_worker.js` است) در حالت **Advanced Mode** اجرا می‌شود؛ بدون هیچ سکرتی.
4. برای دیتابیس (اختیاری): **Settings → Functions → D1 database bindings** و بایندینگ را `DB` نام‌گذاری کنید (جداول خودکار ساخته می‌شوند).

**ب) روی Cloudflare Workers**
1. **Workers & Pages → Create → Workers → Import a repository** و انتخاب همین مخزن.
2. تنظیمات پیشنهادی: **Build command**: `npm run build` — **Deploy command**: `npx wrangler deploy`.
3. فایل `wrangler.toml` از قبل آماده است (`main = "src/index.js"`)؛ کلودفلر در محیط بیلد خودش احراز هویت را انجام می‌دهد و نیازی به توکن در مخزن نیست.
4. اگر می‌خواهید نسخه **مبهم‌سازی‌شده** روی Worker برود، از دستور `wrangler deploy _worker.js --no-bundle` استفاده کنید (اسکریپت `npm run deploy:worker:bundle` همین کار را می‌کند).

### روش دوم: آپلود دستی — بدون سکرت

- **Pages**: در پنل، Pages Project → **Create deployment → Direct Upload** و پوشه‌ای که شامل `_worker.js` است را آپلود کنید (`dist/`). یا از فایل `Pages.zip` که ورک‌فلوی گیت‌هاب می‌سازد استفاده کنید.
- **Worker**: در پنل Worker → **Edit code (Quick Edit)** و محتوای `_worker.js` را جای‌گذاری و Deploy کنید.

### روش سوم: CLI روی سیستم خودتان — بدون سکرت مخزن

```bash
npm install
npm run build          # بیلد + مبهم‌سازی + تزریق کد مرده
npm test               # اعتبارسنجی خروجی

npx wrangler login     # ورود تعاملی (OAuth)؛ نیازی به API Token نیست
npm run deploy:worker          # انتشار Worker از سورس (wrangler.toml)
npm run deploy:worker:bundle   # انتشار Worker از باندل مبهم‌سازی‌شده
npm run deploy:pages           # انتشار روی Cloudflare Pages (پوشه dist)
```

### مایگریشن مرحله‌به‌مرحله D1 (پیشنهادی قبل از دپلوی)

ابتدا یک دیتابیس D1 خالی بسازید، سپس اسکریپت مایگریشن را اجرا کنید؛ این اسکریپت
فایل‌های `migrations/*.sql` را می‌خواند و هر دستور را **یکی‌یکی** اجرا و تأیید می‌کند
و در اولین دستور خطادار متوقف می‌شود (به‌جای دیدن خطای مبهم `1101` داخل Worker):

```bash
npx wrangler d1 create miliconfig-db-v2        # دیتابیس خالی
CLOUDFLARE_API_TOKEN=... npm run db:migrate -- --database miliconfig-db-v2
```

نام و UUID دیتابیس را در `wrangler.toml` (بخش `[[d1_databases]]`) و در بایندینگ
`DB` پروژه Pages قرار دهید. کاربر اولیه سیستم در اولین درخواست به‌صورت خودکار ساخته می‌شود.

---

## دپلوی خودکار از گیت‌هاب (GitHub Actions) — اختیاری و بدون شکست قرمز

فایل `.github/workflows/deploy-cloudflare.yml` دو جاب دارد:

| جاب | شرط اجرا | کارها |
|---|---|---|
| `build` | همیشه (هر پوش روی `main`) | نصب ابزارها، `npm run build`، `npm test`، ساخت `Pages.zip` و `_worker.js` و آپلود آن‌ها به‌عنوان Artifact |
| `deploy` | فقط اگر Secretها تنظیم شده باشند | تشخیص خودکار پروژه Pages، `wrangler pages deploy dist --branch main`، بررسی لینک پشتیبانی روی نسخه منتشرشده و (اختیاری) دپلوی Worker |

نکته مهم: اگر Secretها تنظیم نشده باشند، جاب `deploy` با یک پیام راهنما **رد (skip)** می‌شود و ورک‌فلو سبز می‌ماند؛ یعنی کنار اتصال Git پنل کلودفلر، هیچ سکرتی در مخزن لازم نیست.

### فعال‌سازی دپلوی از گیت‌هاب (اختیاری)

در مخزن به **Settings → Secrets and variables → Actions** بروید:

| نوع | نام | مقدار |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | توکن API کلودفلر با دسترسی **Cloudflare Pages/Workers: Edit** (ساخت از `dash.cloudflare.com/profile/api-tokens`) |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | شناسه حساب کلودفلر (کنار نام حساب در داشبورد) |
| Variable (اختیاری) | `CF_PAGES_PROJECT` | اگر چند پروژه Pages دارید و می‌خواهید هدف دستی تعیین شود (پیش‌فرض: تشخیص خودکار از حساب) |

برای اجرای دستی یا تعیین نام پروژه، از **Actions → Deploy to Cloudflare → Run workflow** استفاده کنید (ورودی `project_name` و در صورت نیاز `deploy_worker=yes` برای دپلوی هم‌زمان Worker).

---

## بیلد، تست و گزارش (`dist/build-info.json`)

```bash
npm run verify   # build + test در یک دستور
```

بعد از هر بیلد، فایل `dist/build-info.json` ساخته می‌شود و شامل این موارد است: بسترهای هدف (`cloudflare-pages-advanced-mode`, `cloudflare-worker`)، `requiresSecrets: false`، پوشه خروجی Pages، نام موتور مبهم‌سازی، تعداد بلوک‌های **کد مرده تزریق‌شده**، شمارش نشانگر کد مرده در باندل خوانا و `sha256` تمام خروجی‌های استقرار.

مجموعه تست (`npm test`) شامل ۲۲ بررسی واقعی است: استقرار بدون D1، ساخت خودکار جداول، ساخت کاربر با تمام تنظیمات، نام‌گذاری `number+miliconfig`، مبدل‌های Clash/Sing-box، صفحه وضعیت کاربر، حضور پس‌زمینه زنده و انیمیشن‌ها در هر سه صفحه، **اعتبار نحوی تمام اسکریپت‌های درون‌صفحه‌ای**، **امن‌سازی نام کاربری (ضد XSS)**، تزریق کد مرده و یکسان‌بودن خروجی Pages/Worker بدون سکرت.

---

## ساختار ماژولار پروژه

```text
miliconfig/
├── src/
│   ├── index.js                  # روتر اصلی Cloudflare Worker & Pages + محافظ ضد Error 1101
│   ├── config/
│   │   ├── defaults.js           # تمام ۳۱ تنظیم پیش‌فرض کد اصلی CFnew v3.1 + ثابت‌های miliconfig
│   │   ├── presets.js            # ۵ پریست ساخت سریع کاربر (ایران پرسرعت، مصرف سنگین، بین‌المللی و...)
│   │   ├── countries.js          # نام فارسی + پرچم خودکار کشورها برای لیست کشویی استخر پروکسی
│   │   ├── proxyPool.js          # آمار/انتخاب پروکسی سالم تفکیک‌شده بر اساس کشور
│   │   └── proxyPoolData.js      # استخر باندل‌شده ۷۱۳۳ پروکسی سالم در ۷۳ کشور (خروجی pool:embed)
│   ├── db/
│   │   └── d1.js                 # لایه دیتابیس Cloudflare D1 با Auto-Migration و تشخیص هوشمند بایندینگ
│   ├── core/
│   │   ├── runtime.js            # هسته پروکسی VLESS + Trojan + xhttp + SOCKS5/HTTP + احراز هویت چندکاربره D1
│   │   ├── proxyProbe.js         # پینگ واقعی پروکسی خروجی (SOCKS5 greeting + CONNECT / HTTP CONNECT)
│   │   ├── shadowsocks.js        # موتور Shadowsocks AEAD (سه رمزنگاری)
│   │   └── utils.js              # نام‌گذار نودها (number+miliconfig)، رمزنگاری MD5/SHA224 و امن‌سازی خروجی (escapeHtml)
│   ├── subscription/
│   │   ├── generator.js          # تولیدکننده ساب‌لینک چندکاربره با اعمال subNodeCount
│   │   └── converters.js         # مبدل‌های داخلی Clash YAML، Sing-box JSON، Surge، Loon، QuanX و زنجیره خانگی
│   ├── api/
│   │   └── handlers.js           # اندپوینت‌های REST API مدیریت کاربران، تنظیمات و نودها
│   └── ui/
│       ├── icons.js              # لوگوهای نئونی سپر و ابر miliconfig
│       ├── baseCss.js            # لایه پایه استایل مشترک (موبایل + ویندوز)
│       ├── fx.js                 # پس‌زمینه زنده + انیمیشن‌های روان مشترک هر سه صفحه
│       ├── loginHtml.js          # درگاه ورود/لندینگ
│       ├── adminHtml.js          # پنل مدیریت کامل
│       └── statusHtml.js         # صفحه وضعیت اختصاصی کاربر برای ارسال به مشتری
├── scripts/
│   ├── build.js                  # باندلر ماژولار + سازگاری خودکار Workers/Pages + مانیفست بیلد
│   ├── obfuscate.js              # مبهم‌ساز ایمن کلودفلر + تزریق کد مرده (بدون خطای 1101)
│   └── test-worker.js            # تست خودکار کامل (۱۱ بررسی)
├── migrations/
│   └── 0001_init_miliconfig.sql  # فایل مایگریشن استاندارد D1
├── schema.sql                    # اسکیمای SQL دیتابیس D1
├── wrangler.toml                 # تنظیمات استقرار مستقیم Cloudflare (Worker)
└── package.json
```

---

## English Overview

**miliconfig v3.1** is a modular, multi-user Cloudflare Workers & Pages proxy control center powered by **Cloudflare D1** and built on top of the complete **CFnew v3.1** engine (VLESS, Trojan, xhttp, ECH, SOCKS5/HTTP outbound proxy, Residential Chain, and built-in Clash/Sing-box/Surge/QuanX/Loon converters).
- **Brand & Node Naming**: All client subscription nodes are named `1+miliconfig`, `2+miliconfig`, ..., `N+miliconfig`.
- **Per-User Node Count & Full Defaults**: Every user created via D1 inherits all 31 default settings of the base engine plus custom `username` and `subNodeCount`.
- **Zero-Error D1 & 1101 Protection**: Automatic D1 binding detection, runtime table auto-migration, and Worker-safe AST obfuscation.
- **Animated UI/UX**: All three pages share a live particle-canvas background (aurora, grid, scanline, pointer spotlight) plus smooth reveal, count-up, ripple, animated accordion and toast animations, honoring `prefers-reduced-motion`.
- **Dead Code Injection**: The obfuscation pipeline injects deterministic opaque-predicate dead code blocks in addition to string-array encoding, renaming and minification; counts are reported in `dist/build-info.json`.
- **Zero-Secret Dual Deploy**: One bundle serves both cloudflare Pages (Advanced Mode `_worker.js`) and Workers (`export default { fetch }`); deployment needs no secrets, tokens or required environment variables.
