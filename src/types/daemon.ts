export type PolledItemSource = 'calendar' | 'gmail' | 'memory';

export interface PolledItem {
  id: string;
  source: PolledItemSource;
  title: string;
  body: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface RelevanceResult {
  isRelevant: boolean;
  reason: string;
  suggestedNotification: {
    title: string;
    body: string;
  } | null;
}

export interface DaemonNotification {
  id: string;
  source: PolledItemSource | 'reminder';
  title: string;
  body: string;
}

export interface Reminder {
  id: string;
  content: string;
  remindAt: number;
  createdAt: number;
  fired: boolean;
  cronPattern: string | null;
}

export interface SeenItem {
  id: string;
  source: PolledItemSource;
  sourceId: string;
  firstSeenAt: number;
  wasRelevant: boolean;
  notifiedAt: number | null;
}

export interface NotificationLogEntry {
  id: string;
  source: string;
  title: string;
  body: string;
  sentAt: number;
}

export interface DaemonConfig {
  enabled: boolean;
  calendarInterval: string;
  gmailInterval: string;
  memoryCheckTime: string;
  model: string;
  quietHoursStart: number;
  quietHoursEnd: number;
}
