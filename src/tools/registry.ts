import { filesystemGroup } from './native/index.ts';
import { memoryGroup } from './memory/index.ts';
import type { ToolGroup, ToolDefinition, ToolHandler, ToolGroupDefinition } from '../types/tools.ts';

const groups: Record<ToolGroup, ToolGroupDefinition> = {
  filesystem: filesystemGroup,
  memory: memoryGroup,
};

export function getToolDefinitions(activeGroups: ToolGroup[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const group of activeGroups) {
    const g = groups[group];
    if (g) {
      tools.push(...g.tools);
    }
  }
  return tools;
}

export function getToolHandler(toolName: string): ToolHandler | null {
  for (const group of Object.values(groups)) {
    if (group.handlers[toolName]) {
      return group.handlers[toolName];
    }
  }
  return null;
}

export function getAllGroups(): ToolGroupDefinition[] {
  return Object.values(groups);
}

export function getGroup(name: ToolGroup): ToolGroupDefinition | undefined {
  return groups[name];
}

export function isNativeTool(toolName: string): boolean {
  for (const group of Object.values(groups)) {
    if (group.handlers[toolName]) return true;
  }
  return false;
}
