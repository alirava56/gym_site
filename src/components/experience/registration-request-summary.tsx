import type { Subscription } from "@/types/gym";

const statusLabels: Record<string, string> = {
  new: "در انتظار بررسی پذیرش",
  contacted: "هماهنگی با پذیرش انجام شده",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
};

export function RegistrationRequestSummary({ subscription }: { subscription: Subscription }) {
  return <div className="mt-5 space-y-4 rounded-xl border border-brand-gold-line bg-brand-bg p-4">
    <div className="grid gap-4 text-xs sm:grid-cols-2">
      <p><span className="mb-1 block text-brand-muted">شهریه پکیج برای هر نفر</span><strong className="text-brand-gold">{subscription.price} تومان</strong></p>
      <p><span className="mb-1 block text-brand-muted">وضعیت درخواست</span><strong>{statusLabels[subscription.status] ?? subscription.status}</strong></p>
    </div>
    <div className="border-t border-brand-line pt-3"><p className="mb-2 text-xs text-brand-muted">کد پیگیری</p><code dir="ltr" className="block select-all break-all text-left font-mono text-xs leading-6 text-brand-ink">{subscription.referenceCode}</code></div>
    <p className="text-[11px] leading-6 text-brand-muted">برای تکمیل عضویت و پرداخت، در تاریخ انتخاب‌شده به پذیرش باشگاه مراجعه کنید.</p>
  </div>;
}
