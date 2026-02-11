import { filesystemTools, filesystemHandlers } from "./filesystem.ts";
import { ToolGroup, type ToolGroupDefinition } from "../../types/tools.ts";

export const filesystemGroup: ToolGroupDefinition = {
  name: ToolGroup.FILESYSTEM,
  tools: filesystemTools,
  handlers: filesystemHandlers,
};
