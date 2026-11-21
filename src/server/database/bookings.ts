import "server-only";
import { randomUUID } from "node:crypto";
import { TRAINERS, type BookingStatus, type TrainerId } from "@/server/domain/gym";
import { query } from "@/server/database/pool";

type BookingRow = { id: string; trainer_id: TrainerId; booking_date: string | Date; slot_key: string; customer_name: string; customer_phone: string; price_snapshot: string | number; status: BookingStatus; created_at: Date };
const dateValue = (value: string | Date) => typeof value === "string" ? value.slice(0,10) : value.toISOString().slice(0,10);
export const bookingDto = (row: BookingRow) => ({ id: row.id, trainerId: row.trainer_id, trainerName: TRAINERS[row.trainer_id].name, date: dateValue(row.booking_date), dateLabel: new Intl.DateTimeFormat("fa-IR", { calendar: "persian", weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date(`${dateValue(row.booking_date)}T12:00:00Z`)), timeSlot: row.slot_key, price: `${Number(row.price_snapshot).toLocaleString("fa-IR")} تومان`, status: row.status, createdAt: row.created_at.toISOString(), customerName: row.customer_name, customerPhone: row.customer_phone });
const returning = "id, trainer_id, booking_date::text, slot_key, customer_name, customer_phone, price_snapshot, status, created_at";
export const createBooking = async (input: { trainerId: TrainerId; date: string; slotKey: string; customerName: string; customerPhone: string; ownerHash: string }) => {
  const result = await query<BookingRow>(`INSERT INTO trainer_bookings (id, trainer_id, booking_date, slot_key, customer_name, customer_phone, price_snapshot, owner_hash) VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8) RETURNING ${returning}`, [randomUUID(), input.trainerId, input.date, input.slotKey, input.customerName, input.customerPhone, TRAINERS[input.trainerId].priceRaw, input.ownerHash]);
  return bookingDto(result.rows[0]);
};
export const listOwnerBookings = async (ownerHash: string) => (await query<BookingRow>(`SELECT ${returning} FROM trainer_bookings WHERE owner_hash=$1 ORDER BY created_at DESC`, [ownerHash])).rows.map(bookingDto);
export const listAdminBookings = async () => (await query<BookingRow>(`SELECT ${returning} FROM trainer_bookings ORDER BY created_at DESC`)).rows.map(bookingDto);
export const listUnavailableSlots = async (trainerId: TrainerId, date: string) => (await query<{slot_key:string}>("SELECT slot_key FROM trainer_bookings WHERE trainer_id=$1 AND booking_date=$2::date AND status <> 'cancelled'", [trainerId,date])).rows.map((r) => r.slot_key);
export const cancelOwnerBooking = async (id: string, ownerHash: string) => (await query("UPDATE trainer_bookings SET status='cancelled', cancelled_at=NOW(), updated_at=NOW() WHERE id::text=$1 AND owner_hash=$2 AND status <> 'cancelled'", [id,ownerHash])).rowCount === 1;
export const updateBookingStatus = async (id: string, status: BookingStatus) => (await query<BookingRow>(`UPDATE trainer_bookings SET status=$2, cancelled_at=CASE WHEN $2='cancelled' THEN COALESCE(cancelled_at,NOW()) ELSE NULL END, updated_at=NOW() WHERE id::text=$1 RETURNING ${returning}`, [id,status])).rows[0] ?? null;
