import { bookingDto, updateBookingStatus } from "@/server/database/bookings";
import { isBookingStatus } from "@/server/domain/gym";
import { isAdminRequest } from "@/server/security/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(request)) return NextResponse.json({ message: "عدم دسترسی مجاز" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isBookingStatus(body?.status)) return NextResponse.json({ message: "وضعیت رزرو معتبر نیست." }, { status: 400 });
  const { id } = await context.params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "رزرو یافت نشد." }, { status: 404 });
  const row = await updateBookingStatus(id, body.status);
  const booking = row ? bookingDto(row) : null;
  if (!booking) return NextResponse.json({ message: "رزرو یافت نشد." }, { status: 404 });
  return NextResponse.json({ success: true, booking });
}
