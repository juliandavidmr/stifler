import { getDb } from '../connection.ts';
import type { NotificationLogEntry } from '../../types/daemon.ts';

interface NotificationRow {
  id: string;
  source: string;
  title: string;
  body: string;
  sent_at: number;
}

export function logNotification(entry: NotificationLogEntry): void {
  const db = getDb();
  db.query(
    'INSERT INTO notifications_log (id, source, title, body, sent_at) VALUES (?, ?, ?, ?, ?)'
  ).run(entry.id, entry.source, entry.title, entry.body, entry.sentAt);
}

export function getRecentNotifications(limit: number = 20): NotificationLogEntry[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT ?').all(limit) as NotificationRow[];
  return rows.map(rowToEntry);
}

export function getNotificationsBySource(source: string, limit: number = 20): NotificationLogEntry[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM notifications_log WHERE source = ? ORDER BY sent_at DESC LIMIT ?').all(source, limit) as NotificationRow[];
  return rows.map(rowToEntry);
}

function rowToEntry(row: NotificationRow): NotificationLogEntry {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    body: row.body,
    sentAt: row.sent_at,
  };
}
