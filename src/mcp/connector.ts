import type { McpConnection } from '../types/mcp.ts';

export interface McpServerConfig {
  type: string;
  url: string;
  name: string;
}

export function buildMcpServersConfig(connections: McpConnection[]): McpServerConfig[] {
  return connections
    .filter((c) => c.isEnabled && c.config.serverUrl)
    .map((c) => ({
      type: 'url' as const,
      url: c.config.serverUrl!,
      name: c.name,
    }));
}
