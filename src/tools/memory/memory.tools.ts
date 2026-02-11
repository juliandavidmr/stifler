import {
  storeMemory,
  findMemories,
  editMemory,
  removeMemory,
  listActiveMemories,
} from "../../memory/manager.ts";
import type { ToolDefinition, ToolHandler } from "../../types/tools.ts";
import type { Memory } from "../../types/memory.ts";

const memoryStore: ToolHandler = async (input) => {
  const content = input.content as string;
  const tags = (input.tags as string[]) || [];
  const importance =
    (input.importance as "low" | "medium" | "high") || "medium";

  const memory = storeMemory(content, tags, importance);
  return {
    success: true,
    output: `Memory stored with ID: ${memory.id}`,
  };
};

const memorySearch: ToolHandler = async (input) => {
  const query = input.query as string;
  const tags = input.tags as string[] | undefined;
  const limit = (input.limit as number) || 10;

  const results = findMemories(query, tags, limit);
  if (results.length === 0) {
    return { success: true, output: "No memories found matching the query." };
  }

  const formatted = results.map(
    (m) =>
      `[${m.importance.toUpperCase()}] (${m.id.substring(0, 8)}...) ${m.content}${m.tags.length ? ` [tags: ${m.tags.join(", ")}]` : ""}`,
  );
  return { success: true, output: formatted.join("\n") };
};

const memoryUpdate: ToolHandler = async (input) => {
  const id = input.id as string;
  const updates: Partial<Pick<Memory, "content" | "tags" | "importance">> = {};
  if (input.content) updates.content = input.content as string;
  if (input.tags) updates.tags = input.tags as string[];
  if (input.importance)
    updates.importance = input.importance as Memory["importance"];

  const result = editMemory(id, updates);
  if (!result) {
    return { success: false, output: `Memory with ID '${id}' not found.` };
  }
  return { success: true, output: `Memory ${id} updated.` };
};

const memoryDelete: ToolHandler = async (input) => {
  const id = input.id as string;
  const deleted = removeMemory(id);
  if (!deleted) {
    return { success: false, output: `Memory with ID '${id}' not found.` };
  }
  return { success: true, output: `Memory ${id} deleted.` };
};

const memoryList: ToolHandler = async (input) => {
  const limit = (input.limit as number) || 20;
  const tagsFilter = input.tags as string[] | undefined;

  let memories = listActiveMemories(limit);
  if (tagsFilter && tagsFilter.length > 0) {
    memories = memories.filter((m) =>
      tagsFilter.some((t) => m.tags.includes(t)),
    );
  }

  if (memories.length === 0) {
    return { success: true, output: "No active memories." };
  }

  const formatted = memories.map(
    (m) =>
      `[${m.importance.toUpperCase()}] (${m.id.substring(0, 8)}...) ${m.content}${m.tags.length ? ` [tags: ${m.tags.join(", ")}]` : ""}`,
  );
  return { success: true, output: formatted.join("\n") };
};

export const memoryTools: ToolDefinition[] = [
  {
    name: "memory_store",
    description:
      "Store a new persistent memory about the user. Use this to save important information that should be remembered across sessions.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The content of the memory to store",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for categorization",
        } as unknown as Record<string, unknown>,
        importance: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Importance level of the memory (default: medium)",
        } as unknown as Record<string, unknown>,
      },
      required: ["content"],
    },
  },
  {
    name: "memory_search",
    description:
      "Search through stored memories by query text and optional tags",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against memory content",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags to filter by",
        } as unknown as Record<string, unknown>,
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "memory_update",
    description: "Update an existing memory by its ID",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the memory to update" },
        content: { type: "string", description: "New content for the memory" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags for the memory",
        } as unknown as Record<string, unknown>,
        importance: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "New importance level",
        } as unknown as Record<string, unknown>,
      },
      required: ["id"],
    },
  },
  {
    name: "memory_delete",
    description: "Delete a memory by its ID",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the memory to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "memory_list",
    description: "List all active memories, optionally filtered by tags",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of memories to return (default: 20)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags to filter by",
        } as unknown as Record<string, unknown>,
      },
    },
  },
];

export const memoryHandlers: Record<string, ToolHandler> = {
  memory_store: memoryStore,
  memory_search: memorySearch,
  memory_update: memoryUpdate,
  memory_delete: memoryDelete,
  memory_list: memoryList,
};
