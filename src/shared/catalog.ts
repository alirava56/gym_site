export type WeekdayKey = "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
export interface TrainerSlot { key: string; start: string; end: string }
export interface Trainer { id: "arash-shams" | "mobin-yazdanzadeh"; name: string; image: string; imagePosition: string; price: string; priceRaw: number; availability: Partial<Record<WeekdayKey, readonly TrainerSlot[]>> }
const slot = (start: string, end: string): TrainerSlot => ({ key: `${start}-${end}`, start, end });
export const WEEKDAY_LABELS: Record<WeekdayKey, string> = { saturday: "شنبه", sunday: "یکشنبه", monday: "دوشنبه", tuesday: "سه‌شنبه", wednesday: "چهارشنبه", thursday: "پنجشنبه", friday: "جمعه" };
const arashSlots = [slot("08:00", "10:00"), slot("10:00", "12:00"), slot("16:00", "18:00"), slot("18:00", "20:00")];
const mobinSlots = [slot("09:00", "11:00"), slot("11:00", "13:00"), slot("14:00", "16:00"), slot("16:00", "18:00")];
export const TRAINERS = {
  "arash-shams": { id: "arash-shams", name: "آرش شمس", image: "/images/trainers/arash-shams.webp", imagePosition: "50% 28%", price: "۴۵۰,۰۰۰ تومان", priceRaw: 450000, availability: { saturday: arashSlots, monday: arashSlots, wednesday: arashSlots } },
  "mobin-yazdanzadeh": { id: "mobin-yazdanzadeh", name: "مبین یزدان‌زاده", image: "/images/trainers/mobin-yazdanzadeh.webp", imagePosition: "50% 25%", price: "۴۰۰,۰۰۰ تومان", priceRaw: 400000, availability: { sunday: mobinSlots, tuesday: mobinSlots, thursday: mobinSlots } }
} as const satisfies Record<string, Trainer>;
export const TRAINER_ORDER = ["arash-shams", "mobin-yazdanzadeh"] as const;
export type TrainerId = keyof typeof TRAINERS;
export const getTrainerDayNames = (trainer: Trainer) => Object.keys(trainer.availability).map((key) => WEEKDAY_LABELS[key as WeekdayKey]);
export const getTrainerPresenceText = (trainer: Trainer) => getTrainerDayNames(trainer).join("، ");
export const getTrainerHoursText = (trainer: Trainer) => { const all = Object.values(trainer.availability).flat(); const starts = all.map((item) => item.start).sort(); const ends = all.map((item) => item.end).sort(); return all.length ? `${starts[0]} تا ${ends.at(-1)}` : "نامشخص"; };

export interface MembershipPlan { id: "12session" | "16session" | "30session"; name: string; duration: string; price: string; priceRaw: number; badge?: string; isPopular?: boolean; features: readonly string[] }
export const MEMBERSHIP_PLANS = {
  "12session": { id: "12session", name: "عضویت ۱۲ جلسه‌ای", duration: "۱۲ جلسه", price: "۲,۵۰۰,۰۰۰", priceRaw: 2500000, badge: "پایه", features: ["دسترسی در ساعات کاری باشگاه", "کمد اختصاصی با قفل اثر انگشت هوشمند", "۱ جلسه سنجش دقیق ترکیب بدنی با InBody", "استفاده کامل از سالن بدنسازی و وزنه آزاد", "حوله و ملزومات بهداشتی شخصی روزانه", "دوش و جکوزی اختصاصی اعضا"] },
  "30session": { id: "30session", name: "عضویت ۳۰ جلسه‌ای", duration: "۳۰ جلسه", price: "۳,۰۰۰,۰۰۰", priceRaw: 3000000, badge: "پیشنهاد ویژه (پرطرفدار ترین)", isPopular: true, features: ["تمامی امکانات سطح ۱۲ جلسه‌ای", "استفاده نامحدود از امکانات باشگاه در طول جلسات فعال", "۱۰٪ تخفیف دائمی کل منوی بوفه پروتئین بار", "پارکینگ اختصاصی سرپوشیده مجهز به نگهبان", "۳ جلسه مشاوره تخصصی رژیم غذایی و برنامه تمرینی", "دوش و جکوزی اختصاصی اعضا"] },
  "16session": { id: "16session", name: "عضویت ۱۶ جلسه‌ای", duration: "۱۶ جلسه", price: "۲,۷۵۰,۰۰۰", priceRaw: 2750000, badge: "عضویت ویژه", features: ["تمامی امکانات سطح ۳۰ جلسه‌ای", "دسترسی به لاونج و سالن استراحت اختصاصی VIP", "برنامه رژیم غذایی پیشرفته ماهانه توسط پزشک تغذیه", "۲ جلسه تمرین خصوصی ۱ به ۱ با مربی دلخواه شما", "شستشوی رایگان البسه ورزشی در لاندری باشگاه", "کمد اختصاصی دائم به نام شما در تمام مدت عضویت", "دوش و جکوزی اختصاصی اعضا"] }
} as const satisfies Record<string, MembershipPlan>;
export const MEMBERSHIP_PLAN_ORDER = ["12session", "30session", "16session"] as const;
export type MembershipPlanId = keyof typeof MEMBERSHIP_PLANS;
