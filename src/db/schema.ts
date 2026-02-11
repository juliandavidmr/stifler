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

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(is_active);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
`;
