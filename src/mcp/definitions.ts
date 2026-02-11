export interface McpServerDefinition {
  type: string;
  name: string;
  displayName: string;
  description: string;
}

export const PREDEFINED_MCPS: McpServerDefinition[] = [
  {
    type: 'google_calendar',
    name: 'google_calendar',
    displayName: 'Google Calendar',
    description: 'Access and manage Google Calendar events',
  },
  {
    type: 'gmail',
    name: 'gmail',
    displayName: 'Gmail',
    description: 'Read and send emails via Gmail',
  },
];
