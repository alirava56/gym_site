import React, { useEffect, useState } from "react";
import { getNext14Days, ShamsiDay } from "@/shared/jalali";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { ApprovedIcon } from "@/components/shared/approved-icon";

interface ShamsiDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  allowedDayNames?: readonly string[];
}

export default function ShamsiDatePicker({ value, onChange, label, allowedDayNames }: ShamsiDatePickerProps) {
  const [days, setDays] = useState<ShamsiDay[]>([]);

  useEffect(() => {
    setDays(getNext14Days());
  }, []);

  useEffect(() => {
    if (!days.length) return;
    const availableDays = allowedDayNames?.length
      ? days.filter((day) => allowedDayNames.includes(day.dayName))
      : days;

    if (availableDays.length > 0 && !availableDays.some((day) => day.gregorianStr === value)) {
      onChange(availableDays[0].gregorianStr);
    }
  }, [days, value, onChange, allowedDayNames]);

  const handleSelect = (isoDate: string) => {
    onChange(isoDate);
  };

  const visibleDays = allowedDayNames?.length
    ? days.filter((day) => allowedDayNames.includes(day.dayName))
    : days;

  return (
    <div className="space-y-2 text-right">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] text-white/50 font-bold">{label}</label>
          <span className="text-[10px] text-[#d4af37]/80 font-medium flex items-center gap-1">
            <ApprovedIcon icon="schedule" variant="contact" className="size-4" />
            انتخاب سریع تاریخ شمسی
          </span>
        </div>
      )}

      <div className="relative">
        <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-3 sm:grid-cols-4">
          {visibleDays.map((day) => {
            const isSelected = value === day.gregorianStr;
            const isToday = day.gregorianStr === days[0]?.gregorianStr;
            const isAllowed = !allowedDayNames?.length || allowedDayNames.includes(day.dayName);

            return (
              <motion.button
                key={day.gregorianStr}
                type="button"
                disabled={!isAllowed}
                aria-disabled={!isAllowed}
                onClick={() => isAllowed && handleSelect(day.gregorianStr)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label={`${day.dayName} ${day.dayNum} ${day.monthName}${isToday ? "، امروز" : ""}`}
                aria-pressed={isSelected}
                className={`relative flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-[#d4af37] to-[#b8954c] text-black border-transparent shadow-lg shadow-[#d4af37]/15 font-bold"
                    : isAllowed
                      ? "bg-black/30 border-white/5 text-white/70 hover:text-white hover:border-white/10"
                      : "bg-black/20 border-white/5 text-white/25 opacity-50 cursor-not-allowed"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-white/10 rounded-2xl filter blur-sm -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {isToday && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1 ${
                    isSelected ? "bg-black text-[#d4af37]" : "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/20"
                  }`}>
                    امروز
                  </span>
                )}

                <span className={`text-[10px] ${isSelected ? "text-black/80 font-black" : "text-white/40"}`}>
                  {day.dayName}
                </span>

                <span className={`text-lg font-black tracking-tight leading-none ${isSelected ? "text-black" : "text-white"}`}>
                  {day.dayNum}
                </span>

                <span className={`text-[10px] ${isSelected ? "text-black/80 font-bold" : "text-white/40"}`}>
                  {day.monthName}
                </span>

                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute end-1 top-1 rounded-full bg-black p-0.5 text-[#d4af37]"
                  >
                    <Check className="w-2 h-2" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <div className="bg-[#1c1f22]/50 border border-white/5 rounded-xl px-4 py-2 flex items-center justify-between text-[11px] text-white/60">
        <span>تاریخ انتخاب شده:</span>
        <span className="font-bold text-[#d4af37] flex items-center gap-1.5">
          <ApprovedIcon icon="schedule" variant="contact" className="size-4" />
          {days.find((day) => day.gregorianStr === value)?.shamsiStr || "در حال بارگذاری..."}
        </span>
      </div>
    </div>
  );
}
