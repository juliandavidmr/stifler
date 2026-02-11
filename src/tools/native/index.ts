import { filesystemTools, filesystemHandlers } from './filesystem.ts';
import type { ToolGroupDefinition } from '../../types/tools.ts';

export const filesystemGroup: ToolGroupDefinition = {
  name: 'filesystem',
  tools: filesystemTools,
  handlers: filesystemHandlers,
};
