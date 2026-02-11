import { getDb } from '../connection.ts';
import type { Memory } from '../../types/memory.ts';

interface MemoryRow {
  id: string;
  content: string;
  tags: string;
  importance: string;
  created_at: number;
  updated_at: number;
  expires_at: number | null;
  is_active: number;
}

export function createMemory(memory: Omit<Memory, 'createdAt' | 'updatedAt'>): Memory {
  const db = getDb();
  const now = Date.now();
  db.query(
    'INSERT INTO memories (id, content, tags, importance, created_at, updated_at, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    memory.id,
    memory.content,
    JSON.stringify(memory.tags),
    memory.importance,
    now,
    now,
    memory.expiresAt,
    memory.isActive ? 1 : 0
  );
  return { ...memory, createdAt: now, updatedAt: now };
}

export function getMemoryById(id: string): Memory | null {
  const db = getDb();
  const row = db.query('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | null;
  return row ? rowToMemory(row) : null;
}

export function getActiveMemories(limit?: number): Memory[] {
  const db = getDb();
  const query = limit
    ? `SELECT * FROM memories WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?) ORDER BY
       CASE importance WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
       updated_at DESC LIMIT ?`
    : `SELECT * FROM memories WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?) ORDER BY
       CASE importance WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
       updated_at DESC`;
  const now = Date.now();
  const rows = (limit ? db.query(query).all(now, limit) : db.query(query).all(now)) as MemoryRow[];
  return rows.map(rowToMemory);
}

export function searchMemories(query: string, tags?: string[], limit: number = 10): Memory[] {
  const db = getDb();
  let sql = `SELECT * FROM memories WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?) AND content LIKE ?`;
  const params: (string | number)[] = [Date.now(), `%${query}%`];

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      sql += ` AND tags LIKE ?`;
      params.push(`%"${tag}"%`);
    }
  }

  sql += ` ORDER BY CASE importance WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END, updated_at DESC LIMIT ?`;
  params.push(limit);

  const rows = db.query(sql).all(...params) as MemoryRow[];
  return rows.map(rowToMemory);
}

export function updateMemory(id: string, updates: Partial<Pick<Memory, 'content' | 'tags' | 'importance' | 'isActive' | 'expiresAt'>>): Memory | null {
  const db = getDb();
  const existing = getMemoryById(id);
  if (!existing) return null;

  const sets: string[] = ['updated_at = ?'];
  const params: (string | number | null)[] = [Date.now()];

  if (updates.content !== undefined) {
    sets.push('content = ?');
    params.push(updates.content);
  }
  if (updates.tags !== undefined) {
    sets.push('tags = ?');
    params.push(JSON.stringify(updates.tags));
  }
  if (updates.importance !== undefined) {
    sets.push('importance = ?');
    params.push(updates.importance);
  }
  if (updates.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(updates.isActive ? 1 : 0);
  }
  if (updates.expiresAt !== undefined) {
    sets.push('expires_at = ?');
    params.push(updates.expiresAt);
  }

  params.push(id);
  db.query(`UPDATE memories SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  return getMemoryById(id);
}

export function deleteMemory(id: string): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM memories WHERE id = ?').run(id);
  return result.changes > 0;
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    content: row.content,
    tags: JSON.parse(row.tags),
    importance: row.importance as Memory['importance'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    isActive: row.is_active === 1,
  };
}
