import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { HeroActions } from "@/components/sections/section-actions";
import { ApprovedIcon } from "@/components/shared/approved-icon";
import type { ApprovedIconKey } from "@/shared/approved-icons";

const features = [
  ["professionalCoach", "مربیان حرفه‌ای", "مربیان مجرب با دانش علمی و سابقه درخشان", "order-3 md:order-none"],
  ["personalizedProgram", "برنامه شخصی‌سازی", "برنامه تمرینی و تغذیه اختصاصی برای اهداف شما", "order-4 md:order-none"],
  ["advancedEquipment", "تجهیزات پیشرفته", "دستگاه‌های مدرن و استاندارد جهانی", "order-1 md:order-none"],
  ["supportMotivation", "پشتیبانی و انگیزه", "همراهی پیوسته برای رسیدن به هدف", "order-2 md:order-none"],
] as const;

export function HeroSection() {
  return <>
    <section id="hero-section" className="hex-pattern relative isolate overflow-hidden border-b border-brand-line bg-brand-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_27%_48%,rgba(229,173,34,.12),transparent_27rem)]" />
      <div className="site-container hero-stage">
        <div className="hero-copy">
          <div className="mb-5 hidden items-center gap-2 rounded-md border border-brand-gold-line bg-brand-gold/5 px-3 py-2 text-xs font-bold text-brand-gold md:inline-flex"><BadgeCheck className="size-4" />باشگاه تخصصی بدنسازی و فیتنس</div>
          <h1 className="hero-title">تغییر از امروز،<br /><span className="text-brand-gold">قدرت تا همیشه</span></h1>
          <p className="hero-description">با برنامه‌های علمی، مربیان حرفه‌ای و تجهیزات پیشرفته، برای ساختن بهترین نسخه از خودتان آماده شوید.</p>
          <HeroActions />
        </div>
        <div className="hero-art" dir="ltr">
          <div className="absolute inset-x-[8%] bottom-[8%] h-32 rounded-full bg-brand-gold/10 blur-3xl" />
          <Image src="/images/hero-athlete-transparent.png" alt="ورزشکار در حال دویدن با نور طلایی" fill priority sizes="(max-width: 767px) 112vw, 50vw" className="object-contain object-bottom" />
          <div className="hero-fade" />
        </div>
      </div>
    </section>
    <section id="features-section" aria-label="ویژگی‌های باشگاه" className="relative z-20 -mt-1 pb-6 lg:-mt-16">
      <div className="site-container grid grid-cols-2 overflow-hidden rounded-xl border border-brand-line bg-brand-card shadow-[var(--shadow-brand)] md:grid-cols-4">
        {features.map(([icon, title, text, order]) => <article key={title} className={`group border-brand-line p-4 text-center odd:border-l md:border-l md:p-6 last:md:border-l-0 ${order}`}><ApprovedIcon icon={icon as ApprovedIconKey} variant="feature" className="mx-auto mb-2 transition-transform group-hover:-translate-y-1" /><h2 className="text-sm font-black">{title}</h2><p className="mt-2 hidden text-[11px] leading-6 text-brand-muted sm:block">{text}</p></article>)}
      </div>
    </section>
  </>;
}
