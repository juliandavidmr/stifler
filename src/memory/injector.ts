import { listActiveMemories } from './manager.ts';
import type { Memory } from '../types/memory.ts';

const IMPORTANCE_LABELS: Record<Memory['importance'], string> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

export function buildMemoryBlock(limit: number = 50): string {
  const memories = listActiveMemories(limit);
  if (memories.length === 0) return '';

  const lines = memories.map(
    (m) => `[${IMPORTANCE_LABELS[m.importance]}] ${m.content}`
  );

  return `<user_memories>\n${lines.join('\n')}\n</user_memories>`;
}

export function hasMemories(): boolean {
  return listActiveMemories(1).length > 0;
}
