import { createInterface } from "readline";
import chalk from "chalk";
import { sendMessage, resetClient } from "./core/client.ts";
import { handleCommand } from "./cli/commands.ts";
import {
  formatAssistantMessage,
  formatError,
  formatHeader,
} from "./cli/formatter.ts";
import { getConfig } from "./config/manager.ts";
import { getActiveMcpConfigs } from "./mcp/manager.ts";
import { startDaemon, stopDaemon } from "./daemon/index.ts";

function askQuestion(
  rl: ReturnType<typeof createInterface>,
  query: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

export async function startRepl(): Promise<void> {
  const config = getConfig();
  const mcpConfigs = getActiveMcpConfigs();

  console.log("");
  console.log(
    formatHeader({
      model: config.defaultModel,
      tools: config.activeToolGroups,
      mcps: mcpConfigs.map((m) => m.name),
    }),
  );
  console.log("");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  startDaemon();

  rl.on("close", () => {
    stopDaemon();
    console.log(chalk.dim("\nGoodbye!"));
    process.exit(0);
  });

  while (true) {
    const line = await askQuestion(rl, chalk.green("> "));
    const input = line.trim();

    if (!input) continue;

    if (input.startsWith("/")) {
      try {
        await handleCommand(input);
      } catch (err: any) {
        console.log(formatError(err.message));
      }
      continue;
    }

    try {
      const result = await sendMessage(input);

      if (result.text) {
        console.log("");
        console.log(formatAssistantMessage(result.text));
        console.log("");
      }
    } catch (err: any) {
      console.log("");
      console.log(formatError(err.message));
      console.log("");

      if (err.message.includes("API key")) {
        resetClient();
      }
    }
  }
}
