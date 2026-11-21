import { ChevronDown } from "lucide-react";

export interface StyledSelectOption {
  value: string;
  label: string;
  detail?: string;
  sideLabel?: string;
  disabled?: boolean;
}

interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  optionClassName?: string;
  ariaLabelledBy?: string;
  disabled?: boolean;
}

export default function StyledSelect({
  value,
  options,
  onChange,
  placeholder = "انتخاب نمایید",
  className = "",
  buttonClassName = "",
  ariaLabelledBy,
  disabled = false
}: StyledSelectProps) {
  return (
    <div className={`relative ${className}`} dir="rtl">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        className={`min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pl-10 text-xs font-bold text-white outline-none transition-colors hover:border-white/20 focus:border-[#d4af37]/80 focus:ring-1 focus:ring-[#d4af37]/20 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {[option.label, option.detail, option.sideLabel].filter(Boolean).join(" — ")}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#d4af37]" />
    </div>
  );
}
