import React, { useEffect, useState } from "react";
import { 
  X, 
  Search, 
  Download, 
  Copy, 
  Trash2, 
  LogOut, 
  Check, 
  Users, 
  TrendingUp, 
  ClipboardList, 
  Briefcase
} from "lucide-react";
import StyledSelect from "./StyledSelect";
import { ApprovedIcon } from "@/components/shared/approved-icon";
import AdminAccountSettings, { type AdminCredentialsInput } from "./AdminAccountSettings";

const Dumbbell = ({ className }: { className?: string }) => <ApprovedIcon icon="advancedEquipment" variant="feature" className={className} />;

interface Booking {
  id: string;
  trainerName: string;
  date: string;
  timeSlot: string;
  price: string;
  status: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
}

interface Subscription {
  planId: string;
  planName: string;
  duration: string;
  price: string;
  fullName: string;
  phone: string;
  visitDate: string;
  referenceCode: string;
  status: string;
  createdAt: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLogin: (e: React.FormEvent) => Promise<void>;
  onLogout: () => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  subscriptions: Subscription[];
  bookings: Booking[];
  isLoading: boolean;
  isCheckingSession: boolean;
  onChangeCredentials: (input: AdminCredentialsInput) => Promise<boolean>;
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onUpdateSubscriptionStatus: (ref: string, status: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onDeleteSubscription: (refCode: string) => Promise<void>;
  showToast: (msg: string) => void;
}

const subscriptionStatusOptions = [
  { value: "new", label: "در انتظار تأیید حضوری" },
  { value: "contacted", label: "تماس گرفته شد - در حال هماهنگی" },
  { value: "completed", label: "عضو شده رسمی باشگاه" },
  { value: "cancelled", label: "لغو شده / عدم پاسخگویی" }
];

const bookingStatusOptions = [
  { value: "active", label: "تأیید شده و رزرو" },
  { value: "completed", label: "کلاس برگزار شده" },
  { value: "cancelled", label: "لغو شده و کنسلی" }
];

export default function AdminPanel({
  isOpen,
  onClose,
  isLoggedIn,
  onLogin,
  onLogout,
  username,
  setUsername,
  password,
  setPassword,
  subscriptions,
  bookings,
  isLoading,
  isCheckingSession,
  onChangeCredentials,
  onUpdateBookingStatus,
  onUpdateSubscriptionStatus,
  onDeleteBooking,
  onDeleteSubscription,
  showToast
}: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "subscriptions" | "bookings">("all");
  const [copyingIndex, setCopyingIndex] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Search filter implementation
  const filteredSubscriptions = subscriptions.filter(sub => {
    const term = searchQuery.toLowerCase();
    return (
      sub.fullName.toLowerCase().includes(term) ||
      sub.phone.includes(term) ||
      sub.referenceCode.toLowerCase().includes(term) ||
      sub.planName.toLowerCase().includes(term)
    );
  });

  const filteredBookings = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      (b.customerName || "").toLowerCase().includes(term) ||
      (b.customerPhone || "").includes(term) ||
      b.trainerName.toLowerCase().includes(term) ||
      b.id.toLowerCase().includes(term)
    );
  });

  // Calculate metrics
  const totalSubs = subscriptions.length;
  const totalBookings = bookings.length;
  
  const escapeCsvCell = (value: unknown) => {
    const raw = String(value ?? "").replace(/"/g, '""');
    // Prevent spreadsheet formula injection when operators open exports in Excel/Sheets.
    const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return `"${safe}"`;
  };

  const exportToCSV = () => {
    try {
      const rows: string[] = ["\uFEFF"];

      if (activeFilter === "all" || activeFilter === "subscriptions") {
        rows.push("--- پیش‌ثبت‌نام‌های عضویت باشگاه ---");
        rows.push("کد دعوت,نام کامل,تلفن همراه,پلن انتخابی,مدت,شهریه,تاریخ بازدید,وضعیت,تاریخ ثبت");
        subscriptions.forEach((sub) => {
          rows.push([sub.referenceCode, sub.fullName, sub.phone, sub.planName, sub.duration, sub.price, sub.visitDate, sub.status, sub.createdAt].map(escapeCsvCell).join(","));
        });
        rows.push("");
      }

      if (activeFilter === "all" || activeFilter === "bookings") {
        rows.push("--- رزروهای کلاس خصوصی مربیان ---");
        rows.push("کد رزرو,نام ورزشکار,تلفن همراه,مربی انتخابی,تاریخ جلسه,ساعت جلسه,شهریه کلاس,وضعیت,تاریخ رزرو");
        bookings.forEach((booking) => {
          rows.push([booking.id, booking.customerName || "-", booking.customerPhone || "-", booking.trainerName, booking.date, booking.timeSlot, booking.price, booking.status, booking.createdAt].map(escapeCsvCell).join(","));
        });
      }

      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CRM_Export_ShabeGhahremanan_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("خروجی CSV باشگاه برای CRM با موفقیت دانلود شد.");
    } catch (error) {
      console.error(error);
      showToast("خطا در ایجاد خروجی CSV.");
    }
  };

  const copyRowToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyingIndex(id);
      showToast("اطلاعات کپی شد؛ آماده انتقال به CRM باشگاه.");
      setTimeout(() => setCopyingIndex(null), 1500);
    } catch (error) {
      console.error(error);
      showToast("کپی اطلاعات توسط مرورگر مسدود شد.");
    }
  };

  return (
    <div
      id="admin-panel-overlay"
      className={
        isLoggedIn
          ? "fixed inset-0 bg-[#0f1113] z-50 overflow-hidden overscroll-contain"
          : "fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-hidden overscroll-contain flex items-center justify-center p-4"
      }
    >
      <div
        className={
          isLoggedIn
            ? "bg-[#0f1113] w-full h-dvh min-h-0 flex flex-col overflow-hidden"
            : "bg-[#111315] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[calc(100dvh-2rem)]"
        }
      >
        
        {/* HEADER */}
        <div className={`border-b border-white/10 flex justify-between items-center bg-[#15181b] ${
          isLoggedIn ? "px-5 md:px-8 py-4 shrink-0" : "px-6 py-4"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg flex items-center justify-center text-[#d4af37]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">پنل مدیریت اختصاصی و یکپارچه CRM</h2>
              <p className="text-white/40 text-xs">سامانه رصد، مدیریت وضعیت و خروجی داده‌های باشگاه شب قهرمانان</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="بازگشت به سایت"
            className={`hover:bg-white/5 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all ${
              isLoggedIn ? "w-auto h-10 px-3 gap-2 rounded-xl border border-white/10" : "w-10 h-10"
            }`}
          >
            <X className="w-6 h-6" />
            {isLoggedIn && <span className="hidden md:inline text-xs font-bold">بازگشت به سایت</span>}
          </button>
        </div>

        {/* CONTENT */}
        <div tabIndex={0} aria-label="محتوای پنل مدیریت" className={`min-h-0 flex-1 overflow-y-auto overscroll-contain text-right ${
          isLoggedIn ? "p-4 md:p-6 lg:p-8" : "p-6"
        }`} dir="rtl">
          {isCheckingSession ? <p role="status" className="py-16 text-center text-white/70">در حال بررسی ورود شما…</p> : !isLoggedIn ? (
            /* LOGIN SCREEN */
            <div className="max-w-md mx-auto py-12">
              <div className="text-center mb-8">
                <Dumbbell className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">ورود به سامانه مدیریت CRM</h3>
                <p className="text-white/50 text-xs">لطفاً اطلاعات هویتی و امنیتی خود را برای دسترسی به خروجی‌ها وارد کنید.</p>
              </div>

              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-xs mb-2 font-bold">نام کاربری ادمین</label>
                  <input 
                    type="text" 
                    autoComplete="username"
                    required
                    maxLength={64}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری مدیریت"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-xs mb-2 font-bold">رمز عبور امنیتی</label>
                  <input 
                    type="password" 
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#d4af37] hover:bg-[#bfa032] text-black font-bold py-3.5 px-6 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isLoading ? "در حال اعتبارسنجی..." : "ورود امن به پنل مدیریت"}
                </button>
              </form>
            </div>
          ) : (
            /* CRM DASHBOARD */
            <div className="space-y-6">
              <AdminAccountSettings key={username} username={username} onSave={onChangeCredentials} />
              
              {/* METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">کل پیش‌ثبت‌نام‌های فعال</span>
                    <span className="text-2xl font-black text-white font-mono">{totalSubs} نفر</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">کل رزروهای مربی خصوصی</span>
                    <span className="text-2xl font-black text-white font-mono">{totalBookings} جلسه</span>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">نیاز به تماس و پیگیری CRM</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {subscriptions.filter(s => s.status === "new" || s.status === "contacted").length} پرونده
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">تراکنش‌های بالقوه مربیان</span>
                    <span className="text-xl font-bold text-white font-mono">بررسی فعال</span>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* CONTROL BAR (Search, Filters, Export) */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#15181b] p-4 border border-white/10 rounded-xl">
                
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در نام، شماره یا کد پیگیری..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-white placeholder-white/30 text-xs outline-none focus:border-[#d4af37] transition-all"
                  />
                  <Search className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-black/30 rounded-lg border border-white/5 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveFilter("all")}
                    className={`flex-1 md:flex-none text-xs px-4 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeFilter === "all" ? "bg-[#d4af37] text-black" : "text-white/60 hover:text-white"}`}
                  >
                    همه خروجی‌ها
                  </button>
                  <button 
                    onClick={() => setActiveFilter("subscriptions")}
                    className={`flex-1 md:flex-none text-xs px-4 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeFilter === "subscriptions" ? "bg-[#d4af37] text-black" : "text-white/60 hover:text-white"}`}
                  >
                    پیش‌ثبت‌نام‌ها ({totalSubs})
                  </button>
                  <button 
                    onClick={() => setActiveFilter("bookings")}
                    className={`flex-1 md:flex-none text-xs px-4 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeFilter === "bookings" ? "bg-[#d4af37] text-black" : "text-white/60 hover:text-white"}`}
                  >
                    رزروهای مربی خصوصی ({totalBookings})
                  </button>
                </div>

                {/* Export & Logout Actions */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={exportToCSV}
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    <Download className="w-4 h-4" />
                    خروجی CRM (CSV)
                  </button>

                  <button 
                    onClick={onLogout}
                    className="flex-1 md:flex-none bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-white/80 hover:text-rose-400 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج از حساب مدیر
                  </button>
                </div>
              </div>

              {/* DATA SECTION */}
              <div className="space-y-6">

                {/* 1. SUBSCRIPTIONS TABLE */}
                {(activeFilter === "all" || activeFilter === "subscriptions") && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-[#15181b] border-b border-white/10 px-4 py-3 flex justify-between items-center">
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#d4af37]" />
                        پیش‌ثبت‌نام‌های عضویت حضوری باشگاه
                      </h4>
                      <span className="text-[10px] text-white/40">آماده ورود به CRM باشگاه بدنسازی</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right whitespace-nowrap">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-white/60">
                          <tr>
                            <th className="px-4 py-3">کد دعوت</th>
                            <th className="px-4 py-3">نام کامل</th>
                            <th className="px-4 py-3">تلفن همراه</th>
                            <th className="px-4 py-3">پلن عضویت</th>
                            <th className="px-4 py-3">مدت</th>
                            <th className="px-4 py-3">شهریه پلن</th>
                            <th className="px-4 py-3">تاریخ اولین بازدید</th>
                            <th className="px-4 py-3">وضعیت CRM</th>
                            <th className="px-4 py-3 text-center">عملیات انتقال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {filteredSubscriptions.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-white/30 text-xs">
                                هیچ پیش‌ثبت‌نامی یافت نشد یا ثبت نشده است.
                              </td>
                            </tr>
                          ) : (
                            filteredSubscriptions.map((sub, idx) => {
                              const copyText = `کد: ${sub.referenceCode} | نام: ${sub.fullName} | تلفن: ${sub.phone} | پلن: ${sub.planName} | تاریخ بازدید: ${sub.visitDate}`;
                              return (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-4 py-3 font-mono text-[#d4af37] font-semibold">{sub.referenceCode}</td>
                                  <td className="px-4 py-3 font-bold">{sub.fullName}</td>
                                  <td className="px-4 py-3 font-mono">{sub.phone}</td>
                                  <td className="px-4 py-3 text-white">{sub.planName}</td>
                                  <td className="px-4 py-3">{sub.duration}</td>
                                  <td className="px-4 py-3 font-mono">{sub.price} تومان</td>
                                  <td className="px-4 py-3 font-medium text-amber-300">{sub.visitDate}</td>
                                  <td className="px-4 py-3">
                                    <StyledSelect
                                      value={sub.status}
                                      onChange={(value) => onUpdateSubscriptionStatus(sub.referenceCode, value)}
                                      options={subscriptionStatusOptions}
                                      className="min-w-56"
                                      buttonClassName="min-h-9 px-3 py-2 text-[11px]"
                                      optionClassName="py-2.5"
                                    />
                                  </td>
                                  <td className="px-4 py-3 flex justify-center items-center gap-2">
                                    <button 
                                      onClick={() => copyRowToClipboard(copyText, sub.referenceCode)}
                                      className="w-8 h-8 hover:bg-white/5 rounded-lg flex items-center justify-center text-white/50 hover:text-[#d4af37] transition-all cursor-pointer"
                                      title="کپی سریع برای CRM"
                                    >
                                      {copyingIndex === sub.referenceCode ? (
                                        <Check className="w-4 h-4 text-[#d4af37]" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => onDeleteSubscription(sub.referenceCode)}
                                      className="w-8 h-8 hover:bg-rose-500/10 rounded-lg flex items-center justify-center text-white/30 hover:text-rose-400 transition-all cursor-pointer"
                                      title="حذف دائمی از لیست"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. PRIVATE TRAINER BOOKINGS TABLE */}
                {(activeFilter === "all" || activeFilter === "bookings") && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-[#15181b] border-b border-white/10 px-4 py-3 flex justify-between items-center">
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-[#d4af37]" />
                        رزروهای جلسات تمرین خصوصی با مربیان ارشد
                      </h4>
                      <span className="text-[10px] text-white/40">برنامه ریزی جلسات و کلاس مربیان</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right whitespace-nowrap">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-white/60">
                          <tr>
                            <th className="px-4 py-3">کد رزرو</th>
                            <th className="px-4 py-3">نام کامل ورزشکار</th>
                            <th className="px-4 py-3">تلفن همراه</th>
                            <th className="px-4 py-3">مربی خصوصی انتخابی</th>
                            <th className="px-4 py-3">تاریخ جلسه</th>
                            <th className="px-4 py-3">ساعت رزرو شده</th>
                            <th className="px-4 py-3">شهریه کلاس</th>
                            <th className="px-4 py-3">وضعیت رزرو</th>
                            <th className="px-4 py-3 text-center">عملیات انتقال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-white/30 text-xs">
                                هیچ کلاس رزرو شده‌ای یافت نشد.
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.map((book, idx) => {
                              const copyText = `کد رزرو: ${book.id} | مربی: ${book.trainerName} | ورزشکار: ${book.customerName || "-"} | تلفن: ${book.customerPhone || "-"} | تاریخ: ${book.date} ${book.timeSlot}`;
                              return (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-4 py-3 font-mono text-[#d4af37] font-semibold">{book.id}</td>
                                  <td className="px-4 py-3 font-bold">{book.customerName || "-"}</td>
                                  <td className="px-4 py-3 font-mono">{book.customerPhone || "-"}</td>
                                  <td className="px-4 py-3 text-white font-semibold flex items-center gap-1.5 py-4">
                                    <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></span>
                                    {book.trainerName}
                                  </td>
                                  <td className="px-4 py-3 text-blue-300 font-semibold">{book.date}</td>
                                  <td className="px-4 py-3 text-white/90 font-mono">{book.timeSlot}</td>
                                  <td className="px-4 py-3 font-mono">{book.price} تومان</td>
                                  <td className="px-4 py-3">
                                    <StyledSelect
                                      value={book.status}
                                      onChange={(value) => onUpdateBookingStatus(book.id, value)}
                                      options={bookingStatusOptions}
                                      className="min-w-44"
                                      buttonClassName="min-h-9 px-3 py-2 text-[11px]"
                                      optionClassName="py-2.5"
                                    />
                                  </td>
                                  <td className="px-4 py-3 flex justify-center items-center gap-2">
                                    <button 
                                      onClick={() => copyRowToClipboard(copyText, book.id)}
                                      className="w-8 h-8 hover:bg-white/5 rounded-lg flex items-center justify-center text-white/50 hover:text-[#d4af37] transition-all cursor-pointer"
                                      title="کپی مشخصات مربی و ورزشکار"
                                    >
                                      {copyingIndex === book.id ? (
                                        <Check className="w-4 h-4 text-[#d4af37]" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => onDeleteBooking(book.id)}
                                      className="w-8 h-8 hover:bg-rose-500/10 rounded-lg flex items-center justify-center text-white/30 hover:text-rose-400 transition-all cursor-pointer"
                                      title="حذف جلسه"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`border-t border-white/10 bg-[#15181b] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 ${
          isLoggedIn ? "px-5 md:px-8 py-3 shrink-0" : "px-6 py-4"
        }`}>
          <div>ورود به سامانه مدیریت ادمین شامل فیلتر و هماهنگ‌سازی آنی با دیتابیس CRM بدنسازی است.</div>
          <div className="font-mono text-[10px]">CRM CORE VERSION 2.8.5 - SECURITY ENFORCED</div>
        </div>

      </div>
    </div>
  );
}
