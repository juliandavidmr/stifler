import { Cron } from 'croner';
import { listPendingReminders, fireReminder } from './manager.ts';
import { sendMacOSNotification } from '../notifier/macos.ts';
import { logNotification } from '../../db/repositories/notifications.repo.ts';
import { isQuietHours } from '../config.ts';
import { randomUUIDv7 } from 'bun';
import type { DaemonNotification } from '../../types/daemon.ts';

const activeJobs = new Map<string, Cron>();

export function scheduleReminder(reminderId: string, remindAt: number, content: string): void {
  cancelReminderJob(reminderId);

  const date = new Date(remindAt);
  if (date.getTime() <= Date.now()) {
    handleReminderFire(reminderId, content);
    return;
  }

  const job = new Cron(date, async () => {
    await handleReminderFire(reminderId, content);
    activeJobs.delete(reminderId);
  }, { maxRuns: 1 });

  activeJobs.set(reminderId, job);
}

export function cancelReminderJob(reminderId: string): void {
  const existing = activeJobs.get(reminderId);
  if (existing) {
    existing.stop();
    activeJobs.delete(reminderId);
  }
}

export function loadPendingReminders(): void {
  const pending = listPendingReminders();
  for (const reminder of pending) {
    scheduleReminder(reminder.id, reminder.remindAt, reminder.content);
  }
  if (pending.length > 0) {
    console.error(`[daemon] Loaded ${pending.length} pending reminder(s)`);
  }
}

export function stopAllReminderJobs(): void {
  for (const [id, job] of activeJobs) {
    job.stop();
    activeJobs.delete(id);
  }
}

export function getActiveReminderJobCount(): number {
  return activeJobs.size;
}

async function handleReminderFire(reminderId: string, content: string): Promise<void> {
  const fired = fireReminder(reminderId);
  if (!fired) return;

  if (isQuietHours()) {
    console.error(`[daemon] Reminder suppressed (quiet hours): ${content}`);
    return;
  }

  const notification: DaemonNotification = {
    id: randomUUIDv7(),
    source: 'reminder',
    title: 'Reminder',
    body: content,
  };

  await sendMacOSNotification(notification);
  logNotification({
    id: notification.id,
    source: notification.source,
    title: notification.title,
    body: notification.body,
    sentAt: Date.now(),
  });

  if (fired.cronPattern) {
    const updated = listPendingReminders().find((r) => r.id === reminderId);
    if (updated) {
      scheduleReminder(updated.id, updated.remindAt, updated.content);
    }
  }
}
