import { memoryTools, memoryHandlers } from "./memory.tools.ts";
import { ToolGroup, type ToolGroupDefinition } from "../../types/tools.ts";

export const memoryGroup: ToolGroupDefinition = {
  name: ToolGroup.MEMORY,
  tools: memoryTools,
  handlers: memoryHandlers,
};
