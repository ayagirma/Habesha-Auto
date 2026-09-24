CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vin TEXT NOT NULL,
  year TEXT NOT NULL,
  model TEXT NOT NULL,
  miles INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_idxs JSONB NOT NULL,
  day_dow TEXT NOT NULL,
  day_num INTEGER NOT NULL,
  time_label TEXT NOT NULL,
  step_index INTEGER NOT NULL DEFAULT -1,
  status TEXT NOT NULL,
  status_label TEXT NOT NULL,
  extra_decision TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_active_idx ON appointments(user_id) WHERE active;

CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  service_date TEXT NOT NULL,
  miles TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  note TEXT,
  icon TEXT,
  paid_via TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL CHECK (from_role IN ('customer','shop')),
  text TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_email_idx ON password_resets(email);

