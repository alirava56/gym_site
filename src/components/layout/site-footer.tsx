"use client";

import Link from "next/link";

import { useExperience } from "@/components/experience/experience-provider";
import { FooterBrandLogo } from "@/components/shared/brand-logo";
import { ApprovedIcon } from "@/components/shared/approved-icon";
import { BUSINESS_INFO } from "@/shared/business-info";

export function SiteFooter() {
  const { scrollTo } = useExperience();
  return <footer id="footer" className="border-t border-brand-gold-line/50 bg-brand-surface pt-12 md:pt-14">
    <div className="site-container footer-grid grid grid-cols-2 gap-x-6 gap-y-10 pb-10 min-[900px]:grid-cols-[1.35fr_.8fr_.8fr_1.25fr] min-[900px]:gap-10">
      <div className="footer-brand"><FooterBrandLogo /><p className="mt-4 max-w-sm text-xs leading-7 text-brand-muted">باشگاه تخصصی بدنسازی و فیتنس شب قهرمانان؛ جایی برای ساختن بهترین نسخه از خود.</p><div className="mt-5 flex flex-wrap gap-2"><a href={BUSINESS_INFO.instagram.url} target="_blank" rel="noopener noreferrer" aria-label={`اینستاگرام ${BUSINESS_INFO.instagram.label}`} className="grid size-10 place-items-center rounded-full border border-brand-gold-line bg-brand-bg/40 transition hover:border-brand-gold hover:bg-brand-gold/10"><ApprovedIcon icon="instagram" variant="social" /></a><a href="mailto:info@shabghahraman.ir" aria-label="ایمیل" className="grid size-10 place-items-center rounded-full border border-brand-gold-line bg-brand-bg/40 transition hover:border-brand-gold hover:bg-brand-gold/10"><ApprovedIcon icon="email" variant="social" /></a></div></div>
      <div className="footer-nav"><h3 className="mb-4 text-sm font-black text-brand-ink">دسترسی سریع</h3><ul className="space-y-3 text-xs leading-6 text-brand-muted"><li><Link href="/#hero-section" onClick={(event) => { if (window.location.pathname === "/") { event.preventDefault(); scrollTo("hero-section"); } }}>صفحه اصلی</Link></li><li><Link href="/#programs-section" onClick={(event) => { if (window.location.pathname === "/") { event.preventDefault(); scrollTo("programs-section"); } }}>برنامه‌ها</Link></li><li><Link href="/#plans-section" onClick={(event) => { if (window.location.pathname === "/") { event.preventDefault(); scrollTo("plans-section"); } }}>پلن‌های عضویت</Link></li><li><Link href="/blog">مجله ورزشی</Link></li></ul></div>
      <div className="footer-services"><h3 className="mb-4 text-sm font-black text-brand-ink">خدمات</h3><ul className="space-y-3 text-xs leading-6 text-brand-muted"><li>برنامه تمرینی</li><li>برنامه غذایی</li><li>جلسات PT</li><li>آنالیز بدن</li></ul></div>
      <div className="footer-contact"><h3 className="mb-4 text-sm font-black text-brand-ink">اطلاعات تماس</h3><ul className="space-y-3 text-xs leading-6 text-brand-muted"><li className="flex items-start gap-2"><ApprovedIcon icon="location" variant="contact" className="mt-0.5 shrink-0" /><span>{BUSINESS_INFO.address}</span></li><li className="flex items-start gap-2"><ApprovedIcon icon="schedule" variant="contact" className="mt-0.5 shrink-0" /><span>{BUSINESS_INFO.workingHours}</span></li>{Object.values(BUSINESS_INFO.phones).map((phone) => <li key={phone.value} className="flex items-center gap-2"><ApprovedIcon icon="phone" variant="contact" className="shrink-0" /><span>{phone.label}:</span><a href={`tel:${phone.value}`} dir="ltr" className="whitespace-nowrap transition-colors hover:text-brand-gold">{phone.value}</a></li>)}<li className="flex items-center gap-2"><ApprovedIcon icon="email" variant="contact" className="shrink-0" /><bdi dir="ltr" className="whitespace-nowrap">info@shabghahraman.ir</bdi></li></ul></div>
    </div>
    <div className="border-t border-brand-line py-5 text-center text-[11px] text-brand-muted">© {new Date().getFullYear()} تمامی حقوق برای باشگاه شب قهرمانان محفوظ است.</div>
  </footer>;
}
