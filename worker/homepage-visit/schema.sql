CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         TEXT NOT NULL,
  ip_hash    TEXT,
  country    TEXT,
  city       TEXT,
  region     TEXT,
  org        TEXT,
  timezone   TEXT,
  referrer   TEXT,
  ua         TEXT,
  language   TEXT,
  path       TEXT,
  screen_w   INTEGER,
  screen_h   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visits_ts      ON visits(ts);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country);
