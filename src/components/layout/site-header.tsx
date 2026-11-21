"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavbarBrandLogo } from "@/components/shared/brand-logo";
import { ApprovedIcon } from "@/components/shared/approved-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useExperience } from "@/components/experience/experience-provider";

const links = [
  ["صفحه اصلی", "hero-section"], ["برنامه‌ها", "programs-section"], ["پلن‌های عضویت", "plans-section"],
  ["مربیان", "trainers-section"], ["باشگاه", "tour-section"], ["مجله ورزشی", "blog"], ["تماس با ما", "footer"],
] as const;

const userPanelLabel = "پنل کاربری";

export function SiteHeader() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");
  const { scrollTo, showDashboard, hasActivity, isTourOpen, setTourOpen } = useExperience();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<(typeof links)[number][1]>("hero-section");
  const visibleSections = useRef(new Map<string, IntersectionObserverEntry>());

  useEffect(() => {
    if (isTourOpen) {
      setActiveId("tour-section");
      return;
    }

    if (isBlog) return;
    const sectionIds = links.map(([, id]) => id).filter((id) => id !== "tour-section" && id !== "blog");
    const intersections = visibleSections.current;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) intersections.set(entry.target.id, entry);
        else intersections.delete(entry.target.id);
      });
      const anchor = window.innerHeight * 0.2;
      const current = [...intersections.values()]
        .sort((a, b) => Math.abs(a.boundingClientRect.top - anchor) - Math.abs(b.boundingClientRect.top - anchor))[0];
      if (current) setActiveId(current.target.id as (typeof links)[number][1]);
    }, { rootMargin: "-15% 0px -15% 0px", threshold: 0 });

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => {
      observer.disconnect();
      intersections.clear();
    };
  }, [isTourOpen, isBlog]);

  const go = (id: string) => {
    setOpen(false);
    setActiveId(id as (typeof links)[number][1]);
    if (id === "tour-section") setTourOpen(true);
    else scrollTo(id);
  };

  const navItemClass = (id: (typeof links)[number][1], mobile = false) => {
    const active = isBlog ? id === "blog" : activeId === id;
    return mobile
      ? `min-h-12 border-b border-brand-line px-2 py-4 text-right text-sm font-bold transition-colors hover:text-brand-gold focus-visible:text-brand-gold ${active ? "text-brand-gold" : "text-brand-muted"}`
      : `relative inline-flex items-center px-2.5 text-[11px] font-bold transition-colors hover:text-brand-gold focus-visible:text-brand-gold lg:px-4 lg:text-xs ${active ? "text-brand-gold after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-brand-gold" : "text-brand-muted"}`;
  };

  const navigationLinks = (mobile = false) => links.map(([label, id]) => <Link
    key={id}
    href={id === "blog" ? "/blog" : `/#${id}`}
    onClick={(event) => {
      setOpen(false);
      if (id !== "blog" && pathname === "/" && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        go(id);
      }
    }}
    aria-current={isBlog ? (id === "blog" ? "location" : undefined) : (activeId === id ? "location" : undefined)}
    className={navItemClass(id, mobile)}
  >{label}</Link>);

  const homeLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (pathname === "/" && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      go("hero-section");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-brand-line bg-brand-bg/94 backdrop-blur-xl">
      <div className="site-container flex h-[4.5rem] flex-row-reverse items-center justify-between min-[1024px]:hidden">
        <Link href="/" onClick={homeLinkClick} aria-label="شب قهرمانان - صفحه اصلی" className="rounded-md"><NavbarBrandLogo /></Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="ghost" size="sm" className="px-2" aria-label="بازکردن منو"><Menu className="size-7" /></Button></DialogTrigger>
          <DialogContent className="left-auto right-0 top-0 h-dvh w-[min(84vw,22rem)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-l-2xl border-y-0 border-r-0 p-0" showClose={false}>
            <div className="flex h-[4.5rem] items-center justify-between border-b border-brand-line px-5"><NavbarBrandLogo /><button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-lg text-brand-muted" aria-label="بستن منو"><X /></button></div>
            <DialogTitle className="sr-only">منوی اصلی</DialogTitle>
            <nav aria-label="ناوبری اصلی" className="flex flex-col p-4">{navigationLinks(true)}</nav>
            <Button variant="outline" onClick={() => { setOpen(false); showDashboard(); }} className="mx-6 mt-4 w-[calc(100%_-_3rem)]"><ApprovedIcon icon="account" variant="account" /> {userPanelLabel}{hasActivity && <span className="size-2 rounded-full bg-brand-gold" />}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="site-container hidden h-16 items-center justify-between min-[1024px]:flex lg:h-[4.6rem]">
        <Link href="/" onClick={homeLinkClick} aria-label="شب قهرمانان - صفحه اصلی" className="rounded-md"><NavbarBrandLogo /></Link>
        <nav aria-label="ناوبری اصلی" className="flex items-stretch self-stretch">
          {navigationLinks()}
        </nav>
        <Button variant="outline" size="sm" onClick={showDashboard} className="relative gap-1.5"><ApprovedIcon icon="account" variant="account" /> {userPanelLabel}{hasActivity && <span className="absolute -left-1 -top-1 size-2 rounded-full bg-brand-gold" />}</Button>
      </div>
    </header>
  );
}
