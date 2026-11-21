"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AdminCredentialsInput } from "@/components/AdminAccountSettings";
import type { Trainer } from "@/shared/catalog";
import type { Booking, BookingInput, RegistrationInput, Subscription } from "@/types/gym";

const AdminPanel = dynamic(() => import("@/components/AdminPanel"), { ssr: false });

interface ExperienceContextValue {
  view: "landing" | "dashboard";
  bookings: Booking[];
  subscription: Subscription | null;
  selectedTrainer: Trainer | null;
  isRegistrationOpen: boolean;
  isTourOpen: boolean;
  hasActivity: boolean;
  setTourOpen: (open: boolean) => void;
  showLanding: () => void;
  showDashboard: () => void;
  scrollTo: (id: string) => void;
  selectPlan: (planId: string) => void;
  selectedPlanId: string;
  openBooking: (trainer: Trainer) => void;
  closeBooking: () => void;
  closeRegistration: () => void;
  register: (input: RegistrationInput) => Promise<boolean>;
  bookTrainer: (input: BookingInput) => Promise<"success" | "conflict" | "error">;
  cancelBooking: (id: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  openAdmin: () => void;
  notify: (message: string) => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error("useExperience must be used inside ExperienceProvider");
  return value;
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [selectedPlanId, setSelectedPlanId] = useState("12session");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isRegistrationOpen, setRegistrationOpen] = useState(false);
  const [isTourOpen, setTourOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isAdminOpen, setAdminOpen] = useState(false);
  const [isAdminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSubscriptions, setAdminSubscriptions] = useState<Subscription[]>([]);
  const [adminBookings, setAdminBookings] = useState<Booking[]>([]);
  const [isCrmLoading, setCrmLoading] = useState(false);
  const [isSessionChecking, setSessionChecking] = useState(true);
  const registrationTriggerRef = useRef<HTMLElement | null>(null);
  const bookingTriggerRef = useRef<HTMLElement | null>(null);

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    void fetch("/api/data", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setSubscription(data.subscription ?? null);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = selectedTrainer || isRegistrationOpen || isTourOpen || isAdminOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedTrainer, isRegistrationOpen, isTourOpen, isAdminOpen]);

  const scrollTo = useCallback((id: string) => {
    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    setView("landing");
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }, [router]);

  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const handleHash = () => {
      const id = window.location.hash.slice(1);
      if (id === "dashboard") setView("dashboard");
      else if (id === "tour-section") setTourOpen(true);
      else if (id) {
        setView("landing");
        window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
      }
    };
    const frame = window.requestAnimationFrame(handleHash);
    window.addEventListener("hashchange", handleHash);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("hashchange", handleHash); };
  }, []);

  const selectPlan = useCallback((planId: string) => {
    registrationTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedPlanId(planId);
    setRegistrationOpen(true);
  }, []);

  const closeRegistration = useCallback(() => {
    setRegistrationOpen(false);
    window.requestAnimationFrame(() => registrationTriggerRef.current?.focus());
  }, []);

  const openBooking = useCallback((trainer: Trainer) => {
    bookingTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedTrainer(trainer);
  }, []);

  const closeBooking = useCallback(() => {
    setSelectedTrainer(null);
    window.requestAnimationFrame(() => bookingTriggerRef.current?.focus());
  }, []);

  const register = useCallback(async (input: RegistrationInput) => {
    try {
      const response = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.subscription) { notify(data?.message || "خطا در ثبت پیش‌ثبت‌نام. لطفاً دوباره تلاش کنید."); return false; }
      setSubscription(data.subscription as Subscription);
      setRegistrationOpen(false);
      notify(`درخواست شما ثبت شد. کد پیگیری در پنل کاربری قابل مشاهده است.`);
      setView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    } catch { notify("خطا در ارتباط با سرور. پیش‌ثبت‌نام انجام نشد."); return false; }
  }, [notify]);

  const bookTrainer = useCallback(async (input: BookingInput) => {
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trainerId: input.trainer.id, date: input.date, timeSlot: input.timeSlot, customerName: input.customerName, customerPhone: input.customerPhone }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.booking) { notify(data?.message || "خطا در ثبت رزرو مربی."); return data?.error === "SLOT_ALREADY_BOOKED" ? "conflict" : "error"; }
      setBookings((current) => [data.booking as Booking, ...current]);
      setSelectedTrainer(null);
      setView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      notify(`جلسه تمرین خصوصی با ${input.trainer.name} رزرو شد.`);
      return "success";
    } catch { notify("خطا در ارتباط با سرور. رزرو انجام نشد."); return "error"; }
  }, [notify]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json().catch(() => null); notify(data?.message || "لغو رزرو انجام نشد."); return; }
      setBookings((current) => current.filter((item) => item.id !== id));
      notify("رزرو کلاس خصوصی لغو شد.");
    } catch { notify("خطا در ارتباط با سرور. رزرو لغو نشد."); }
  }, [notify]);

  const cancelSubscription = useCallback(async () => {
    if (!subscription || !window.confirm("آیا از لغو پیش‌ثبت‌نام عضویت مطمئن هستید؟")) return;
    try {
      const response = await fetch("/api/subscription", { method: "DELETE" });
      if (!response.ok) { notify("لغو پیش‌ثبت‌نام انجام نشد."); return; }
      setSubscription(null); notify("پیش‌ثبت‌نام لغو شد.");
    } catch { notify("خطا در ارتباط با سرور. پیش‌ثبت‌نام لغو نشد."); }
  }, [notify, subscription]);

  const fetchCrmData = useCallback(async () => {
    setCrmLoading(true);
    try {
      const response = await fetch("/api/admin/data", { cache: "no-store" });
      if (response.status === 401) { setAdminLoggedIn(false); setAdminBookings([]); setAdminSubscriptions([]); return; }
      if (response.ok) { const data = await response.json(); setAdminLoggedIn(true); setAdminUsername(data.username); setAdminBookings(data.bookings || []); setAdminSubscriptions(data.subscriptions || []); }
      else notify("اطلاعات مدیریت در دسترس نیست؛ دوباره تلاش کنید.");
    } catch { notify("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید."); } finally { setCrmLoading(false); }
  }, [notify]);

  useEffect(() => { if (isAdminOpen) void fetchCrmData().finally(() => setSessionChecking(false)); }, [fetchCrmData, isAdminOpen]);

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setCrmLoading(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: adminUsername, password: adminPassword }) });
      if (!response.ok) { const data = await response.json().catch(() => null); notify(data?.message || "خطا در ورود به پنل."); return; }
      setAdminLoggedIn(true); setAdminPassword(""); notify("ورود به پنل مدیریت موفق بود."); await fetchCrmData();
    } catch { notify("سیستم مدیریت در دسترس نیست."); } finally { setCrmLoading(false); }
  };

  const adminPostStatus = async (kind: "bookings" | "subscriptions", id: string, status: string) => {
    const response = await fetch(`/api/admin/${kind}/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) { notify("وضعیت با موفقیت به‌روزرسانی شد."); await fetchCrmData(); }
  };
  const adminDelete = async (kind: "bookings" | "subscriptions", id: string) => {
    if (!window.confirm("آیا از حذف کامل این مورد مطمئن هستید؟")) return;
    const response = await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    if (response.ok) { notify("مورد انتخابی حذف شد."); await fetchCrmData(); }
  };
  const handleAdminLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) { notify("خروج انجام نشد؛ دوباره تلاش کنید."); return; }
      setAdminLoggedIn(false); setAdminUsername(""); setAdminPassword(""); setAdminBookings([]); setAdminSubscriptions([]);
      notify("از حساب مدیریت خارج شدید.");
    } catch { notify("خروج انجام نشد؛ ارتباط با سرور برقرار نیست."); }
  };
  const handleAdminCredentials = async (input: AdminCredentialsInput) => {
    try {
      const response = await fetch("/api/admin/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) { setAdminLoggedIn(false); setAdminBookings([]); setAdminSubscriptions([]); }
        notify(data?.message || "تغییر اطلاعات انجام نشد."); return false;
      }
      setAdminUsername(data.username); setAdminPassword("");
      notify("اطلاعات ورود ذخیره شد. ورودهای قبلی باطل شدند."); return true;
    } catch { notify("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید."); return false; }
  };

  const value = useMemo<ExperienceContextValue>(() => ({
    view, bookings, subscription, selectedTrainer, isRegistrationOpen, isTourOpen, hasActivity: Boolean(subscription || bookings.length), setTourOpen,
    showLanding: () => setView("landing"), showDashboard: () => { if (window.location.pathname !== "/") { router.push("/#dashboard"); return; } setView("dashboard"); window.scrollTo({ top: 0, behavior: "smooth" }); },
    scrollTo, selectPlan, selectedPlanId, openBooking, closeBooking, closeRegistration, register,
    bookTrainer, cancelBooking, cancelSubscription, openAdmin: () => setAdminOpen(true), notify
  }), [view, bookings, subscription, selectedTrainer, isRegistrationOpen, isTourOpen, scrollTo, selectPlan, selectedPlanId, openBooking, closeBooking, closeRegistration, register, bookTrainer, cancelBooking, cancelSubscription, notify, router]);

  return (
    <ExperienceContext.Provider value={value}>
      {children}
      {toast && <div role="status" aria-live="polite" className="fixed bottom-5 left-5 z-[80] max-w-sm rounded-xl border border-brand-gold-line bg-brand-elevated px-5 py-3 text-sm font-bold text-brand-ink shadow-[var(--shadow-brand)]"><span className="ml-2 inline-block size-2 rounded-full bg-brand-gold" />{toast}</div>}
      <AdminPanel isOpen={isAdminOpen} onClose={() => { setAdminOpen(false); if (window.location.pathname === "/admin") router.push("/"); }} isLoggedIn={isAdminLoggedIn} onLogin={handleAdminLogin} onLogout={handleAdminLogout} username={adminUsername} setUsername={setAdminUsername} password={adminPassword} setPassword={setAdminPassword} subscriptions={adminSubscriptions} bookings={adminBookings} isLoading={isCrmLoading} isCheckingSession={isSessionChecking} onChangeCredentials={handleAdminCredentials} onUpdateBookingStatus={(id, status) => adminPostStatus("bookings", id, status)} onUpdateSubscriptionStatus={(id, status) => adminPostStatus("subscriptions", id, status)} onDeleteBooking={(id) => adminDelete("bookings", id)} onDeleteSubscription={(id) => adminDelete("subscriptions", id)} showToast={notify} />
    </ExperienceContext.Provider>
  );
}
