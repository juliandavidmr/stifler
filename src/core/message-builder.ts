import type { ChatMessage } from '../types/memory.ts';
import type Anthropic from '@anthropic-ai/sdk';

type AnthropicMessage = Anthropic.MessageParam;
type ContentBlock = Anthropic.ContentBlockParam;

export function buildAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];
  let currentAssistantBlocks: ContentBlock[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (currentAssistantBlocks.length > 0) {
        result.push({ role: 'assistant', content: currentAssistantBlocks });
        currentAssistantBlocks = [];
      }
      result.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (currentAssistantBlocks.length > 0) {
        result.push({ role: 'assistant', content: currentAssistantBlocks });
        currentAssistantBlocks = [];
      }
      result.push({ role: 'assistant', content: msg.content });
    } else if (msg.role === 'tool_use') {
      currentAssistantBlocks.push({
        type: 'tool_use',
        id: msg.toolUseId,
        name: msg.toolName,
        input: msg.toolInput,
      });
    } else if (msg.role === 'tool_result') {
      if (currentAssistantBlocks.length > 0) {
        result.push({ role: 'assistant', content: currentAssistantBlocks });
        currentAssistantBlocks = [];
      }
      result.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.toolUseId,
            content: msg.content,
          },
        ],
      });
    }
  }

  if (currentAssistantBlocks.length > 0) {
    result.push({ role: 'assistant', content: currentAssistantBlocks });
  }

  return result;
}
