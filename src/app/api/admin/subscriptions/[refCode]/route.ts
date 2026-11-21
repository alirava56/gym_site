import { updateRegistrationStatus } from "@/server/database/registration-requests";
import { isAdminRequest } from "@/server/security/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ refCode: string }> }) {
  if (!await isAdminRequest(request)) return NextResponse.json({ message: "عدم دسترسی مجاز" }, { status: 401 });
  const { refCode } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(refCode)) return NextResponse.json({ message: "پیش‌ثبت‌نام یافت نشد." }, { status: 404 });
  const record = await updateRegistrationStatus(refCode, "cancelled");
  if (!record) return NextResponse.json({ message: "پیش‌ثبت‌نام یافت نشد." }, { status: 404 });
  return NextResponse.json({ success: true });
}
