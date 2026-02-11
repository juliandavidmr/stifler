import {
  saveMessage,
  getMessages,
  getRecentMessages,
  clearMessages,
  getMessageCount,
} from '../db/repositories/messages.repo.ts';
import type { ChatMessage } from '../types/memory.ts';

const MAX_MESSAGES = 100;

export function addUserMessage(content: string): void {
  saveMessage({ role: 'user', content });
}

export function addAssistantMessage(content: string): void {
  saveMessage({ role: 'assistant', content });
}

export function addToolUseMessage(toolUseId: string, toolName: string, toolInput: Record<string, unknown>): void {
  saveMessage({
    role: 'tool_use',
    toolUseId,
    toolName,
    toolInput,
  });
}

export function addToolResultMessage(toolUseId: string, content: string): void {
  saveMessage({
    role: 'tool_result',
    content,
    toolUseId,
  });
}

export function getSessionMessages(): ChatMessage[] {
  const count = getMessageCount();
  if (count > MAX_MESSAGES) {
    return getRecentMessages(MAX_MESSAGES);
  }
  return getMessages();
}

export function clearSession(): void {
  clearMessages();
}

export function getSessionMessageCount(): number {
  return getMessageCount();
}
