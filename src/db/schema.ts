export const SCHEMA = `
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'tool_use', 'tool_result')),
  content TEXT,
  tool_use_id TEXT,
  tool_name TEXT,
  tool_input TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  importance TEXT NOT NULL DEFAULT 'medium' CHECK(importance IN ('low', 'medium', 'high')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mcp_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('google_calendar', 'gmail', 'custom')),
  config TEXT NOT NULL DEFAULT '{}',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS seen_items (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('calendar', 'gmail', 'memory')),
  source_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  was_relevant INTEGER DEFAULT 0,
  notified_at INTEGER
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  remind_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  fired INTEGER DEFAULT 0,
  cron_pattern TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(is_active);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_seen_items_source ON seen_items(source);
CREATE INDEX IF NOT EXISTS idx_reminders_fired ON reminders(fired);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications_log(sent_at);
`;
