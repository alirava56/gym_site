import { Check, UserRound, UsersRound } from "lucide-react";
import { MembershipPricingDialog } from "@/components/sections/membership-pricing-dialog";
import { RegistrationForm } from "@/components/sections/registration-form";
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_KINDS, type MembershipKind } from "@/shared/membership-pricing";
import styles from "./membership.module.css";

const membershipOrder: MembershipKind[] = ["single", "family"];

export function MembershipSection() {
  return (
    <section id="plans-section" aria-labelledby="membership-title" className={`section-shell border-y border-brand-line ${styles.section}`}>
      <div className="site-container">
        <div className={styles.heading}>
          <p className="section-kicker">یک قدم نزدیک‌تر به هدف</p>
          <h2 id="membership-title" className="section-title mt-2">پلن‌های عضویت</h2>
          <p className={styles.intro}>تنهایی شروع کنید، یا با خانواده همراه شوید.</p>
          <span className={styles.headingLine} aria-hidden="true" />
        </div>

        <div className={styles.plans}>
          {membershipOrder.map((kind) => {
            const plan = MEMBERSHIP_KINDS[kind];
            const Icon = kind === "family" ? UsersRound : UserRound;
            return (
              <article key={kind} aria-labelledby={`${kind}-plan-title`} className={styles.plan}>
                <div className={`${styles.square} ${kind === "family" ? styles.familySquare : ""}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.icon}><Icon aria-hidden="true" /></span>
                    <span className={styles.audience}>{plan.audience}</span>
                  </div>
                  <div className={styles.cardTitle}>
                    <h3 id={`${kind}-plan-title`}>{plan.title}</h3>
                    <span lang="en" dir="ltr">{plan.english}</span>
                  </div>
                  <p className={styles.description}>{plan.description}</p>
                  <ul className={styles.benefits}>
                    {MEMBERSHIP_BENEFITS.map((benefit) => (
                      <li key={benefit}><Check aria-hidden="true" /><span>{benefit}</span></li>
                    ))}
                  </ul>
                  <div className={styles.cardNote}>
                    <span className={styles.noteDot} aria-hidden="true" />
                    {kind === "family" ? "امکانات کامل، همراه با تخفیف برای هر نفر" : "یک عضویت، دسترسی به تمام امکانات"}
                  </div>
                </div>
                <MembershipPricingDialog kind={kind} />
              </article>
            );
          })}
        </div>
        <p className={styles.sectionNote}>بعد از انتخاب پلن، تعداد جلسات و تعرفه‌های عضویت را ببینید.</p>
        <RegistrationForm />
      </div>
    </section>
  );
}
