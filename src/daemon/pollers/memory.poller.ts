import { createHash } from 'crypto';
import type { Poller } from './types.ts';
import type { PolledItem } from '../../types/daemon.ts';
import { listActiveMemories } from '../../memory/manager.ts';

const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i,
  /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i,
];

function containsNearDate(content: string, daysAhead: number = 3): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limit = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  for (const pattern of DATE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          const parsedDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
          if (parsedDay >= today && parsedDay <= limit) {
            return true;
          }
        }
      } catch {
        // Skip unparseable dates
      }
    }
  }

  return false;
}

function makeHash(memoryId: string, date: string): string {
  return createHash('sha256').update(`memory:${memoryId}:${date}`).digest('hex');
}

export const memoryPoller: Poller = {
  name: 'memory',

  async poll(): Promise<PolledItem[]> {
    const memories = listActiveMemories(100);
    const today = new Date().toISOString().split('T')[0]!;
    const items: PolledItem[] = [];

    for (const mem of memories) {
      if (containsNearDate(mem.content)) {
        items.push({
          id: makeHash(mem.id, today),
          source: 'memory',
          title: `Memory reminder`,
          body: mem.content,
          timestamp: Date.now(),
          metadata: { memoryId: mem.id, tags: mem.tags },
        });
      }
    }

    return items;
  },
};
