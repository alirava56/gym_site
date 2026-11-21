import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-brand)] px-5 text-sm font-black transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-gold text-brand-bg hover:bg-[#f2bd36] shadow-[var(--shadow-brand-glow)]",
        outline: "border border-brand-line bg-brand-card text-brand-ink hover:border-brand-gold-line hover:text-brand-gold",
        ghost: "text-brand-muted hover:bg-white/5 hover:text-brand-ink",
        danger: "bg-rose-500/12 text-rose-400 hover:bg-rose-500 hover:text-white"
      },
      size: { default: "h-11", sm: "h-9 min-h-9 px-3 text-xs", lg: "h-13 min-h-13 px-7" }
    },
    defaultVariants: { variant: "primary", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
