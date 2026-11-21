import { ExperienceProvider } from "@/components/experience/experience-provider";
import { ViewSwitcher } from "@/components/experience/view-switcher";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <ExperienceProvider>
    <a className="blog-skip-link" href="#blog-content">رفتن به محتوای اصلی</a>
    <SiteHeader />
    <ViewSwitcher landing={children} />
    <SiteFooter />
  </ExperienceProvider>;
}
