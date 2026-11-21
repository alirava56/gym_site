import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArticleNotFound() {
  return <main id="blog-content" className="site-container section-shell text-center"><p className="section-kicker">مجله ورزشی</p><h1 className="section-title mt-3">این مقاله پیدا نشد</h1><p className="my-6 text-brand-muted">از فهرست مقاله‌ها، مطلب موردنظر خود را انتخاب کنید.</p><Button asChild><Link href="/blog">بازگشت به مجله ورزشی</Link></Button></main>;
}
