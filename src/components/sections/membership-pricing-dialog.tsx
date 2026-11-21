"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Info, Snowflake, TicketPercent, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationFormFields } from "@/components/sections/registration-form";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  formatMembershipNumber as number,
  getMembershipPrices,
  getMembershipPackageId,
  MEMBERSHIP_KINDS,
  MEMBERSHIP_SESSION_OPTIONS,
  type MembershipKind,
  type MembershipMonths,
  type MembershipSessions,
} from "@/shared/membership-pricing";
import styles from "./membership.module.css";

export function MembershipPricingDialog({ kind }: { kind: MembershipKind }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pricing" | "registration">("pricing");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MembershipSessions>(30);
  const plan = MEMBERSHIP_KINDS[kind];
  const rows = getMembershipPrices(kind, sessions);
  const Icon = kind === "family" ? UsersRound : UserRound;
  useEffect(() => {
    if (step !== "pricing" || !packageId) return;
    const buttons = document.querySelectorAll<HTMLButtonElement>(`button[data-package-id="${packageId}"]`);
    [...buttons].find((button) => button.getClientRects().length > 0)?.focus();
  }, [step, packageId]);

  const choosePackage = (months: MembershipMonths) => {
    setPackageId(getMembershipPackageId(kind, sessions, months));
    setStep("registration");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) setStep("pricing"); }}>
      <DialogTrigger asChild>
        <Button variant={kind === "family" ? "primary" : "outline"} aria-label={`انتخاب پلن ${kind === "family" ? "فامیلی" : "سینگل"}`} className={styles.chooseButton}>
          انتخاب پلن <ArrowLeft aria-hidden="true" className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogEyebrow}><Icon aria-hidden="true" /> تعرفه‌های عضویت <span lang="en" dir="ltr">{plan.english}</span></div>
          <DialogTitle className={styles.dialogTitle}>{step === "pricing" ? `پکیج‌های ${plan.title}` : "رزرو بازدید و پیش‌ثبت‌نام"}</DialogTitle>
          <DialogDescription className={styles.dialogDescription}>
            {step === "registration" ? "پکیج شما انتخاب شد؛ اطلاعات و تاریخ مراجعه را ثبت کنید." : kind === "family" ? "تعداد جلسات و سپس پکیج دلخواهتان را انتخاب کنید؛ تعرفه‌ها برای هر نفر است." : "تعداد جلسات ماهانه و سپس پکیج دلخواهتان را انتخاب کنید."}
          </DialogDescription>
          <div className={styles.steps} aria-label="مراحل پیش‌ثبت‌نام"><span aria-current={step === "pricing" ? "step" : undefined}>۱. انتخاب پکیج</span><ArrowLeft aria-hidden="true" /><span aria-current={step === "registration" ? "step" : undefined}>۲. اطلاعات مراجعه</span></div>
        </div>

        <div className={styles.pricingStep} hidden={step !== "pricing"}>
        <div className={styles.sessionControls}>
          <div className={styles.sessionLabel}><CalendarDays aria-hidden="true" /><span>تعداد جلسات در ماه</span></div>
          <div role="group" aria-label="تعداد جلسات در ماه" className={styles.sessionOptions}>
            {MEMBERSHIP_SESSION_OPTIONS.map((option) => (
              <button key={option} type="button" aria-pressed={sessions === option} onClick={() => setSessions(option)}>
                <strong>{number(option)}</strong> جلسه
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pricingBody}>
          <div className={styles.tableSummary} aria-live="polite" aria-atomic="true">
            <p>{number(sessions)} جلسه در ماه <span> / </span> {number(rows.length)} پکیج عضویت</p>
            <span>مبالغ به تومان، برای هر نفر</span>
          </div>
          <div className={styles.desktopTable}>
            <table className={styles.priceTable}>
              <caption className="sr-only">تعرفه‌های {plan.title}، {number(sessions)} جلسه در ماه؛ مبالغ به تومان و برای هر نفر</caption>
              <thead><tr><th scope="col">جلسات در ماه</th><th scope="col">نوع اشتراک</th><th scope="col">شهریه هر نفر</th><th scope="col">تخفیف هر نفر</th><th scope="col">فریز (روز)</th><th scope="col">شهریه نهایی هر نفر</th><th scope="col"><span className="sr-only">انتخاب پکیج</span></th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.duration} className={row.duration === "سالانه" ? styles.annualRow : undefined}>
                    <td className={styles.sessionCell}>{number(sessions)}</td>
                    <th scope="row">{row.duration}</th>
                    <td className={styles.basePrice}>{number(row.basePrice)}</td>
                    <td className={styles.discount}>{row.discount ? number(row.discount) : "—"}</td>
                    <td>{row.freezeDays ? number(row.freezeDays) : "—"}</td>
                    <td className={styles.finalPrice}>{number(row.finalPrice)}</td>
                    <td><button type="button" className={styles.selectPackage} data-package-id={getMembershipPackageId(kind, sessions, row.months)} aria-label={`انتخاب پکیج ${row.duration}`} onClick={() => choosePackage(row.months)}>انتخاب <ArrowLeft aria-hidden="true" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobilePackages}>
            {rows.map((row) => (
              <article key={row.duration} className={`${styles.package} ${row.duration === "سالانه" ? styles.annualPackage : ""}`}>
                <div className={styles.packageTop}>
                  <h3>{row.duration}</h3>
                  <div className={styles.packagePrice}>
                    {row.discount > 0 && <span className={styles.originalPrice}><span className="sr-only">شهریه پیش از تخفیف: </span><s>{number(row.basePrice)}</s></span>}
                    <p><span className="sr-only">شهریه نهایی: </span><strong>{number(row.finalPrice)}</strong> <span>تومان / نفر</span></p>
                  </div>
                </div>
                <dl className={styles.packageDetails}>
                  <div><dt><TicketPercent aria-hidden="true" /> تخفیف هر نفر</dt><dd className={row.discount ? styles.discount : undefined}>{row.discount ? `${number(row.discount)} تومان` : "ندارد"}</dd></div>
                  <div><dt><Snowflake aria-hidden="true" /> فریز عضویت</dt><dd>{row.freezeDays ? `${number(row.freezeDays)} روز` : "ندارد"}</dd></div>
                </dl>
                <button type="button" className={styles.selectPackage} data-package-id={getMembershipPackageId(kind, sessions, row.months)} aria-label={`انتخاب پکیج ${row.duration}`} onClick={() => choosePackage(row.months)}>انتخاب این پکیج <ArrowLeft aria-hidden="true" /></button>
              </article>
            ))}
          </div>
          <div className={styles.freezeNote}><Info aria-hidden="true" /><p>فریز، امکان توقف موقت عضویت برای تعداد روزهای مشخص‌شده در هر پکیج است.</p></div>
        </div>
        <div className={styles.dialogFooter}><Info aria-hidden="true" className="size-4 shrink-0" /><p>پکیج دلخواه را انتخاب کنید؛ در مرحله بعد اطلاعات و تاریخ مراجعه را ثبت می‌کنید.</p></div>
        </div>
        {packageId && <div className={styles.registrationStep} hidden={step !== "registration"}><RegistrationFormFields selectedPlanId={packageId} active={step === "registration"} onBack={() => setStep("pricing")} onSuccess={() => setOpen(false)} /></div>}
      </DialogContent>
    </Dialog>
  );
}
