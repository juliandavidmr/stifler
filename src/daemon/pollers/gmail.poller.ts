import type { Poller } from './types.ts';
import type { PolledItem } from '../../types/daemon.ts';
import { getEnabledMcpConnections } from '../../db/repositories/mcp.repo.ts';

export const gmailPoller: Poller = {
  name: 'gmail',

  async poll(): Promise<PolledItem[]> {
    const mcps = getEnabledMcpConnections();
    const gmailMcp = mcps.find((m) => m.type === 'gmail');

    if (!gmailMcp) {
      return [];
    }

    // TODO: Integrate with actual MCP connector to fetch Gmail messages.
    // For now, returns empty — the MCP connector will provide the bridge
    // once a Gmail MCP is configured and connected.
    console.error('[daemon] Gmail polling: no MCP bridge implemented yet');
    return [];
  },
};
