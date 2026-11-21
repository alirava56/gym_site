// Gregorian to Jalali Calendar Converter & Utilities

export interface ShamsiDay {
  gregorianStr: string; // "YYYY-MM-DD"
  shamsiStr: string;    // "شنبه ۱۵ تیر"
  dayName: string;      // "شنبه"
  dayNum: string;       // "۱۵"
  monthName: string;    // "تیر"
  year: number;
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 335];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? (1 + Math.floor(days / 31)) : (7 + Math.floor((days - 186) / 30));
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

const pWeekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const pMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export const e2p = (num: number | string): string => {
  const pDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => pDigits[parseInt(x)]);
};

export function getNext14Days(): ShamsiDay[] {
  const list: ShamsiDay[] = [];
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const base = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const gy = d.getUTCFullYear();
    const gm = d.getUTCMonth() + 1;
    const gd = d.getUTCDate();
    const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
    
    const dayName = pWeekdays[d.getUTCDay()];
    const monthName = pMonths[jm - 1];
    const dayNum = e2p(jd);
    const year = jy;
    const shamsiStr = `${dayName} ${dayNum} ${monthName}`;
    const gregorianStr = `${gy}-${gm.toString().padStart(2, '0')}-${gd.toString().padStart(2, '0')}`;
    
    list.push({
      gregorianStr,
      shamsiStr,
      dayName,
      dayNum,
      monthName,
      year
    });
  }
  return list;
}
