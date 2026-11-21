import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { parseArticle } from "@/lib/blog-markdown";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/shared/site";

const sources = [
  { file: "01-beginner-workout-plan-3-days.md", slug: "beginner-workout-plan-3-days", imageAlt: "دستگاه‌های تمرین قدرتی در سالن باشگاه شب قهرمانان" },
  { file: "02-fat-loss-without-muscle-loss.md", slug: "fat-loss-without-muscle-loss", imageAlt: "تردمیل‌ها و دوچرخه‌های ثابت در سالن هوازی باشگاه شب قهرمانان" },
] as const;

export const posts = sources.map((source) => {
  const raw = readFileSync(path.join(process.cwd(), "content/blog/source/articles", source.file), "utf8").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]+?)\n---\n([\s\S]+)$/.exec(raw);
  if (!match) throw new Error(`Missing article frontmatter: ${source.file}`);
  const field = (key: string) => {
    const value = new RegExp(`^${key}: (.+)$`, "m").exec(match[1])?.[1];
    if (!value) throw new Error(`Missing ${key}: ${source.file}`);
    return value.replace(/^"|"$/g, "");
  };
  if (field("slug") !== source.slug) throw new Error(`Article slug mismatch: ${source.file}`);
  return {
    slug: source.slug,
    title: field("title"),
    seoTitle: field("seo_title"),
    description: field("meta_description"),
    excerpt: field("excerpt"),
    category: field("category"),
    readingMinutes: Number(field("reading_time_minutes_estimate")),
    image: `/images/blog/${source.slug}.webp`,
    imageAlt: source.imageAlt,
    href: `/blog/${source.slug}`,
    body: match[2].trim(),
    blocks: parseArticle(match[2]),
  };
});

export type BlogPost = (typeof posts)[number];
export const getPost = (slug: string) => posts.find((post) => post.slug === slug);

export function articleMetadata(post: BlogPost): Metadata {
  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: absoluteUrl(post.href) },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "article", locale: "fa_IR", siteName: SITE_NAME,
      url: absoluteUrl(post.href), title: post.seoTitle, description: post.description,
      images: [{ url: absoluteUrl(post.image), width: 1200, height: 630, alt: post.imageAlt }],
    },
    twitter: { card: "summary_large_image", title: post.seoTitle, description: post.description, images: [{ url: absoluteUrl(post.image), alt: post.imageAlt }] },
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.href) })),
  };
}

export function articleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting", "@id": `${absoluteUrl(post.href)}#article`,
        url: absoluteUrl(post.href), headline: post.title, description: post.description,
        inLanguage: "fa-IR", articleSection: post.category,
        mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.href) },
        image: { "@type": "ImageObject", url: absoluteUrl(post.image), width: 1200, height: 630 },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        // Source files supply no verified author or publication dates. Do not fabricate them.
      },
      breadcrumbSchema([{ name: "خانه", href: "/" }, { name: "مجله ورزشی", href: "/blog" }, { name: post.title, href: post.href }]),
    ],
  };
}
