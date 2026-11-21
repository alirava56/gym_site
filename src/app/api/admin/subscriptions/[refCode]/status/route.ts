import { updateRegistrationStatus } from "@/server/database/registration-requests";
import { isRegistrationStatus } from "@/server/domain/gym";
import { isAdminRequest } from "@/server/security/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ refCode: string }> }) {
  if (!await isAdminRequest(request)) return NextResponse.json({ message: "عدم دسترسی مجاز" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isRegistrationStatus(body?.status)) return NextResponse.json({ message: "وضعیت پیش‌ثبت‌نام معتبر نیست." }, { status: 400 });
  const { refCode } = await context.params;

  if (!/^[0-9a-f-]{36}$/i.test(refCode)) return NextResponse.json({ message: "پیش‌ثبت‌نام یافت نشد." }, { status: 404 });
  const subscription = await updateRegistrationStatus(refCode, body.status);
  if (!subscription) return NextResponse.json({ message: "پیش‌ثبت‌نام یافت نشد." }, { status: 404 });
  return NextResponse.json({ success: true, subscription });
}
