import { memoryTools, memoryHandlers } from './memory.tools.ts';
import type { ToolGroupDefinition } from '../../types/tools.ts';

export const memoryGroup: ToolGroupDefinition = {
  name: 'memory',
  tools: memoryTools,
  handlers: memoryHandlers,
};
