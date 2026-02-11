import {
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  statSync,
  existsSync,
} from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { getConfig } from "../../config/manager.ts";
import { BLOCKED_PATHS } from "../../config/defaults.ts";
import type {
  ToolDefinition,
  ToolHandler,
  ToolExecutionResult,
} from "../../types/tools.ts";

function expandPath(p: string): string {
  if (p.startsWith("~")) {
    return join(homedir(), p.slice(1));
  }
  return resolve(p);
}

function isPathAllowed(targetPath: string): {
  allowed: boolean;
  reason?: string;
} {
  const expanded = expandPath(targetPath);

  for (const blocked of BLOCKED_PATHS) {
    const expandedBlocked = expandPath(blocked);
    if (
      expanded === expandedBlocked ||
      expanded.startsWith(expandedBlocked + "/")
    ) {
      return {
        allowed: false,
        reason: `Path '${targetPath}' is in blocked list. Cannot access system paths.`,
      };
    }
  }

  const config = getConfig();
  if (config.filesystemAllowedPaths.length === 0) {
    return {
      allowed: false,
      reason: `No filesystem paths are allowed. Use /config to add allowed paths.`,
    };
  }

  for (const allowed of config.filesystemAllowedPaths) {
    const expandedAllowed = expandPath(allowed);
    if (
      expanded === expandedAllowed ||
      expanded.startsWith(expandedAllowed + "/")
    ) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: `Path '${targetPath}' is not in the allowed paths list. Use /config to add it.`,
  };
}

function checkPath(path: string): ToolExecutionResult | null {
  const check = isPathAllowed(path);
  if (!check.allowed) {
    return { success: false, output: check.reason! };
  }
  return null;
}

const fsReadFile: ToolHandler = async (input) => {
  const path = input.path as string;
  const denied = checkPath(path);
  if (denied) return denied;

  try {
    const expanded = expandPath(path);
    const content = readFileSync(expanded, "utf-8");
    return { success: true, output: content };
  } catch (err: any) {
    return { success: false, output: `Error reading file: ${err.message}` };
  }
};

const fsWriteFile: ToolHandler = async (input) => {
  const path = input.path as string;
  const content = input.content as string;
  const denied = checkPath(path);
  if (denied) return denied;

  const expanded = expandPath(path);
  return {
    success: true,
    output: "",
    requiresConfirmation: true,
    confirmationMessage: `Write to: ${expanded}\n\nContent:\n---\n${content.length > 500 ? content.substring(0, 500) + "\n...(truncated)" : content}\n---`,
    _execute: async () => {
      try {
        writeFileSync(expanded, content, "utf-8");
        return {
          success: true,
          output: `File written successfully: ${expanded}`,
        };
      } catch (err: any) {
        return { success: false, output: `Error writing file: ${err.message}` };
      }
    },
  };
};

const fsListDirectory: ToolHandler = async (input) => {
  const path = input.path as string;
  const recursive = (input.recursive as boolean) || false;
  const denied = checkPath(path);
  if (denied) return denied;

  try {
    const expanded = expandPath(path);
    const entries = listDir(expanded, recursive, 0);
    return { success: true, output: entries.join("\n") };
  } catch (err: any) {
    return {
      success: false,
      output: `Error listing directory: ${err.message}`,
    };
  }
};

function listDir(dirPath: string, recursive: boolean, depth: number): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const result: string[] = [];
  const indent = "  ".repeat(depth);

  for (const entry of entries) {
    const prefix = entry.isDirectory() ? "📁 " : "📄 ";
    result.push(`${indent}${prefix}${entry.name}`);
    if (recursive && entry.isDirectory() && depth < 3) {
      result.push(...listDir(join(dirPath, entry.name), recursive, depth + 1));
    }
  }
  return result;
}

const fsDelete: ToolHandler = async (input) => {
  const path = input.path as string;
  const denied = checkPath(path);
  if (denied) return denied;

  const expanded = expandPath(path);
  return {
    success: true,
    output: "",
    requiresConfirmation: true,
    confirmationMessage: `Delete: ${expanded}`,
    _execute: async () => {
      try {
        rmSync(expanded, { recursive: true });
        return { success: true, output: `Deleted: ${expanded}` };
      } catch (err: any) {
        return { success: false, output: `Error deleting: ${err.message}` };
      }
    },
  };
};

const fsFileInfo: ToolHandler = async (input) => {
  const path = input.path as string;
  const denied = checkPath(path);
  if (denied) return denied;

  try {
    const expanded = expandPath(path);
    if (!existsSync(expanded)) {
      return { success: false, output: `File not found: ${expanded}` };
    }
    const stats = statSync(expanded);
    const info = {
      path: expanded,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      created: new Date(stats.birthtimeMs).toISOString(),
      modified: new Date(stats.mtimeMs).toISOString(),
      permissions: stats.mode.toString(8),
    };
    return { success: true, output: JSON.stringify(info, null, 2) };
  } catch (err: any) {
    return {
      success: false,
      output: `Error getting file info: ${err.message}`,
    };
  }
};

export const filesystemTools: ToolDefinition[] = [
  {
    name: "fs_read_file",
    description: "Read the contents of a file at the specified path",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or ~ prefixed path to the file",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_write_file",
    description:
      "Write content to a file at the specified path. Creates the file if it does not exist.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or ~ prefixed path to the file",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "fs_list_directory",
    description: "List files and directories at the specified path",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or ~ prefixed path to the directory",
        },
        recursive: {
          type: "boolean",
          description: "Whether to list recursively (max depth 3)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_delete",
    description: "Delete a file or directory at the specified path",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or ~ prefixed path to delete",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "fs_file_info",
    description: "Get metadata about a file (size, dates, permissions)",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or ~ prefixed path to the file",
        },
      },
      required: ["path"],
    },
  },
];

export const filesystemHandlers: Record<string, ToolHandler> = {
  fs_read_file: fsReadFile,
  fs_write_file: fsWriteFile,
  fs_list_directory: fsListDirectory,
  fs_delete: fsDelete,
  fs_file_info: fsFileInfo,
};
