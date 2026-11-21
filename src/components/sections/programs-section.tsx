import { ApprovedIcon } from "@/components/shared/approved-icon";
import type { ApprovedIconKey } from "@/shared/approved-icons";

const programs = [
  ["fatLoss", "کاهش چربی و تناسب اندام", "کاهش وزن همراه با حفظ عضله و رسیدن به فرم ایده‌آل"],
  ["muscleGain", "افزایش حجم عضلات", "برنامه اصولی برای افزایش قدرت و رشد عضلانی"],
  ["functionalFitness", "فیتنس عملکردی", "بهبود عملکرد، استقامت، انعطاف و آمادگی بدنی"],
] as const;

export function ProgramsSection() {
  return <section id="programs-section" className="section-shell">
    <div className="site-container"><div className="mb-9 text-center"><p className="section-kicker">مسیر تمرینی شما</p><h2 className="section-title mt-2">برنامه‌های تمرینی</h2><p className="mt-3 text-sm text-brand-muted">با برنامه‌های متنوع به بهترین نسخه خود تبدیل شوید.</p></div>
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">{programs.map(([icon, title, text]) => <article key={title} className="brand-card group flex min-h-40 flex-col items-center justify-center p-3 text-center transition hover:-translate-y-1 hover:border-brand-gold-line sm:min-h-48 sm:p-4 md:min-h-60 md:p-6"><ApprovedIcon icon={icon as ApprovedIconKey} variant="program" className="mb-2 md:mb-4" /><h3 className="text-[11px] font-black leading-5 sm:text-sm md:text-base">{title}</h3><p className="mt-3 hidden text-xs leading-7 text-brand-muted sm:block">{text}</p></article>)}</div>
    </div>
  </section>;
}
