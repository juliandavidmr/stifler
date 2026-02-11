import { getConfigValue } from '../db/repositories/config.repo.ts';
import type { DaemonConfig } from '../types/daemon.ts';

const DAEMON_DEFAULTS: DaemonConfig = {
  enabled: true,
  calendarInterval: '*/5 * * * *',
  gmailInterval: '*/5 * * * *',
  memoryCheckTime: '0 8 * * *',
  model: 'claude-haiku-4-5-20250929',
  quietHoursStart: 22,
  quietHoursEnd: 8,
};

export const DAEMON_CONFIG_KEYS = {
  ENABLED: 'daemon_enabled',
  CALENDAR_INTERVAL: 'daemon_calendar_interval',
  GMAIL_INTERVAL: 'daemon_gmail_interval',
  MEMORY_CHECK_TIME: 'daemon_memory_check_time',
  MODEL: 'daemon_model',
  QUIET_HOURS_START: 'daemon_quiet_hours_start',
  QUIET_HOURS_END: 'daemon_quiet_hours_end',
} as const;

export function getDaemonConfig(): DaemonConfig {
  const enabled = getConfigValue(DAEMON_CONFIG_KEYS.ENABLED);
  const calendarInterval = getConfigValue(DAEMON_CONFIG_KEYS.CALENDAR_INTERVAL);
  const gmailInterval = getConfigValue(DAEMON_CONFIG_KEYS.GMAIL_INTERVAL);
  const memoryCheckTime = getConfigValue(DAEMON_CONFIG_KEYS.MEMORY_CHECK_TIME);
  const model = getConfigValue(DAEMON_CONFIG_KEYS.MODEL);
  const quietStart = getConfigValue(DAEMON_CONFIG_KEYS.QUIET_HOURS_START);
  const quietEnd = getConfigValue(DAEMON_CONFIG_KEYS.QUIET_HOURS_END);

  return {
    enabled: enabled !== undefined ? enabled !== 'false' : DAEMON_DEFAULTS.enabled,
    calendarInterval: calendarInterval || DAEMON_DEFAULTS.calendarInterval,
    gmailInterval: gmailInterval || DAEMON_DEFAULTS.gmailInterval,
    memoryCheckTime: memoryCheckTime || DAEMON_DEFAULTS.memoryCheckTime,
    model: model || DAEMON_DEFAULTS.model,
    quietHoursStart: quietStart ? parseInt(quietStart, 10) : DAEMON_DEFAULTS.quietHoursStart,
    quietHoursEnd: quietEnd ? parseInt(quietEnd, 10) : DAEMON_DEFAULTS.quietHoursEnd,
  };
}

export function isQuietHours(): boolean {
  const config = getDaemonConfig();
  const hour = new Date().getHours();

  if (config.quietHoursStart > config.quietHoursEnd) {
    return hour >= config.quietHoursStart || hour < config.quietHoursEnd;
  }
  return hour >= config.quietHoursStart && hour < config.quietHoursEnd;
}
