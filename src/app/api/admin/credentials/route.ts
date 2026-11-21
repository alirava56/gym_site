import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, attachAdminCookie, isSameOrigin, isAdminRequest } from "@/server/security/auth";
import { changeAdminCredentials } from "@/server/security/admin";
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    if (!await isAdminRequest(request)) return NextResponse.json({ message: "لطفاً دوباره وارد حساب شوید." }, { status: 401 });
    const limit = consumeRateLimit(`admin-credentials:${getClientIp(request)}`, 5, 15 * 60_000);
    if (!limit.allowed) return NextResponse.json({ message: "تعداد تلاش‌ها زیاد است. بعداً دوباره تلاش کنید." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    const body = await request.json().catch(() => null);
    if (typeof body?.newPassword !== "string" || body.newPassword !== body?.confirmPassword) {
      return NextResponse.json({ message: "رمز جدید و تکرار آن یکسان نیستند." }, { status: 400 });
    }
    const result = await changeAdminCredentials(request.cookies.get(ADMIN_COOKIE)?.value, body?.currentPassword, body?.username, body?.newPassword);
    if ("error" in result) {
      const status = result.error === "UNAUTHORIZED" ? 401 : result.error === "WRONG_PASSWORD" ? 403 : 400;
      const message = result.error === "WRONG_PASSWORD" ? "رمز فعلی اشتباه است." : result.error === "UNAUTHORIZED" ? "لطفاً دوباره وارد حساب شوید." : "نام کاربری باید ۳ تا ۶۴ حرف، عدد یا . _ - باشد و رمز جدید حداقل ۱۲ و حداکثر ۱۲۸ نویسه داشته باشد.";
      return NextResponse.json({ message }, { status });
    }
    const response = NextResponse.json({ success: true, username: result.username }, { headers: { "Cache-Control": "no-store" } });
    attachAdminCookie(response, result.token);
    return response;
  } catch (error) {
    console.error("Admin credentials update unavailable", error);
    return NextResponse.json({ message: "تغییر اطلاعات انجام نشد؛ دوباره تلاش کنید." }, { status: 503 });
  }
}
