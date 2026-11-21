import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit";
import { attachAdminCookie, isSameOrigin } from "@/server/security/auth";
import { loginAdmin } from "@/server/security/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "درخواست نامعتبر است." }, { status: 403 });
  const limit = consumeRateLimit(`admin-login:${getClientIp(request)}`, 5, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ message: "تلاش‌های ورود بیش از حد مجاز است. بعداً دوباره تلاش کنید." }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) }
    });
  }

  const body = await request.json().catch(() => null);
  try {
  const session = await loginAdmin(body?.username, body?.password);
  if (!session) {
    return NextResponse.json({ message: "نام کاربری یا کلمه عبور اشتباه است." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, username: session.username }, { headers: { "Cache-Control": "no-store" } });
  attachAdminCookie(response, session.token);
  return response;
  } catch (error) {
    console.error("Admin login unavailable", error);
    return NextResponse.json({ message: "سرویس ورود موقتاً در دسترس نیست." }, { status: 503 });
  }
}
