import type { AppConfig } from "../types/tools.ts";

export const DEFAULT_CONFIG: AppConfig = {
  anthropicApiKey: "",
  defaultModel: "claude-sonnet-4-20250514",
  activeToolGroups: ["filesystem", "memory"],
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
} as const;
