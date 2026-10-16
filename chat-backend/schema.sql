-- Run against the existing streamoverlays-live D1 database.
-- No password, token or private message is stored in this table.
CREATE TABLE IF NOT EXISTS chat_configs (
 overlay_id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 config_json TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_configs_user ON chat_configs(user_id);
