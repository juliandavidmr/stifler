import { randomUUIDv7 } from 'bun';
import {
  createMcpConnection,
  getAllMcpConnections,
  getEnabledMcpConnections,
  updateMcpConnection,
  deleteMcpConnection,
  getMcpConnection,
} from '../db/repositories/mcp.repo.ts';
import { PREDEFINED_MCPS } from './definitions.ts';
import { buildMcpServersConfig } from './connector.ts';
import type { McpConnection } from '../types/mcp.ts';
import type { McpServerConfig } from './connector.ts';

export function connectMcp(type: string, serverUrl: string): McpConnection | null {
  const predefined = PREDEFINED_MCPS.find((m) => m.type === type);
  const name = predefined?.displayName || type;

  const conn: McpConnection = {
    id: randomUUIDv7(),
    name,
    type: type as McpConnection['type'],
    config: { serverUrl },
    isEnabled: true,
    createdAt: Date.now(),
  };

  createMcpConnection(conn);
  return conn;
}

export function disconnectMcp(id: string): boolean {
  return deleteMcpConnection(id);
}

export function toggleMcp(id: string, enabled: boolean): boolean {
  return updateMcpConnection(id, { isEnabled: enabled });
}

export function listMcps(): McpConnection[] {
  return getAllMcpConnections();
}

export function getActiveMcpConfigs(): McpServerConfig[] {
  const enabled = getEnabledMcpConnections();
  return buildMcpServersConfig(enabled);
}

export function getMcp(id: string): McpConnection | null {
  return getMcpConnection(id);
}

export { PREDEFINED_MCPS } from './definitions.ts';
