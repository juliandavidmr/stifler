import type { AppConfig } from "../types/tools.ts";
import { ToolGroup } from "../types/tools.ts";

export const DEFAULT_CONFIG: AppConfig = {
  anthropicApiKey: "",
  defaultModel: "claude-sonnet-4-20250514",
  activeToolGroups: [
    ToolGroup.FILESYSTEM,
    ToolGroup.MEMORY,
    ToolGroup.REMINDERS,
  ],
  activeMcps: [],
  filesystemAllowedPaths: [],
  systemPromptBase: null,
};

export const BLOCKED_PATHS = [
  "/",
  "/System",
  "/Library",
  "/usr",
  "/bin",
  "/sbin",
  "/etc",
  "~/.ssh",
  "~/.gnupg",
];

export const CONFIG_KEYS = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
  DEFAULT_MODEL: "default_model",
  ACTIVE_TOOL_GROUPS: "active_tool_groups",
  ACTIVE_MCPS: "active_mcps",
  FILESYSTEM_ALLOWED_PATHS: "filesystem_allowed_paths",
  SYSTEM_PROMPT_BASE: "system_prompt_base",
  DAEMON_ENABLED: "daemon_enabled",
  DAEMON_CALENDAR_INTERVAL: "daemon_calendar_interval",
  DAEMON_GMAIL_INTERVAL: "daemon_gmail_interval",
  DAEMON_MEMORY_CHECK_TIME: "daemon_memory_check_time",
  DAEMON_MODEL: "daemon_model",
  DAEMON_QUIET_HOURS_START: "daemon_quiet_hours_start",
  DAEMON_QUIET_HOURS_END: "daemon_quiet_hours_end",
} as const;
