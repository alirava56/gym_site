"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-brand-line", className)} {...props} />;
}

export function AccordionTrigger({ children, className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger className={cn("group flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-bold text-brand-ink hover:text-brand-gold", className)} {...props}>
        {children}
        <ChevronDown className="size-4 shrink-0 text-brand-muted transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand-gold" aria-hidden="true" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ children, className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return <AccordionPrimitive.Content className="overflow-hidden text-brand-muted data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}><div className={cn("pb-5 text-sm leading-8", className)}>{children}</div></AccordionPrimitive.Content>;
}
