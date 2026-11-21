"use client";

import dynamic from "next/dynamic";
import { useExperience } from "@/components/experience/experience-provider";

const VirtualTour = dynamic(() => import("@/components/VirtualTour"), { ssr: false });

export function TourPortal() {
  const { isTourOpen, setTourOpen } = useExperience();
  if (!isTourOpen) return <span id="tour-section" className="sr-only" />;
  return <div id="tour-section"><VirtualTour isFullscreen={isTourOpen} onFullscreenChange={setTourOpen} /></div>;
}
