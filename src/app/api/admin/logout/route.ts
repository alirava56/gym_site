import { ADMIN_COOKIE, clearAdminCookie, isSameOrigin } from "@/server/security/auth";
import { revokeAdminSession } from "@/server/security/admin";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";


export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "درخواست نامعتبر است." }, { status: 403 });
  try { await revokeAdminSession(request.cookies.get(ADMIN_COOKIE)?.value); }
  catch { return NextResponse.json({ message: "خروج انجام نشد؛ دوباره تلاش کنید." }, { status: 503 }); }
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  clearAdminCookie(response);
  return response;
}
