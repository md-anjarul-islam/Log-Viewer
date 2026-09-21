import type Database from 'better-sqlite3'

// Each entry runs once, in order, tracked via SQLite's `user_version` pragma.
// Append new migrations; never edit ones that have already shipped.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE commands (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT NOT NULL,
    command_string       TEXT NOT NULL,
    enabled              INTEGER NOT NULL DEFAULT 0,
    schedule_interval_ms INTEGER,
    created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX idx_commands_enabled ON commands(enabled);
  `
]

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number
  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    db.exec(MIGRATIONS[i])
    db.pragma(`user_version = ${i + 1}`)
  }
}
