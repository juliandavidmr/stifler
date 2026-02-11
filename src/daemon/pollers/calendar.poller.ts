import type { Poller } from './types.ts';
import type { PolledItem } from '../../types/daemon.ts';
import { getEnabledMcpConnections } from '../../db/repositories/mcp.repo.ts';

export const calendarPoller: Poller = {
  name: 'calendar',

  async poll(): Promise<PolledItem[]> {
    const mcps = getEnabledMcpConnections();
    const calendarMcp = mcps.find((m) => m.type === 'google_calendar');

    if (!calendarMcp) {
      return [];
    }

    // TODO: Integrate with actual MCP connector to fetch calendar events.
    // For now, returns empty — the MCP connector will provide the bridge
    // once a Google Calendar MCP is configured and connected.
    console.error('[daemon] Calendar polling: no MCP bridge implemented yet');
    return [];
  },
};
