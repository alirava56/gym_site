"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import ShamsiDatePicker from "@/components/ShamsiDatePicker";
import StyledSelect from "@/components/StyledSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useExperience } from "@/components/experience/experience-provider";
import { MEMBERSHIP_PLAN_ORDER, MEMBERSHIP_PLANS } from "@/shared/catalog";
import { getIranianMobileError, normalizePhoneInput } from "@/types/gym";
import { ApprovedIcon } from "@/components/shared/approved-icon";
import { formatMembershipNumber as number, getMembershipPackage, MEMBERSHIP_KINDS } from "@/shared/membership-pricing";
import styles from "./membership.module.css";

export function RegistrationForm() {
  const { selectedPlanId, isRegistrationOpen, closeRegistration } = useExperience();
  return <Dialog open={isRegistrationOpen} onOpenChange={(open) => { if (!open) closeRegistration(); }}><DialogContent className="flex max-w-[70rem] flex-col overflow-hidden p-0">
    <div className="shrink-0 border-b border-brand-line px-5 py-5 pl-16 sm:px-6 sm:pl-16"><div className="flex items-center gap-3"><ApprovedIcon icon="schedule" variant="feature" className="size-11 shrink-0 sm:size-12" /><div><DialogTitle className="text-base font-black sm:text-lg">رزرو بازدید و پیش‌ثبت‌نام</DialogTitle><DialogDescription className="mt-1 text-xs leading-6 text-brand-muted">اطلاعات خود را ثبت کنید؛ پرداخت پس از مراجعه حضوری انجام می‌شود.</DialogDescription></div></div></div>
    <RegistrationFormFields selectedPlanId={selectedPlanId} active={isRegistrationOpen} />
  </DialogContent></Dialog>;
}

export function RegistrationFormFields({ selectedPlanId, active = true, onBack, onSuccess }: {
  selectedPlanId: string;
  active?: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}) {
  const { register, notify } = useExperience();
  const inputId = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const selectedPackage = getMembershipPackage(selectedPlanId);
  const [planId, setPlanId] = useState(selectedPlanId);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => setPlanId(selectedPlanId), [selectedPlanId]);
  useEffect(() => { if (active) nameInput.current?.focus(); }, [active]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizePhoneInput(phone);
    const error = getIranianMobileError(normalized);
    setPhone(normalized); setPhoneError(error);
    if (!fullName.trim() || !visitDate || error) { notify(error || "لطفاً همه فیلدها را کامل کنید."); return; }
    setSubmitting(true);
    const ok = await register({ planId: selectedPackage?.id ?? planId, fullName: fullName.trim(), phone: normalized, visitDate });
    setSubmitting(false);
    if (ok) { setFullName(""); setPhone(""); setVisitDate(""); onSuccess?.(); }
  };

  return <form onSubmit={submit} className={styles.registrationForm}>
    <div className={styles.registrationBody}>
      {selectedPackage && <section aria-label="خلاصه پکیج انتخابی" className={styles.selectionSummary}>
        <div><p className={styles.summaryLabel}>پکیج انتخابی شما</p><h3>{MEMBERSHIP_KINDS[selectedPackage.kind].title} · {selectedPackage.duration}</h3><p className={styles.summarySessions}>{number(selectedPackage.sessions)} جلسه در ماه{selectedPackage.freezeDays > 0 && ` · ${number(selectedPackage.freezeDays)} روز فریز`}</p></div>
        <div className={styles.summaryPrice}><span>شهریه نهایی برای هر نفر</span><p><strong>{selectedPackage.price}</strong> تومان</p>{selectedPackage.discount > 0 && <span className={styles.discount}>{number(selectedPackage.discount)} تومان تخفیف</span>}</div>
      </section>}
      <fieldset disabled={submitting} className={styles.registrationGrid}>
        <div className={styles.registrationInputs}>
          <label className="block text-xs font-bold text-brand-muted"><span className="mb-2 block">نام و نام خانوادگی</span><input ref={nameInput} autoComplete="name" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 w-full rounded-xl border border-brand-line bg-brand-bg px-3 text-sm text-brand-ink outline-none focus:border-brand-gold" required /></label>
          <label className="block text-xs font-bold text-brand-muted"><span className="mb-2 block">شماره موبایل</span><input dir="ltr" inputMode="numeric" autoComplete="tel" maxLength={11} value={phone} onChange={(e) => { const value = normalizePhoneInput(e.target.value); setPhone(value); if (phoneError) setPhoneError(getIranianMobileError(value)); }} onBlur={() => setPhoneError(getIranianMobileError(phone))} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? `${inputId}-phone-error` : undefined} className={`h-11 w-full rounded-xl border bg-brand-bg px-3 text-left text-sm text-brand-ink outline-none ${phoneError ? "border-rose-500" : "border-brand-line focus:border-brand-gold"}`} placeholder="09121234567" required />{phoneError && <span id={`${inputId}-phone-error`} className="mt-1 block text-[10px] text-rose-400">{phoneError}</span>}</label>
          {!selectedPackage && <div><span className="mb-2 block text-xs font-bold text-brand-muted">پلن انتخابی</span><StyledSelect value={planId} onChange={setPlanId} options={MEMBERSHIP_PLAN_ORDER.map((id) => ({ value: id, label: MEMBERSHIP_PLANS[id].name }))} /></div>}
          <div className={styles.visitNote}><Info aria-hidden="true" /><p>این مرحله، درخواست بازدید و پیش‌ثبت‌نام است. تکمیل عضویت و پرداخت پس از مراجعه حضوری انجام می‌شود.</p></div>
        </div>
        <section aria-label="انتخاب تاریخ مراجعه" className="brand-card min-w-0 p-4 sm:p-5"><ShamsiDatePicker value={visitDate} onChange={setVisitDate} label="تاریخ مراجعه" /></section>
      </fieldset>
    </div>
    <div className={styles.registrationActions}>
      {onBack && <Button type="button" variant="outline" disabled={submitting} onClick={onBack}><ArrowRight aria-hidden="true" className="size-4" /> تغییر پکیج</Button>}
      <Button type="submit" disabled={submitting}>{submitting ? "در حال ثبت..." : "ثبت درخواست بازدید"}</Button>
    </div>
  </form>;
}
