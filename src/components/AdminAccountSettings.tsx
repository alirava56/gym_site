import { useState, type FormEvent } from "react";

export interface AdminCredentialsInput {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminAccountSettings({ username, onSave }: {
  username: string;
  onSave: (input: AdminCredentialsInput) => Promise<boolean>;
}) {
  const [name, setName] = useState(username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (newPassword !== confirmPassword) { setError("رمز جدید و تکرار آن یکسان نیستند."); return; }
    setSaving(true);
    try {
      if (await onSave({ username: name.trim(), currentPassword, newPassword, confirmPassword })) {
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      }
    } finally { setSaving(false); }
  };
  const inputClass = "w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#d4af37] disabled:opacity-50";
  return (
    <details className="rounded-xl border border-white/10 bg-[#15181b] p-4 md:p-6">
      <summary className="cursor-pointer font-bold text-[#d4af37]">تنظیمات حساب مدیر</summary>
      <p className="my-4 text-sm leading-7 text-white/60">ورود شما تا ۳۰ روز در این مرورگر حفظ می‌شود. برای تغییر اطلاعات، رمز فعلی را وارد کنید. پس از ذخیره، ورودهای قبلی باطل می‌شوند و در این مرورگر وارد می‌مانید.</p>
      <form onSubmit={submit} className="grid max-w-3xl gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-white/80">نام کاربری جدید
          <input aria-label="نام کاربری جدید" autoComplete="username" dir="auto" required minLength={3} maxLength={64} disabled={saving} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </label>
        <label className="space-y-2 text-sm text-white/80">رمز عبور فعلی
          <input aria-label="رمز عبور فعلی" type="password" autoComplete="current-password" required maxLength={128} disabled={saving} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} />
        </label>
        <label className="space-y-2 text-sm text-white/80">رمز عبور جدید (حداقل ۱۲ نویسه)
          <input aria-label="رمز عبور جدید" type="password" autoComplete="new-password" minLength={12} maxLength={128} disabled={saving} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
        </label>
        <label className="space-y-2 text-sm text-white/80">تکرار رمز عبور جدید
          <input aria-label="تکرار رمز عبور جدید" type="password" autoComplete="new-password" required={Boolean(newPassword)} maxLength={128} disabled={saving} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
        </label>
        <p className="text-xs text-white/50 md:col-span-2">اگر فقط نام کاربری را تغییر می‌دهید، دو کادر رمز جدید را خالی بگذارید.</p>
        {error && <p role="alert" className="text-sm text-rose-300 md:col-span-2">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-xl bg-[#d4af37] px-5 py-3 font-bold text-black disabled:opacity-50">{saving ? "در حال ذخیره…" : "ذخیره اطلاعات ورود"}</button>
      </form>
    </details>
  );
}
