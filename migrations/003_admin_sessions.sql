CREATE TABLE admin_account (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id SMALLINT NOT NULL REFERENCES admin_account(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX admin_sessions_expiry ON admin_sessions(expires_at);
