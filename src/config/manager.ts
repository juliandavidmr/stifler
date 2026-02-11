import { getConfigValue, setConfigValue } from '../db/repositories/config.repo.ts';
import { DEFAULT_CONFIG, CONFIG_KEYS } from './defaults.ts';
import type { AppConfig, ToolGroup } from '../types/tools.ts';

export function getConfig(): AppConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY || getConfigValue(CONFIG_KEYS.ANTHROPIC_API_KEY) || DEFAULT_CONFIG.anthropicApiKey;
  const model = getConfigValue(CONFIG_KEYS.DEFAULT_MODEL) || DEFAULT_CONFIG.defaultModel;

  const toolGroupsRaw = getConfigValue(CONFIG_KEYS.ACTIVE_TOOL_GROUPS);
  const activeToolGroups: ToolGroup[] = toolGroupsRaw
    ? JSON.parse(toolGroupsRaw)
    : DEFAULT_CONFIG.activeToolGroups;

  const mcpsRaw = getConfigValue(CONFIG_KEYS.ACTIVE_MCPS);
  const activeMcps: string[] = mcpsRaw ? JSON.parse(mcpsRaw) : DEFAULT_CONFIG.activeMcps;

  const pathsRaw = getConfigValue(CONFIG_KEYS.FILESYSTEM_ALLOWED_PATHS);
  const filesystemAllowedPaths: string[] = pathsRaw
    ? JSON.parse(pathsRaw)
    : DEFAULT_CONFIG.filesystemAllowedPaths;

  const systemPromptBase = getConfigValue(CONFIG_KEYS.SYSTEM_PROMPT_BASE) || DEFAULT_CONFIG.systemPromptBase;

  return {
    anthropicApiKey: apiKey,
    defaultModel: model,
    activeToolGroups,
    activeMcps,
    filesystemAllowedPaths,
    systemPromptBase,
  };
}

export function setApiKey(key: string): void {
  setConfigValue(CONFIG_KEYS.ANTHROPIC_API_KEY, key);
}

export function setModel(model: string): void {
  setConfigValue(CONFIG_KEYS.DEFAULT_MODEL, model);
}

export function setActiveToolGroups(groups: ToolGroup[]): void {
  setConfigValue(CONFIG_KEYS.ACTIVE_TOOL_GROUPS, JSON.stringify(groups));
}

export function setActiveMcps(mcps: string[]): void {
  setConfigValue(CONFIG_KEYS.ACTIVE_MCPS, JSON.stringify(mcps));
}

export function setFilesystemAllowedPaths(paths: string[]): void {
  setConfigValue(CONFIG_KEYS.FILESYSTEM_ALLOWED_PATHS, JSON.stringify(paths));
}

export function addFilesystemAllowedPath(path: string): void {
  const config = getConfig();
  if (!config.filesystemAllowedPaths.includes(path)) {
    config.filesystemAllowedPaths.push(path);
    setFilesystemAllowedPaths(config.filesystemAllowedPaths);
  }
}

export function setSystemPromptBase(prompt: string | null): void {
  if (prompt === null) {
    setConfigValue(CONFIG_KEYS.SYSTEM_PROMPT_BASE, '');
  } else {
    setConfigValue(CONFIG_KEYS.SYSTEM_PROMPT_BASE, prompt);
  }
}

export function setConfigByKey(key: string, value: string): boolean {
  const validKeys = Object.values(CONFIG_KEYS) as string[];
  if (!validKeys.includes(key)) return false;
  setConfigValue(key, value);
  return true;
}

export function getMaskedApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}
