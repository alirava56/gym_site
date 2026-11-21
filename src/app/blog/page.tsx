import type { Metadata } from "next";
import { BlogCta, Breadcrumbs, JsonLd, PostCard } from "@/components/blog/blog-components";
import { breadcrumbSchema, posts } from "@/lib/blog";
import { absoluteUrl, SITE_NAME } from "@/shared/site";

const title = "مجله ورزشی شب قهرمانان | تمرین و تناسب اندام";
const description = "مقاله‌های آموزشی شب قهرمانان درباره شروع بدنسازی، برنامه تمرینی، کاهش چربی و حفظ عضله؛ همراه با جدول تمرین، منابع و راهنمای شروع مسیر.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: { type: "website", title, description, locale: "fa_IR", siteName: SITE_NAME, url: absoluteUrl("/blog"), images: [{ url: absoluteUrl(posts[0].image), width: 1200, height: 630, alt: posts[0].imageAlt }] },
  twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(posts[0].image)] },
};

export default function BlogPage() {
  return <main id="blog-content" className="blog-main site-container" tabIndex={-1}>
    <JsonLd value={{ "@context": "https://schema.org", "@graph": [
      { "@type": "Blog", "@id": `${absoluteUrl("/blog")}#blog`, name: title, description, url: absoluteUrl("/blog"), inLanguage: "fa-IR", blogPost: posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: absoluteUrl(post.href) })) },
      breadcrumbSchema([{ name: "خانه", href: "/" }, { name: "مجله ورزشی", href: "/blog" }]),
    ] }} />
    <Breadcrumbs />
    <header className="blog-intro">
      <h1>مجله ورزشی <span>شب قهرمانان</span></h1><p>از اولین جلسه باشگاه تا ساختن عادت‌های پایدار؛<br className="hidden sm:block" /> راهنماهایی برای شناخت بهتر تمرین و تناسب اندام.</p>
    </header>
    <section aria-label="مقاله‌های آموزشی"><div className="blog-list-heading"><h2>برای قدم بعدی شما</h2><span>۲ راهنمای آموزشی</span></div>
      <div className="blog-grid">{posts.map((post, i) => <PostCard key={post.slug} post={post} eager={i === 0} />)}</div>
    </section>
    <BlogCta />
  </main>;
}
