import { getDb } from '../connection.ts';
import type { ChatMessage } from '../../types/memory.ts';

interface MessageRow {
  id: number;
  role: string;
  content: string | null;
  tool_use_id: string | null;
  tool_name: string | null;
  tool_input: string | null;
  created_at: number;
}

export function saveMessage(msg: {
  role: string;
  content?: string | null;
  toolUseId?: string | null;
  toolName?: string | null;
  toolInput?: Record<string, unknown> | null;
}): number {
  const db = getDb();
  const result = db.query(
    'INSERT INTO messages (role, content, tool_use_id, tool_name, tool_input, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    msg.role,
    msg.content ?? null,
    msg.toolUseId ?? null,
    msg.toolName ?? null,
    msg.toolInput ? JSON.stringify(msg.toolInput) : null,
    Date.now()
  );
  return Number(result.lastInsertRowid);
}

export function getMessages(limit?: number): ChatMessage[] {
  const db = getDb();
  const query = limit
    ? 'SELECT * FROM messages ORDER BY created_at ASC LIMIT ?'
    : 'SELECT * FROM messages ORDER BY created_at ASC';
  const rows = (limit ? db.query(query).all(limit) : db.query(query).all()) as MessageRow[];

  return rows.map(rowToMessage);
}

export function getRecentMessages(limit: number): ChatMessage[] {
  const db = getDb();
  const rows = db.query(
    'SELECT * FROM (SELECT * FROM messages ORDER BY created_at DESC LIMIT ?) ORDER BY created_at ASC'
  ).all(limit) as MessageRow[];

  return rows.map(rowToMessage);
}

export function clearMessages(): void {
  const db = getDb();
  db.query('DELETE FROM messages').run();
}

export function getMessageCount(): number {
  const db = getDb();
  const row = db.query('SELECT COUNT(*) as count FROM messages').get() as { count: number };
  return row.count;
}

function rowToMessage(row: MessageRow): ChatMessage {
  if (row.role === 'tool_use') {
    return {
      id: row.id,
      role: 'tool_use',
      toolUseId: row.tool_use_id!,
      toolName: row.tool_name!,
      toolInput: row.tool_input ? JSON.parse(row.tool_input) : {},
      createdAt: row.created_at,
    };
  }
  if (row.role === 'tool_result') {
    return {
      id: row.id,
      role: 'tool_result',
      toolUseId: row.tool_use_id!,
      content: row.content ?? '',
      createdAt: row.created_at,
    };
  }
  return {
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content ?? '',
    createdAt: row.created_at,
  };
}
