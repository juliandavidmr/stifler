import { getDb } from '../connection.ts';
import type { McpConnection } from '../../types/mcp.ts';

interface McpRow {
  id: string;
  name: string;
  type: string;
  config: string;
  is_enabled: number;
  created_at: number;
}

export function createMcpConnection(conn: McpConnection): void {
  const db = getDb();
  db.query(
    'INSERT INTO mcp_connections (id, name, type, config, is_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(conn.id, conn.name, conn.type, JSON.stringify(conn.config), conn.isEnabled ? 1 : 0, conn.createdAt);
}

export function getMcpConnection(id: string): McpConnection | null {
  const db = getDb();
  const row = db.query('SELECT * FROM mcp_connections WHERE id = ?').get(id) as McpRow | null;
  return row ? rowToMcp(row) : null;
}

export function getAllMcpConnections(): McpConnection[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM mcp_connections ORDER BY name').all() as McpRow[];
  return rows.map(rowToMcp);
}

export function getEnabledMcpConnections(): McpConnection[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM mcp_connections WHERE is_enabled = 1 ORDER BY name').all() as McpRow[];
  return rows.map(rowToMcp);
}

export function updateMcpConnection(id: string, updates: Partial<Pick<McpConnection, 'name' | 'config' | 'isEnabled'>>): boolean {
  const db = getDb();
  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    params.push(updates.name);
  }
  if (updates.config !== undefined) {
    sets.push('config = ?');
    params.push(JSON.stringify(updates.config));
  }
  if (updates.isEnabled !== undefined) {
    sets.push('is_enabled = ?');
    params.push(updates.isEnabled ? 1 : 0);
  }

  if (sets.length === 0) return false;

  params.push(id);
  const result = db.query(`UPDATE mcp_connections SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return result.changes > 0;
}

export function deleteMcpConnection(id: string): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM mcp_connections WHERE id = ?').run(id);
  return result.changes > 0;
}

function rowToMcp(row: McpRow): McpConnection {
  return {
    id: row.id,
    name: row.name,
    type: row.type as McpConnection['type'],
    config: JSON.parse(row.config),
    isEnabled: row.is_enabled === 1,
    createdAt: row.created_at,
  };
}
