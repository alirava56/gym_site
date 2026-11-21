CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id TEXT NOT NULL, full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  phone VARCHAR(11) NOT NULL CHECK (phone ~ '^09[0-9]{9}$'), visit_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','completed','cancelled')), owner_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), cancelled_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trainer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), trainer_id TEXT NOT NULL, booking_date DATE NOT NULL, slot_key TEXT NOT NULL,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100), customer_phone VARCHAR(11) NOT NULL CHECK (customer_phone ~ '^09[0-9]{9}$'),
  price_snapshot BIGINT NOT NULL CHECK (price_snapshot >= 0), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')), owner_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), cancelled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS registration_requests_owner_idx ON registration_requests(owner_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS trainer_bookings_owner_idx ON trainer_bookings(owner_hash, created_at DESC);
