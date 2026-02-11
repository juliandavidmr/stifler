export type ToolGroup = "filesystem" | "memory";

export interface AppConfig {
  anthropicApiKey: string;
  defaultModel: string;
  activeToolGroups: ToolGroup[];
  activeMcps: string[];
  filesystemAllowedPaths: string[];
  systemPromptBase: string | null;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type ToolHandler = (
  input: Record<string, unknown>,
) => Promise<ToolExecutionResult>;

export interface ToolGroupDefinition {
  name: ToolGroup;
  tools: ToolDefinition[];
  handlers: Record<string, ToolHandler>;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  _execute?: () => Promise<ToolExecutionResult>;
}
