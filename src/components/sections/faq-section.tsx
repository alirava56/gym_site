"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BUSINESS_INFO } from "@/shared/business-info";

const faqs = [
  ["برای شروع باید به چه چیزهایی نیاز دارم؟", "لباس ورزشی راحت، کفش مناسب و انگیزه کافی است. در نخستین مراجعه مربی راهنمای شروع مسیر را در اختیار شما می‌گذارد."],
  ["چگونه برنامه تمرینی مناسب من طراحی می‌شود؟", "پس از ارزیابی هدف، سابقه تمرین و آنالیز ترکیب بدن، برنامه تمرینی متناسب با شرایط شما تدوین می‌شود."],
  ["آیا امکان تمرین با بازگشت وجه وجود دارد؟", "جزئیات لغو یا تغییر پلن هنگام مراجعه حضوری و پیش از فعال‌سازی عضویت، مطابق قوانین عضویت توضیح داده می‌شود."],
  ["ساعات کاری باشگاه چگونه است؟", `باشگاه هر روز ${BUSINESS_INFO.workingHours} فعال است و زمان‌بندی بخش بانوان و آقایان در پذیرش اعلام می‌شود.`],
] as const;

export function FaqSection() {
  return <section id="faq-section" className="section-shell border-t border-brand-line bg-brand-surface/60"><div className="site-container max-w-4xl"><div className="mb-7 text-center"><p className="section-kicker">پاسخ‌های سریع</p><h2 className="section-title mt-2">سوالات متداول</h2></div><Accordion type="single" collapsible defaultValue="faq-0" className="overflow-hidden rounded-xl border border-brand-line bg-brand-card px-5">{faqs.map(([q, a], index) => <AccordionItem key={q} value={`faq-${index}`}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>;
}
