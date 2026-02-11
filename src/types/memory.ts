export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface ToolUseMessage {
  id: number;
  role: 'tool_use';
  toolUseId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  createdAt: number;
}

export interface ToolResultMessage {
  id: number;
  role: 'tool_result';
  toolUseId: string;
  content: string;
  createdAt: number;
}

export type ChatMessage = Message | ToolUseMessage | ToolResultMessage;

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
  isActive: boolean;
}
