-- Cloudflare D1. No access tokens are stored in plaintext.
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  overlay_id TEXT NOT NULL UNIQUE,
  access_enc TEXT NOT NULL,
  refresh_enc TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  followers INTEGER,
  subs INTEGER,
  cached_at INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_overlay_id ON users(overlay_id);
CREATE TABLE IF NOT EXISTS tickets (
  ticket_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_expires ON tickets(expires_at);
