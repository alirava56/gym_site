import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { posts } from "@/lib/blog";

export function BlogPreviewSection() {
  return <section id="blog-section" aria-labelledby="blog-preview-title" className="section-shell border-y border-brand-line bg-brand-surface/40"><div className="site-container">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">دانش بیشتر، تمرین آگاهانه‌تر</p><h2 id="blog-preview-title" className="section-title mt-2">مجله ورزشی</h2></div><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-gold">همه مقاله‌ها <ArrowLeft aria-hidden="true" className="size-4" /></Link></div>
    <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <article key={post.slug} className="brand-card p-6"><p className="text-xs text-brand-gold">{post.category}</p><h3 className="mt-3 text-lg font-black leading-9"><Link href={post.href} className="hover:text-brand-gold">{post.title}</Link></h3><p className="mt-3 text-sm leading-8 text-brand-muted">{post.excerpt}</p><Link href={post.href} className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-brand-gold">مطالعه مقاله <ArrowLeft aria-hidden="true" className="size-4" /></Link></article>)}</div>
  </div></section>;
}
