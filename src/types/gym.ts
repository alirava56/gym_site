import type { Trainer } from "@/shared/catalog";

export interface Booking {
  id: string; trainerId: string; trainerName: string; date: string; dateLabel: string; timeSlot: string; price: string; status: string; createdAt: string;
  customerName?: string; customerPhone?: string;
}

export interface Subscription {
  planId: string; planName: string; duration: string; price: string; fullName: string; phone: string;
  visitDate: string; visitDateLabel?: string; referenceCode: string; status: string; createdAt: string;
}

export interface RegistrationInput { planId: string; fullName: string; phone: string; visitDate: string }
export interface BookingInput { trainer: Trainer; date: string; timeSlot: string; customerName: string; customerPhone: string }

export const normalizePhoneInput = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[\s()-]/g, "");

export const getIranianMobileError = (value: string) => {
  if (!value) return "شماره موبایل الزامی است.";
  if (!value.startsWith("09")) return "شماره موبایل باید با ۰۹ شروع شود.";
  if (value.length !== 11) return "شماره موبایل باید دقیقاً ۱۱ رقم باشد.";
  return "";
};
