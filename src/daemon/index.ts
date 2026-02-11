import { getDaemonConfig } from './config.ts';
import { startScheduler, stopScheduler, getSchedulerJobCount } from './scheduler.ts';
import { loadPendingReminders, stopAllReminderJobs, getActiveReminderJobCount } from './reminders/scheduler.ts';

let running = false;
let paused = false;

export function startDaemon(): void {
  const config = getDaemonConfig();

  if (!config.enabled) {
    console.error('[daemon] Disabled by configuration');
    return;
  }

  startScheduler();
  loadPendingReminders();
  running = true;
  paused = false;

  console.error('[daemon] Started');
}

export function stopDaemon(): void {
  if (!running) return;

  stopScheduler();
  stopAllReminderJobs();
  running = false;
  paused = false;

  console.error('[daemon] Stopped');
}

export function pauseDaemon(): void {
  if (!running || paused) return;

  stopScheduler();
  paused = true;
  console.error('[daemon] Paused');
}

export function resumeDaemon(): void {
  if (!running || !paused) return;

  startScheduler();
  paused = false;
  console.error('[daemon] Resumed');
}

export interface DaemonStatus {
  running: boolean;
  paused: boolean;
  pollerJobs: number;
  reminderJobs: number;
}

export function getDaemonStatus(): DaemonStatus {
  return {
    running,
    paused,
    pollerJobs: getSchedulerJobCount(),
    reminderJobs: getActiveReminderJobCount(),
  };
}
