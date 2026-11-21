import { updateBookingStatus } from "@/server/database/bookings";
import { isAdminRequest } from "@/server/security/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(request)) return NextResponse.json({ message: "عدم دسترسی مجاز" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "رزرو یافت نشد." }, { status: 404 });
  const booking = await updateBookingStatus(id, "cancelled");
  if (!booking) return NextResponse.json({ message: "رزرو یافت نشد." }, { status: 404 });
  return NextResponse.json({ success: true });
}
