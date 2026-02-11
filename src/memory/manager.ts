import { randomUUIDv7 } from 'bun';
import {
  createMemory,
  getActiveMemories,
  searchMemories,
  updateMemory,
  deleteMemory,
  getMemoryById,
} from '../db/repositories/memories.repo.ts';
import type { Memory } from '../types/memory.ts';

export function storeMemory(content: string, tags: string[] = [], importance: Memory['importance'] = 'medium'): Memory {
  return createMemory({
    id: randomUUIDv7(),
    content,
    tags,
    importance,
    expiresAt: null,
    isActive: true,
  });
}

export function findMemories(query: string, tags?: string[], limit?: number): Memory[] {
  return searchMemories(query, tags, limit);
}

export function listActiveMemories(limit?: number): Memory[] {
  return getActiveMemories(limit);
}

export function editMemory(id: string, updates: Partial<Pick<Memory, 'content' | 'tags' | 'importance'>>): Memory | null {
  return updateMemory(id, updates);
}

export function removeMemory(id: string): boolean {
  return deleteMemory(id);
}

export function getMemory(id: string): Memory | null {
  return getMemoryById(id);
}
