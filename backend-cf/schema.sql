-- NJAU 电竞社报名表（Cloudflare D1 / SQLite）
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  games TEXT NOT NULL,
  contact TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_created_at
  ON applications (created_at);
