import { getDb } from '../connection.ts';
import type { Reminder } from '../../types/daemon.ts';

interface ReminderRow {
  id: string;
  content: string;
  remind_at: number;
  created_at: number;
  fired: number;
  cron_pattern: string | null;
}

export function createReminder(reminder: Reminder): void {
  const db = getDb();
  db.query(
    'INSERT INTO reminders (id, content, remind_at, created_at, fired, cron_pattern) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(reminder.id, reminder.content, reminder.remindAt, reminder.createdAt, reminder.fired ? 1 : 0, reminder.cronPattern);
}

export function getReminder(id: string): Reminder | null {
  const db = getDb();
  const row = db.query('SELECT * FROM reminders WHERE id = ?').get(id) as ReminderRow | null;
  return row ? rowToReminder(row) : null;
}

export function getPendingReminders(): Reminder[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM reminders WHERE fired = 0 ORDER BY remind_at ASC').all() as ReminderRow[];
  return rows.map(rowToReminder);
}

export function getAllReminders(limit: number = 20): Reminder[] {
  const db = getDb();
  const rows = db.query('SELECT * FROM reminders ORDER BY remind_at DESC LIMIT ?').all(limit) as ReminderRow[];
  return rows.map(rowToReminder);
}

export function markReminderFired(id: string): void {
  const db = getDb();
  db.query('UPDATE reminders SET fired = 1 WHERE id = ?').run(id);
}

export function updateReminderTime(id: string, remindAt: number): void {
  const db = getDb();
  db.query('UPDATE reminders SET remind_at = ?, fired = 0 WHERE id = ?').run(remindAt, id);
}

export function deleteReminder(id: string): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM reminders WHERE id = ?').run(id);
  return result.changes > 0;
}

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    content: row.content,
    remindAt: row.remind_at,
    createdAt: row.created_at,
    fired: row.fired === 1,
    cronPattern: row.cron_pattern,
  };
}
