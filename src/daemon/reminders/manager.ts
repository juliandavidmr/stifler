import { randomUUIDv7 } from 'bun';
import {
  createReminder,
  getReminder,
  getPendingReminders,
  getAllReminders,
  markReminderFired,
  updateReminderTime,
  deleteReminder,
} from '../../db/repositories/reminders.repo.ts';
import { parseReminderTime } from './time-parser.ts';
import type { Reminder } from '../../types/daemon.ts';

export function addReminder(content: string, whenStr: string): Reminder | null {
  const parsed = parseReminderTime(whenStr);
  if (!parsed) return null;

  const reminder: Reminder = {
    id: randomUUIDv7(),
    content,
    remindAt: parsed.remindAt,
    createdAt: Date.now(),
    fired: false,
    cronPattern: parsed.cronPattern,
  };

  createReminder(reminder);
  return reminder;
}

export function listPendingReminders(): Reminder[] {
  return getPendingReminders();
}

export function listAllReminders(limit: number = 20): Reminder[] {
  return getAllReminders(limit);
}

export function removeReminder(id: string): boolean {
  return deleteReminder(id);
}

export function fireReminder(id: string): Reminder | null {
  const reminder = getReminder(id);
  if (!reminder) return null;

  markReminderFired(id);

  if (reminder.cronPattern) {
    const nextParsed = parseReminderTime(`every day ${new Date(reminder.remindAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
    if (nextParsed) {
      updateReminderTime(id, nextParsed.remindAt);
    }
  }

  return { ...reminder, fired: true };
}
