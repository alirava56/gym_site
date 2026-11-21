"use client";

import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExperience } from "@/components/experience/experience-provider";
import type { Trainer } from "@/shared/catalog";

const HERO_CTAS = {
  primary: { label: "شروع مسیر من", targetSection: "plans-section" },
  secondary: { label: "مشاهده باشگاه" }
} as const;

export function HeroActions() {
  const { scrollTo, setTourOpen } = useExperience();
  return <div className="hero-actions"><Button size="lg" onClick={() => scrollTo(HERO_CTAS.primary.targetSection)} className="hero-action">{HERO_CTAS.primary.label} <ArrowLeft aria-hidden="true" className="size-5" /></Button><Button variant="outline" size="lg" onClick={() => setTourOpen(true)} className="hero-action">{HERO_CTAS.secondary.label} <Play aria-hidden="true" className="size-5" /></Button></div>;
}

export function PlanAction({ planId, featured }: { planId: string; featured?: boolean }) {
  const { selectPlan } = useExperience();
  return <Button variant={featured ? "primary" : "outline"} className="mt-auto w-full" onClick={() => selectPlan(planId)}>انتخاب پلن</Button>;
}

export function CoachAction({ trainer }: { trainer: Trainer }) {
  const { openBooking } = useExperience();
  return <Button variant="outline" size="sm" className="w-full px-3 text-xs sm:w-auto" onClick={() => openBooking(trainer)}>مشاهده رزومه و رزرو</Button>;
}
