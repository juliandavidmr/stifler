import { getDb } from '../connection.ts';
import type { SeenItem, PolledItemSource } from '../../types/daemon.ts';

interface SeenItemRow {
  id: string;
  source: string;
  source_id: string;
  first_seen_at: number;
  was_relevant: number;
  notified_at: number | null;
}

export function createSeenItem(item: SeenItem): void {
  const db = getDb();
  db.query(
    'INSERT OR IGNORE INTO seen_items (id, source, source_id, first_seen_at, was_relevant, notified_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(item.id, item.source, item.sourceId, item.firstSeenAt, item.wasRelevant ? 1 : 0, item.notifiedAt);
}

export function getSeenItem(id: string): SeenItem | null {
  const db = getDb();
  const row = db.query('SELECT * FROM seen_items WHERE id = ?').get(id) as SeenItemRow | null;
  return row ? rowToSeenItem(row) : null;
}

export function isItemSeen(id: string): boolean {
  const db = getDb();
  const row = db.query('SELECT 1 FROM seen_items WHERE id = ?').get(id);
  return row !== null;
}

export function markRelevant(id: string, notifiedAt: number): void {
  const db = getDb();
  db.query('UPDATE seen_items SET was_relevant = 1, notified_at = ? WHERE id = ?').run(notifiedAt, id);
}

export function getSeenItemsBySource(source: PolledItemSource): SeenItem[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM seen_items WHERE source = ? ORDER BY first_seen_at DESC').all(source) as SeenItemRow[];
  return rows.map(rowToSeenItem);
}

function rowToSeenItem(row: SeenItemRow): SeenItem {
  return {
    id: row.id,
    source: row.source as PolledItemSource,
    sourceId: row.source_id,
    firstSeenAt: row.first_seen_at,
    wasRelevant: row.was_relevant === 1,
    notifiedAt: row.notified_at,
  };
}
