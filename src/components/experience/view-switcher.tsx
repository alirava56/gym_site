"use client";

import type { ReactNode } from "react";
import { useExperience } from "@/components/experience/experience-provider";
import { DashboardView } from "@/components/experience/dashboard-view";

export function ViewSwitcher({ landing }: { landing: ReactNode }) {
  const { view } = useExperience();
  return view === "landing" ? landing : <DashboardView />;
}
