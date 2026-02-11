import chalk from "chalk";
import {
  getConfig,
  setApiKey,
  setModel,
  setActiveToolGroups,
  setConfigByKey,
  getMaskedApiKey,
  addFilesystemAllowedPath,
} from "../config/manager.ts";
import { getAllGroups } from "../tools/registry.ts";
import {
  listMcps,
  connectMcp,
  disconnectMcp,
  PREDEFINED_MCPS,
} from "../mcp/manager.ts";
import {
  listActiveMemories,
  storeMemory,
  removeMemory,
} from "../memory/manager.ts";
import { clearSession, getSessionMessageCount } from "../core/session.ts";
import {
  formatHelpCommand,
  formatError,
  formatSuccess,
  formatWarning,
} from "./formatter.ts";
import { prompt, promptSecret } from "./prompts.ts";
import { writeFileSync } from "fs";
import { getMessages } from "../db/repositories/messages.repo.ts";
import type { ToolGroup } from "../types/tools.ts";

export async function handleCommand(input: string): Promise<boolean> {
  const parts = input.trim().split(/\s+/);
  const command = parts[0]!.toLowerCase();

  switch (command) {
    case "/help":
      showHelp();
      return true;

    case "/config":
      await handleConfig(parts.slice(1));
      return true;

    case "/tools":
      await handleTools(parts.slice(1));
      return true;

    case "/mcp":
      await handleMcp(parts.slice(1));
      return true;

    case "/memory":
      await handleMemory(parts.slice(1));
      return true;

    case "/clear":
      clearSession();
      console.log(
        formatSuccess("Chat history cleared. Memories are preserved."),
      );
      return true;

    case "/export":
      await handleExport();
      return true;

    case "/exit":
    case "/quit":
      console.log(chalk.dim("Goodbye!"));
      process.exit(0);

    default:
      console.log(
        formatError(
          `Unknown command: ${command}. Use /help to see available commands.`,
        ),
      );
      return true;
  }
}

function showHelp(): void {
  console.log("");
  console.log(chalk.bold("Available commands:"));
  console.log("");
  console.log(formatHelpCommand("/help", "Show this help"));
  console.log(formatHelpCommand("/config", "Show current configuration"));
  console.log(
    formatHelpCommand("/config set <key> <value>", "Set a config value"),
  );
  console.log(formatHelpCommand("/tools", "List tools and their status"));
  console.log(
    formatHelpCommand("/tools enable <group>", "Enable a tool group"),
  );
  console.log(
    formatHelpCommand("/tools disable <group>", "Disable a tool group"),
  );
  console.log(formatHelpCommand("/mcp", "List MCPs and their status"));
  console.log(formatHelpCommand("/mcp connect <type> <url>", "Connect an MCP"));
  console.log(formatHelpCommand("/mcp disconnect <id>", "Disconnect an MCP"));
  console.log(formatHelpCommand("/memory", "List active memories"));
  console.log(formatHelpCommand("/memory add", "Add a memory manually"));
  console.log(formatHelpCommand("/memory delete <id>", "Delete a memory"));
  console.log(formatHelpCommand("/clear", "Clear chat history"));
  console.log(formatHelpCommand("/export", "Export history to file"));
  console.log(formatHelpCommand("/exit, /quit", "Exit the application"));
  console.log("");
}

async function handleConfig(args: string[]): Promise<void> {
  if (args.length === 0) {
    const config = getConfig();
    console.log("");
    console.log(chalk.bold("Current configuration:"));
    console.log("");
    console.log(
      `  ${chalk.dim("API Key:")}         ${getMaskedApiKey(config.anthropicApiKey)}`,
    );
    console.log(`  ${chalk.dim("Model:")}          ${config.defaultModel}`);
    console.log(
      `  ${chalk.dim("Tool Groups:")}     ${config.activeToolGroups.join(", ") || "none"}`,
    );
    console.log(
      `  ${chalk.dim("Active MCPs:")}    ${config.activeMcps.join(", ") || "none"}`,
    );
    console.log(
      `  ${chalk.dim("Allowed paths:")} ${config.filesystemAllowedPaths.join(", ") || "none"}`,
    );
    console.log("");
    console.log(chalk.dim("  Use /config set <key> <value> to change values."));
    console.log(
      chalk.dim(
        "  Keys: anthropic_api_key, default_model, filesystem_allowed_paths",
      ),
    );
    console.log("");
    return;
  }

  if (args[0] === "set" && args.length >= 3) {
    const key = args[1]!;
    const value = args.slice(2).join(" ");

    if (key === "anthropic_api_key") {
      setApiKey(value);
      console.log(formatSuccess(`API key set: ${getMaskedApiKey(value)}`));
    } else if (key === "default_model") {
      setModel(value);
      console.log(formatSuccess(`Model set: ${value}`));
    } else if (key === "filesystem_allowed_paths") {
      addFilesystemAllowedPath(value);
      console.log(formatSuccess(`Path added: ${value}`));
    } else {
      const set = setConfigByKey(key, value);
      if (set) {
        console.log(formatSuccess(`${key} = ${value}`));
      } else {
        console.log(formatError(`Unknown key: ${key}`));
      }
    }
    return;
  }

  console.log(formatError("Usage: /config or /config set <key> <value>"));
}

async function handleTools(args: string[]): Promise<void> {
  if (args.length === 0) {
    const config = getConfig();
    const groups = getAllGroups();

    console.log("");
    console.log(chalk.bold("Tool Groups:"));
    console.log("");
    for (const group of groups) {
      const isActive = config.activeToolGroups.includes(group.name);
      const status = isActive
        ? chalk.green("● active")
        : chalk.dim("○ inactive");
      console.log(
        `  ${status}  ${chalk.white(group.name)} (${group.tools.length} tools)`,
      );
      for (const tool of group.tools) {
        console.log(
          `    ${chalk.dim("─")} ${chalk.dim(tool.name)}: ${chalk.dim(tool.description.substring(0, 60))}`,
        );
      }
    }
    console.log("");
    return;
  }

  const action = args[0];
  const groupName = args[1] as ToolGroup | undefined;

  if (!groupName) {
    console.log(formatError("Specify a group: filesystem, memory"));
    return;
  }

  const config = getConfig();
  const validGroups: ToolGroup[] = ["filesystem", "memory"];

  if (!validGroups.includes(groupName)) {
    console.log(
      formatError(
        `Unknown group: ${groupName}. Valid: ${validGroups.join(", ")}`,
      ),
    );
    return;
  }

  if (action === "enable") {
    if (!config.activeToolGroups.includes(groupName)) {
      config.activeToolGroups.push(groupName);
      setActiveToolGroups(config.activeToolGroups);
    }
    console.log(formatSuccess(`Group '${groupName}' enabled.`));
  } else if (action === "disable") {
    const filtered = config.activeToolGroups.filter((g) => g !== groupName);
    setActiveToolGroups(filtered);
    console.log(formatSuccess(`Group '${groupName}' disabled.`));
  } else {
    console.log(
      formatError("Usage: /tools enable <group> or /tools disable <group>"),
    );
  }
}

async function handleMcp(args: string[]): Promise<void> {
  if (args.length === 0) {
    const mcps = listMcps();
    console.log("");
    console.log(chalk.bold("MCP Connections:"));
    console.log("");
    if (mcps.length === 0) {
      console.log(chalk.dim("  No MCPs configured."));
      console.log("");
      console.log(chalk.dim("  Available MCPs:"));
      for (const mcp of PREDEFINED_MCPS) {
        console.log(
          `    ${chalk.dim("─")} ${mcp.displayName} (${mcp.type}): ${mcp.description}`,
        );
      }
    } else {
      for (const mcp of mcps) {
        const status = mcp.isEnabled
          ? chalk.green("● connected")
          : chalk.dim("○ disconnected");
        console.log(`  ${status}  ${mcp.name} (${mcp.id.substring(0, 8)}...)`);
      }
    }
    console.log("");
    return;
  }

  if (args[0] === "connect" && args.length >= 3) {
    const type = args[1]!;
    const url = args[2]!;
    const conn = connectMcp(type, url);
    if (conn) {
      console.log(
        formatSuccess(
          `MCP '${conn.name}' connected (${conn.id.substring(0, 8)}...)`,
        ),
      );
    } else {
      console.log(formatError("Could not connect MCP."));
    }
    return;
  }

  if (args[0] === "disconnect" && args[1]) {
    const success = disconnectMcp(args[1]);
    if (success) {
      console.log(formatSuccess("MCP disconnected."));
    } else {
      console.log(formatError(`MCP not found: ${args[1]}`));
    }
    return;
  }

  console.log(
    formatError("Usage: /mcp, /mcp connect <type> <url>, /mcp disconnect <id>"),
  );
}

async function handleMemory(args: string[]): Promise<void> {
  if (args.length === 0) {
    const memories = listActiveMemories(20);
    console.log("");
    console.log(chalk.bold("Active memories:"));
    console.log("");
    if (memories.length === 0) {
      console.log(chalk.dim("  No memories stored."));
    } else {
      for (const mem of memories) {
        const imp =
          mem.importance === "high"
            ? chalk.red(mem.importance.toUpperCase())
            : mem.importance === "medium"
              ? chalk.yellow(mem.importance.toUpperCase())
              : chalk.dim(mem.importance.toUpperCase());
        const tags =
          mem.tags.length > 0 ? chalk.dim(` [${mem.tags.join(", ")}]`) : "";
        console.log(
          `  [${imp}] ${chalk.dim(`(${mem.id.substring(0, 8)}...)`)} ${mem.content}${tags}`,
        );
      }
    }
    console.log("");
    return;
  }

  if (args[0] === "add") {
    const content = await prompt("  Content: ");
    if (!content) {
      console.log(formatError("Empty content, operation cancelled."));
      return;
    }
    const tagsInput = await prompt("  Tags (comma-separated, or empty): ");
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const importance =
      (await prompt("  Importance (low/medium/high) [medium]: ")) || "medium";

    const memory = storeMemory(
      content,
      tags,
      importance as "low" | "medium" | "high",
    );
    console.log(formatSuccess(`Memory saved: ${memory.id.substring(0, 8)}...`));
    return;
  }

  if (args[0] === "delete" && args[1]) {
    const deleted = removeMemory(args[1]);
    if (deleted) {
      console.log(formatSuccess("Memory deleted."));
    } else {
      console.log(formatError(`Memory not found: ${args[1]}`));
    }
    return;
  }

  console.log(formatError("Usage: /memory, /memory add, /memory delete <id>"));
}

async function handleExport(): Promise<void> {
  const messages = getMessages();
  if (messages.length === 0) {
    console.log(formatWarning("No messages to export."));
    return;
  }

  const filename = `stifler_export_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = `./${filename}`;

  const exportData = {
    exported_at: new Date().toISOString(),
    message_count: messages.length,
    messages: messages,
  };

  writeFileSync(filepath, JSON.stringify(exportData, null, 2));
  console.log(formatSuccess(`History exported to: ${filepath}`));
}
