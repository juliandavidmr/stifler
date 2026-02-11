import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config/manager.ts";
import { getToolDefinitions } from "../tools/registry.ts";
import { executeTool } from "../tools/executor.ts";
import { buildAnthropicMessages } from "./message-builder.ts";
import { buildMemoryBlock, hasMemories } from "../memory/injector.ts";
import { getActiveMcpConfigs } from "../mcp/manager.ts";
import {
  getSessionMessages,
  addUserMessage,
  addAssistantMessage,
  addToolUseMessage,
  addToolResultMessage,
} from "./session.ts";
import chalk from "chalk";

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function createSpinner(text: string) {
  let frameIndex = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    start(msg?: string) {
      const label = msg || text;
      timer = setInterval(() => {
        process.stderr.write(
          `\r${chalk.cyan(spinnerFrames[frameIndex % spinnerFrames.length])} ${label}`,
        );
        frameIndex++;
      }, 80);
      return this;
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        process.stderr.write("\r\x1b[K");
      }
    },
  };
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const config = getConfig();
  client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

export function resetClient(): void {
  client = null;
}

function buildSystemPrompt(): string {
  const config = getConfig();
  const parts: string[] = [];

  if (config.systemPromptBase) {
    parts.push(config.systemPromptBase);
  } else {
    parts.push(
      "You are a command-line assistant with access to local tools and external services.",
    );
  }

  const capabilities: string[] = [];

  if (config.activeToolGroups.includes("filesystem")) {
    capabilities.push(
      "- You can read, write, and manipulate files in the user's allowed paths.",
    );
  }
  if (config.activeToolGroups.includes("memory")) {
    capabilities.push(
      "- You can store and retrieve persistent memories about the user.",
    );
    capabilities.push(
      "- Use memory_store to save important information the user wants to remember.",
    );
    capabilities.push("- Memories persist across sessions.");
  }

  const mcpConfigs = getActiveMcpConfigs();
  if (mcpConfigs.length > 0) {
    const mcpNames = mcpConfigs.map((m) => m.name).join(", ");
    capabilities.push(`- You have access to external services: ${mcpNames}`);
  }

  if (capabilities.length > 0) {
    parts.push("\nCURRENT CAPABILITIES:");
    parts.push(capabilities.join("\n"));
  }

  if (hasMemories()) {
    parts.push("\nUSER MEMORIES:");
    parts.push(buildMemoryBlock());
    parts.push(
      "Use this information to personalize your responses. Do not explicitly mention that you have these memories unless it is relevant.",
    );
  }

  parts.push("\nGUIDELINES:");
  parts.push("- Be direct and concise (this is a CLI, not a web chat).");
  parts.push("- When using tools, briefly explain what you are going to do.");
  parts.push(
    "- If a file operation fails due to permissions, suggest the user add the path to allowed paths.",
  );
  parts.push(
    "- For memories: only store truly relevant and long-lasting information.",
  );

  return parts.join("\n");
}

export interface SendMessageResult {
  text: string;
  toolsUsed: string[];
}

export async function sendMessage(
  userInput: string,
): Promise<SendMessageResult> {
  const config = getConfig();
  const anthropic = getClient();

  addUserMessage(userInput);

  const tools = getToolDefinitions(config.activeToolGroups);
  const mcpConfigs = getActiveMcpConfigs();
  const toolsUsed: string[] = [];

  const spinner = createSpinner("Thinking...").start();

  try {
    let continueLoop = true;

    while (continueLoop) {
      const messages = buildAnthropicMessages(getSessionMessages());
      const systemPrompt = buildSystemPrompt();

      const requestBody: Anthropic.MessageCreateParamsNonStreaming = {
        model: config.defaultModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        ...(tools.length > 0 ? { tools: tools as Anthropic.Tool[] } : {}),
      };

      const response = await anthropic.messages.create(requestBody);

      continueLoop = false;
      let textContent = "";

      for (const block of response.content) {
        if (block.type === "text") {
          textContent += block.text;
        } else if (block.type === "tool_use") {
          spinner.stop();

          const toolName = block.name;
          const toolInput = block.input as Record<string, unknown>;

          console.log(chalk.cyan(`[tool] ${toolName}`));
          toolsUsed.push(toolName);

          addToolUseMessage(block.id, toolName, toolInput);

          const result = await executeTool(toolName, toolInput);
          const resultContent = result.success
            ? result.output
            : `Error: ${result.output}`;

          addToolResultMessage(block.id, resultContent);

          if (response.stop_reason === "tool_use") {
            continueLoop = true;
            spinner.start("Thinking...");
          }
        }
      }

      if (textContent) {
        addAssistantMessage(textContent);
      }

      if (!continueLoop && textContent) {
        spinner.stop();
        return { text: textContent, toolsUsed };
      }
    }

    spinner.stop();
    return { text: "", toolsUsed };
  } catch (error: any) {
    spinner.stop();

    if (error.status === 401) {
      throw new Error("Invalid API key. Use /config to reconfigure.");
    }
    if (error.status === 429) {
      throw new Error("Rate limit reached. Wait a moment and try again.");
    }
    if (error.status === 529) {
      throw new Error("API overloaded. Try again in a few seconds.");
    }

    throw new Error(`API error: ${error.message}`);
  }
}
