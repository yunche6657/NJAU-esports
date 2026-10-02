-- NJAU 电竞社 · 报名表（Cloudflare D1 / SQLite）
-- 应用：wrangler d1 execute njau-esports --file=schema.sql        （线上）
--       wrangler d1 execute njau-esports --local --file=schema.sql （本地）
CREATE TABLE IF NOT EXISTS applications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  grade      TEXT NOT NULL DEFAULT '',
  major      TEXT NOT NULL DEFAULT '',
  games      TEXT NOT NULL,            -- JSON 数组，如 ["valorant","wangzhe"]
  contact    TEXT NOT NULL,
  intro      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL             -- ISO 8601
);
