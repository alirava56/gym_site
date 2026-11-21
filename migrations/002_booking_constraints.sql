CREATE UNIQUE INDEX IF NOT EXISTS trainer_bookings_active_slot_uidx ON trainer_bookings(trainer_id, booking_date, slot_key) WHERE status <> 'cancelled';
