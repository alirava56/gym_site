import { ExperienceProvider } from "@/components/experience/experience-provider";
import { BookingDialog } from "@/components/experience/booking-dialog";
import { TourPortal } from "@/components/experience/tour-portal";
import { ViewSwitcher } from "@/components/experience/view-switcher";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { ProgramsSection } from "@/components/sections/programs-section";
import { MembershipSection } from "@/components/sections/membership-section";
import { CoachesSection } from "@/components/sections/coaches-section";
import { FaqSection } from "@/components/sections/faq-section";
import { BlogPreviewSection } from "@/components/sections/blog-preview-section";
import { absoluteUrl } from "@/shared/site";

export const metadata = { alternates: { canonical: absoluteUrl("/") } };

export default function HomePage() {
  const landing = <main><HeroSection /><ProgramsSection /><MembershipSection /><CoachesSection /><BlogPreviewSection /><FaqSection /></main>;
  return <ExperienceProvider><SiteHeader /><ViewSwitcher landing={landing} /><SiteFooter /><BookingDialog /><TourPortal /></ExperienceProvider>;
}
