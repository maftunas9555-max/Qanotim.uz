// Uses Node's built-in SQLite (stable since Node 22.5) instead of
// better-sqlite3 — no native compiler needed on the machine running this,
// which better-sqlite3 requires on platforms without a prebuilt binary for
// the installed Node version (a common Windows dev-machine blocker).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR lets a host with a persistent volume (e.g. Railway) point the
// database at the mounted volume path instead of the container's ephemeral
// filesystem — without it, every redeploy would wipe all user data.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'qanotim.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  email TEXT,
  name TEXT NOT NULL,
  picture TEXT,
  lang TEXT NOT NULL DEFAULT 'uz',
  subscription_start TEXT NOT NULL,
  subscription_end TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  missed INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  recurring INTEGER NOT NULL DEFAULT 0,
  current INTEGER,
  total INTEGER,
  unit TEXT,
  plan TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_log (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  done_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  main_tag TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS coach_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kasb_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  temperament TEXT NOT NULL,
  riasec_scores TEXT NOT NULL,
  riasec_code TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- One row per goal per past day: a frozen record of what that goal's text
-- and done-state were on that date, written once when the day rolls over.
-- Lets the History screen show and edit any past day without disturbing
-- today's live goals.
CREATE TABLE IF NOT EXISTS daily_snapshot (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  text TEXT NOT NULL,
  done INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, date, goal_id)
);
`);

// CREATE TABLE IF NOT EXISTS only guards table creation, not new columns on
// an already-existing database (e.g. a prior deploy) — so newly added
// columns need an explicit, idempotent migration here. SQLite has no
// "ADD COLUMN IF NOT EXISTS", so each attempt is wrapped to ignore the
// "duplicate column" error it throws when already applied.
function addColumnIfMissing(table: string, columnDef: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    if (!/duplicate column name/i.test((err as Error).message)) throw err;
  }
}
addColumnIfMissing('goals', 'plan TEXT');
addColumnIfMissing('users', 'blocked INTEGER NOT NULL DEFAULT 0');
// Tracks the last date this user's goals were rolled over to a new day.
// Left blank for existing rows on first migration (see goals.ts) so an
// already-deployed database doesn't try to "catch up" through however many
// days passed since every user's account was created.
addColumnIfMissing('users', "last_rollover_date TEXT NOT NULL DEFAULT ''");
