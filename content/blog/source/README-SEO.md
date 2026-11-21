# بسته انتشار دو مقاله تخصصی SEO — شب قهرمانان / CHAMPIONS NIGHT

## فهرست فایل‌ها

- `articles/01-beginner-workout-plan-3-days.md` — مقاله کامل مبتدیان + جدول حرکات + FAQ + منابع + frontmatter
- `articles/02-fat-loss-without-muscle-loss.md` — مقاله کامل کاهش چربی + برنامه هفتگی + FAQ + منابع + frontmatter
- `seo-brief.json` — دو مجموعه آماده Title/H1/Description/Slug/Keyword/Tags/Alt/CTA و brief تصویری
- `implementation/next-app-router-seo-example.tsx` — نمونه Metadata، Open Graph، Twitter، canonical، BlogPosting و BreadcrumbList برای Next.js App Router
- `PUBLISH-CHECKLIST.md` — کنترل کیفیت پیش از انتشار و روش سنجش نتیجه

## محدودیت‌های واقعی و صادقانه

- برند «شب قهرمانان» از پروژه پیشین گرفته شده است؛ دامنه منتشرشده و وجود واقعی صفحات `/blog` تأیید نشده است.
- مسیرهای `/blog/beginner-workout-plan-3-days` و `/blog/fat-loss-without-muscle-loss` **پیشنهادی** هستند و باید در پروژه ساخته شوند.
- CTAها عمداً به `/` اشاره می‌کنند تا لینک جعلی رزرو نسازیم؛ دکمه واقعی «شروع مسیر من» در صفحه اصلی باید توسط توسعه‌دهنده بررسی شود.
- محتوای علمی توسط منابع منتشرشده پشتیبانی می‌شود، ولی **به‌عنوان مطلب بررسی‌شده توسط مربی/پزشک جا زده نشده است**. پیش از انتشار، فرد واجد صلاحیت باید حرکت‌ها و توضیحات تغذیه را بازبینی کند.
- از ابزار داده جست‌وجوی واقعی (Search Console/Keyword Planner) برای این دامنه استفاده نشده است؛ رتبه، سختی کلمه و حجم جست‌وجو ادعا نشده‌اند.

## راهنمای محتوایی

**مقاله ۱:** نیت جست‌وجو برای کسی است که می‌پرسد «چه برنامه‌ای در باشگاه شروع کنم؟». محتوای اجرایی جدولی + نمونه پیشرفت + CTA مربی دارد.

**مقاله ۲:** نیت جست‌وجو برای کسی است که می‌پرسد «چطور چربی کم کنم و عضله‌ام را از دست ندهم؟». با مقاله ۱ هم‌پوشانی هدف اصلی ندارد؛ به آن لینک می‌دهد.

برای هر مقاله فقط یک H1 رندر شود. عنوان و متا توضیح یکتا هستند. تگ‌ها/عبارت‌های با ویرگول در JSON برای مدیریت محتوای داخلی‌اند؛ **meta keywords در گوگل فاکتور رتبه‌بندی نیست**. از تکرار غیرطبیعی کلیدواژه در متن پرهیز شود.

## کاورها

دو تصویر واقعی، ترجیحاً گرفته‌شده از خود باشگاه با رضایت سوژه، پیشنهاد می‌شود. اندازه کاور صفحه و Open Graph: ۱۲۰۰ × ۶۳۰ پیکسل، خروجی WebP بهینه. نسخه‌های برش مربع و ۴:۳ در صورت داشتن CDN/سیستم تصویر می‌توانند برای Article schema نیز افزوده شوند. Alt همان متن واقعی، توصیفی و مرتبط باشد و لوگو/تیتر طولانی روی تصویر قرار نگیرد. عکس استوک پیدا شده از وب را بدون مجوز منتشر نکنید.

## الزامات فنی

- URL واقعی و ثابت HTTPS؛ redirect نسخه‌های تکراری به canonical و نبود تداخل اسلش انتهایی.
- `/blog` و `/blog/[slug]` واقعاً ساخته و SSR/SSG شوند؛ محتوای متنی باید در HTML اولیه قابل مشاهده باشد (نه فقط بعد از تعامل JS).
- در `sitemap.xml` فقط آدرس‌های واقعی، public و 200 درج شوند؛ metadata و server components نباید noindex/robots block شوند.
- لینک صفحه اصلی -> وبلاگ و مقاله‌ها، مقاله ۱ <-> مقاله ۲، و در صورت تأیید بخش مربیان لینک به آن برقرار شود.
- Schema فقط با اطلاعات منطبق با صفحه و تاریخ/هویت واقعی ایجاد شود. از تگ FAQ rich result برای وبسایت باشگاه انتظار نمایش ویژه نداشته باشید.
- تست در موبایل، فونت فارسی، RTL، خوانایی جدول‌ها با scroll افقی و تصاویر با width/height رزرو شده.

## سنجش نتیجه

در Search Console هر URL را بررسی و بعد از انتشار در ۲۸/۵۶/۹۰ روز داده‌های واقعی **Impressions، Clicks، CTR، Average Position** و کوئری‌های هر مقاله را مقایسه کنید. در Analytics رویداد `blog_cta_click` را با پارامتر `article_slug` و در صورت امکان conversion واقعی رزرو دنبال کنید؛ جایگاه و کلیک به‌تنهایی فروش نیست.

## منابع پایه

- ACSM 2026: https://pubmed.ncbi.nlm.nih.gov/41843416/
- WHO Physical Activity: https://www.who.int/europe/news-room/fact-sheets/item/physical-activity
- Meta-analysis resistance training during caloric restriction 2026: https://pubmed.ncbi.nlm.nih.gov/42144246/
- ISSN 2026: https://pubmed.ncbi.nlm.nih.gov/42867412/
- CDC Weight loss: https://www.cdc.gov/healthy-weight-growth/losing-weight/
- Google People-First Content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
