export type MembershipKind = "single" | "family";
export const MEMBERSHIP_SESSION_OPTIONS = [30, 16, 12] as const;
export type MembershipSessions = (typeof MEMBERSHIP_SESSION_OPTIONS)[number];

export const MEMBERSHIP_BENEFITS = [
  "دسترسی کامل به سونا خشک",
  "استفاده از تمام امکانات و تجهیزات باشگاه",
  "دسترسی در تمام ساعات کاری باشگاه",
  "پارکینگ اختصاصی اعضا",
] as const;

export const MEMBERSHIP_KINDS = {
  single: {
    title: "پلن سینگل",
    english: "SINGLE",
    audience: "عضویت فردی",
    description: "برای شما که می‌خواهید روی مسیر و هدف شخصی خود تمرکز کنید.",
  },
  family: {
    title: "پلن فامیلی",
    english: "FAMILY",
    audience: "عضویت با تخفیف خانوادگی",
    description: "پلن فامیلی شامل شما، خانواده درجه‌یک و فامیل‌های شما می‌شود.",
  },
} as const;

const durations = ["ماهانه", "دوماهه", "سه‌ماهه", "چهارماهه", "شش‌ماهه", "ده‌ماهه", "سالانه"] as const;
export const MEMBERSHIP_MONTH_OPTIONS = [1, 2, 3, 4, 6, 10, 12] as const;
export type MembershipMonths = (typeof MEMBERSHIP_MONTH_OPTIONS)[number];
export type MembershipPackageId = `${MembershipKind}-${MembershipSessions}-${MembershipMonths}`;

export interface MembershipPriceRow {
  months: MembershipMonths;
  duration: (typeof durations)[number];
  basePrice: number;
  discount: number;
  freezeDays: number;
  finalPrice: number;
}

// Transcribed from the supplied SINGLE and FAMILY tables.
// FAMILY / 16 sessions / 3 months explicitly lists 8,200,000 (not 8,250,000).
const basePrices: Record<MembershipSessions, readonly number[]> = {
  30: [3000000, 6000000, 9000000, 12000000, 18000000, 30000000, 36000000],
  16: [2750000, 5500000, 8250000, 11000000, 16500000, 27500000, 33000000],
  12: [2500000, 5000000, 7500000, 10000000, 15000000, 25000000, 30000000],
};
const discounts: Record<MembershipKind, readonly number[]> = {
  single: [0, 200000, 500000, 1000000, 2000000, 4000000, 6000000],
  family: [200000, 500000, 1000000, 2000000, 3000000, 5000000, 8000000],
};
const freezeDays: Record<MembershipSessions, readonly number[]> = {
  30: [0, 7, 14, 21, 28, 35, 42],
  16: [0, 4, 8, 12, 16, 20, 24],
  12: [0, 3, 6, 9, 12, 15, 18],
};

export function getMembershipPrices(kind: MembershipKind, sessions: MembershipSessions): MembershipPriceRow[] {
  return durations.map((duration, index) => {
    const basePrice = kind === "family" && sessions === 16 && index === 2
      ? 8200000
      : basePrices[sessions][index];
    const discount = discounts[kind][index];
    return { months: MEMBERSHIP_MONTH_OPTIONS[index], duration, basePrice, discount, freezeDays: freezeDays[sessions][index], finalPrice: basePrice - discount };
  });
}

const persianNumber = new Intl.NumberFormat("fa-IR");
export const formatMembershipNumber = (value: number) => persianNumber.format(value);

export function getMembershipPackageId(kind: MembershipKind, sessions: MembershipSessions, months: MembershipMonths): MembershipPackageId {
  return `${kind}-${sessions}-${months}`;
}

export function getMembershipPackage(value: unknown) {
  if (typeof value !== "string" || !/^(single|family)-(12|16|30)-(1|2|3|4|6|10|12)$/.test(value)) return null;
  const [kind, sessionsText, monthsText] = value.split("-");
  const membershipKind = kind as MembershipKind;
  const sessions = Number(sessionsText) as MembershipSessions;
  const row = getMembershipPrices(membershipKind, sessions).find((item) => item.months === Number(monthsText));
  if (!row) return null;
  const id = getMembershipPackageId(membershipKind, sessions, row.months);
  if (value !== id) return null;
  return {
    ...row,
    id,
    kind: membershipKind,
    sessions,
    name: `${MEMBERSHIP_KINDS[membershipKind].title} · ${formatMembershipNumber(sessions)} جلسه در ماه · ${row.duration}`,
    price: formatMembershipNumber(row.finalPrice),
    priceRaw: row.finalPrice,
  };
}
