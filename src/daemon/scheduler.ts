import { Cron } from 'croner';
import { randomUUIDv7 } from 'bun';
import { getDaemonConfig, isQuietHours } from './config.ts';
import { calendarPoller } from './pollers/calendar.poller.ts';
import { gmailPoller } from './pollers/gmail.poller.ts';
import { memoryPoller } from './pollers/memory.poller.ts';
import { evaluateRelevance } from './evaluator/relevance.ts';
import { sendMacOSNotification } from './notifier/macos.ts';
import { isItemSeen, createSeenItem, markRelevant } from '../db/repositories/seen-items.repo.ts';
import { logNotification } from '../db/repositories/notifications.repo.ts';
import { getEnabledMcpConnections } from '../db/repositories/mcp.repo.ts';
import type { Poller } from './pollers/types.ts';
import type { PolledItem, DaemonNotification } from '../types/daemon.ts';

const MAX_ITEMS_PER_CYCLE = 5;

const activeJobs: Cron[] = [];

async function processPollResults(items: PolledItem[]): Promise<void> {
  const newItems = items.filter((item) => !isItemSeen(item.id));

  if (newItems.length === 0) return;

  const batch = newItems.slice(0, MAX_ITEMS_PER_CYCLE);

  for (const item of batch) {
    createSeenItem({
      id: item.id,
      source: item.source,
      sourceId: item.id,
      firstSeenAt: Date.now(),
      wasRelevant: false,
      notifiedAt: null,
    });

    const result = await evaluateRelevance(item);

    if (!result.isRelevant) continue;

    const now = Date.now();
    markRelevant(item.id, now);

    if (isQuietHours()) {
      console.error(`[daemon] Suppressed (quiet hours): ${item.title}`);
      continue;
    }

    const notification: DaemonNotification = {
      id: randomUUIDv7(),
      source: item.source,
      title: result.suggestedNotification?.title || item.title,
      body: result.suggestedNotification?.body || item.body,
    };

    await sendMacOSNotification(notification);
    logNotification({
      id: notification.id,
      source: notification.source,
      title: notification.title,
      body: notification.body,
      sentAt: now,
    });

    console.error(`[daemon] Notified: ${notification.title}`);
  }
}

function createPollerJob(poller: Poller, cronPattern: string): Cron {
  const job = new Cron(cronPattern, async () => {
    try {
      const items = await poller.poll();
      if (items.length > 0) {
        await processPollResults(items);
      }
    } catch (error: any) {
      console.error(`[daemon] ${poller.name} poll error: ${error.message}`);
    }
  });
  return job;
}

export function startScheduler(): void {
  const config = getDaemonConfig();
  const mcps = getEnabledMcpConnections();

  const hasCalendar = mcps.some((m) => m.type === 'google_calendar');
  const hasGmail = mcps.some((m) => m.type === 'gmail');

  if (hasCalendar) {
    const job = createPollerJob(calendarPoller, config.calendarInterval);
    activeJobs.push(job);
    console.error(`[daemon] Calendar polling: ${config.calendarInterval}`);
  }

  if (hasGmail) {
    const job = createPollerJob(gmailPoller, config.gmailInterval);
    activeJobs.push(job);
    console.error(`[daemon] Gmail polling: ${config.gmailInterval}`);
  }

  const memoryJob = createPollerJob(memoryPoller, config.memoryCheckTime);
  activeJobs.push(memoryJob);
  console.error(`[daemon] Memory check: ${config.memoryCheckTime}`);
}

export function stopScheduler(): void {
  for (const job of activeJobs) {
    job.stop();
  }
  activeJobs.length = 0;
}

export function getSchedulerJobCount(): number {
  return activeJobs.length;
}
