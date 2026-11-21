import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, List } from "lucide-react";
import { ArticleContent } from "@/components/blog/article-content";
import { BlogCta, Breadcrumbs, JsonLd } from "@/components/blog/blog-components";
import { articleMetadata, articleSchema, getPost, posts } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return posts.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return articleMetadata(post);
}

export default async function ArticlePage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const related = posts.find((item) => item.slug !== post.slug)!;
  const toc = post.blocks.filter((block) => block.type === "heading" && block.level === 2);
  return <main id="blog-content" className="blog-main site-container" tabIndex={-1}>
    <JsonLd value={articleSchema(post)} />
    <Breadcrumbs title={post.title} />
    <article aria-labelledby="article-title">
      <header className="article-header"><p className="section-kicker">مجله ورزشی / {post.category}</p>
        <h1 id="article-title">{post.title}</h1><p className="article-deck">{post.excerpt}</p>
        <div className="article-meta"><span>{post.category}</span><span><Clock3 aria-hidden="true" /> حدود {post.readingMinutes.toLocaleString("fa-IR")} دقیقه مطالعه</span></div>
      </header>
      <figure className="article-cover"><Image src={post.image} alt={post.imageAlt} width={1200} height={630} sizes="(max-width: 1200px) 100vw, 1184px" loading="eager" fetchPriority="high" /><figcaption>نمایی از فضای باشگاه شب قهرمانان</figcaption></figure>
      <div className="article-layout">
        <aside className="article-sidebar"><details className="article-toc" open><summary><List aria-hidden="true" /> در این مقاله می‌خوانید</summary>
          <nav aria-label="فهرست مطالب مقاله"><ol>{toc.map((block) => block.type === "heading" && <li key={block.id}><a href={`#${block.id}`}>{block.text}</a></li>)}</ol></nav>
        </details><div className="article-sidebar-cta"><p className="section-kicker">قدم بعدی شما</p><p>تمرین متناسب با هدف و توان شما شروع می‌شود.</p><Link href="/#trainers-section">مشاهده مربیان و رزرو <ArrowLeft aria-hidden="true" /></Link></div></aside>
        <div className="article-body"><ArticleContent blocks={post.blocks} />
          <BlogCta beginner={post.slug === "beginner-workout-plan-3-days"} compact />
          <nav className="article-related" aria-label="مقاله مرتبط"><p className="section-kicker">بیشتر بخوانید</p><Link href={related.href}>{related.title}<ArrowLeft aria-hidden="true" /></Link><Link className="article-all-posts" href="/blog">بازگشت به همه مقاله‌ها</Link></nav>
        </div>
      </div>
    </article>
  </main>;
}
