export interface McpConnection {
  id: string;
  name: string;
  type: 'google_calendar' | 'gmail' | 'custom';
  config: McpConfig;
  isEnabled: boolean;
  createdAt: number;
}

export interface McpConfig {
  serverUrl?: string;
  [key: string]: unknown;
}
