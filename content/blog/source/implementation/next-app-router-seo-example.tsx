/**
 * نمونه معماری Next.js App Router؛ کد آماده ادغام است، نه پچ خودکار روی پروژه.
 * فرض: محتوا در /blog/[slug] رندر می‌شود و محتوا از یک CMS/MDX loader معتبر می‌آید.
 * استفاده از دامنه واقعی و زمان انتشار واقعی برای canonical/schema الزامی است.
 */
import type { Metadata } from "next";

export type BlogSeoInput = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  imagePath: string;
  imageAlt: string;
  publishedAt?: string; // واقعاً در زمان انتشار ثبت شود؛ ISO 8601
  modifiedAt?: string; // فقط پس از تغییر محتوایی واقعی
  author?: { name: string; url?: string }; // تنها نام/هویت واقعی و تأییدشده
};

const SITE_NAME = "شب قهرمانان";

function siteOrigin(): URL {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url || !/^https:\/\//.test(url)) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to the actual https origin before publishing.");
  }
  return new URL(url);
}

export function buildArticleMetadata(post: BlogSeoInput): Metadata {
  const origin = siteOrigin();
  const path = `/blog/${post.slug}`;
  const fullUrl = new URL(path, origin).toString();
  const imageUrl = new URL(post.imagePath, origin).toString();
  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: fullUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: fullUrl,
      siteName: SITE_NAME,
      locale: "fa_IR",
      title: post.seoTitle,
      description: post.description,
      images: [{ url: imageUrl, alt: post.imageAlt, width: 1200, height: 630 }],
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.modifiedAt ? { modifiedTime: post.modifiedAt } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.description,
      images: [imageUrl],
    },
  };
}

export function buildBlogJsonLd(post: BlogSeoInput) {
  const origin = siteOrigin();
  const articleUrl = new URL(`/blog/${post.slug}`, origin).toString();
  const imageUrl = new URL(post.imagePath, origin).toString();
  // تا قبل از ثبت تاریخ واقعی انتشار، این تابع را در صفحه عمومی صدا نزنید.
  if (!post.publishedAt) throw new Error("Set an actual publishedAt date when article becomes public.");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        inLanguage: "fa-IR",
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        image: imageUrl,
        datePublished: post.publishedAt,
        ...(post.modifiedAt ? { dateModified: post.modifiedAt } : {}),
        author: post.author
          ? { "@type": "Person", name: post.author.name, ...(post.author.url ? { url: post.author.url } : {}) }
          : { "@type": "Organization", name: SITE_NAME, url: origin.toString() },
        publisher: { "@type": "Organization", name: SITE_NAME, url: origin.toString() },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: origin.toString() },
          { "@type": "ListItem", position: 2, name: "مجله ورزشی", item: new URL("/blog", origin).toString() },
          { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
        ],
      },
    ],
  };
}

/** در Server Component، صرفاً پس از اعتبارسنجی داده‌ها:
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{
 *     __html: JSON.stringify(buildBlogJsonLd(post)).replace(/</g, "\\u003c"),
 *   }}
 * />
 * هرگز اطلاعات غیرقابل‌اعتماد کاربر را بدون sanitization در HTML تزریق نکنید.
 */
