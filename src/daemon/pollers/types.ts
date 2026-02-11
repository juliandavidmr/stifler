import type { PolledItem } from '../../types/daemon.ts';

export interface Poller {
  name: string;
  poll(): Promise<PolledItem[]>;
}
