import chalk from "chalk";
import { getToolHandler, isNativeTool } from "./registry.ts";
import type { ToolExecutionResult } from "../types/tools.ts";
import { createInterface } from "readline";

async function promptUser(message: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  if (!isNativeTool(toolName)) {
    return {
      success: false,
      output: `Unknown tool: ${toolName}. This may be an MCP tool that is not connected.`,
    };
  }

  const handler = getToolHandler(toolName);
  if (!handler) {
    return { success: false, output: `No handler found for tool: ${toolName}` };
  }

  const result = await handler(toolInput);

  if (result.requiresConfirmation) {
    console.log("");
    console.log(chalk.yellow("⚠️  Confirm operation"));
    console.log("");
    console.log(chalk.dim(`   Tool: ${toolName}`));
    console.log(`   ${result.confirmationMessage}`);
    console.log("");

    const answer = await promptUser(chalk.yellow("   Execute? (y/n): "));

    if (answer === "y" || answer === "yes") {
      if (result._execute) {
        return await result._execute();
      }
      return {
        success: true,
        output: "Operation confirmed but no executor found.",
      };
    } else {
      return { success: false, output: "Operation rejected by user." };
    }
  }

  return result;
}
