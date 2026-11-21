import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, Clock3, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/lib/blog";

export function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumbs({ title }: { title?: string }) {
  return <nav aria-label="مسیر صفحه" className="blog-breadcrumbs"><ol>
    <li><Link href="/">خانه</Link></li>
    <li><ChevronLeft aria-hidden="true" /><Link href="/blog" aria-current={title ? undefined : "page"}>مجله ورزشی</Link></li>
    {title && <li><ChevronLeft aria-hidden="true" /><span aria-current="page">{title}</span></li>}
  </ol></nav>;
}

export function PostCard({ post, eager = false }: { post: BlogPost; eager?: boolean }) {
  return <article className="blog-card brand-card">
    <Link href={post.href} className="blog-card-image" tabIndex={-1} aria-hidden="true">
      <Image src={post.image} alt="" fill sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1200px) 50vw, 568px" className="object-cover" loading={eager ? "eager" : "lazy"} />
      <span className="blog-category">{post.category}</span>
    </Link>
    <div className="blog-card-copy"><p className="blog-reading"><Clock3 aria-hidden="true" /> حدود {post.readingMinutes.toLocaleString("fa-IR")} دقیقه مطالعه</p>
      <h2><Link href={post.href}>{post.title}</Link></h2>
      <p className="blog-excerpt">{post.excerpt}</p>
      <Link className="blog-read-link" href={post.href}>مطالعه مقاله <ArrowLeft aria-hidden="true" /></Link>
    </div>
  </article>;
}

export function BlogCta({ beginner = false, compact = false }: { beginner?: boolean; compact?: boolean }) {
  return <section aria-label="شروع تمرین در باشگاه" className={`blog-cta ${compact ? "blog-cta-compact" : ""}`}>
    <div className="blog-cta-icon"><Dumbbell aria-hidden="true" /></div>
    <div><p className="section-kicker">از مطالعه تا تمرین</p><h2>{beginner ? "اولین قدم را با راهنمایی مربی بردارید" : "مسیر تمرین خود را شروع کنید"}</h2>
      <p>{beginner ? "مربیان باشگاه و زمان‌های قابل رزرو را ببینید؛ یا پلن عضویت مناسب خود را انتخاب کنید." : "پلن‌های عضویت را ببینید و برای آشنایی با گزینه‌های تمرین، مربیان باشگاه را بررسی کنید."}</p>
    </div>
    <div className="blog-cta-actions"><Button asChild><Link href="/#plans-section">شروع مسیر من <ArrowLeft aria-hidden="true" className="size-4" /></Link></Button><Link className="blog-coach-link" href="/#trainers-section">مشاهده مربیان و رزرو</Link></div>
  </section>;
}
