#!/usr/bin/env bun
import chalk from "chalk";
import { isFirstRun, getDb } from "./db/connection.ts";
import { runMigrations } from "./db/migrations.ts";
import { getConfig, setApiKey } from "./config/manager.ts";
import { startRepl } from "./repl.ts";
import { prompt } from "./cli/prompts.ts";
import { closeDb } from "./db/connection.ts";

async function setup(): Promise<void> {
  console.log("");
  console.log(chalk.bold("Welcome to Stifler! 🚀"));
  console.log(chalk.dim("Initial setup...\n"));

  const apiKey = await prompt("Enter your Anthropic API key: ");

  if (!apiKey) {
    console.log(
      chalk.red(
        "API key is required. You can configure it later with /config set anthropic_api_key <key>",
      ),
    );
    console.log(
      chalk.dim("You can also use the ANTHROPIC_API_KEY environment variable"),
    );
  } else {
    setApiKey(apiKey);
    console.log(chalk.green("✓ API key configured"));
  }

  console.log("");
}

async function main(): Promise<void> {
  const firstRun = isFirstRun();

  // Initialize database
  getDb();
  runMigrations();

  if (firstRun) {
    await setup();
  }

  // Verify we have an API key
  const config = getConfig();
  if (!config.anthropicApiKey) {
    console.log(chalk.yellow("⚠ No API key configured."));
    console.log(
      chalk.dim("Configure with /config set anthropic_api_key <your-key>"),
    );
    console.log(
      chalk.dim("Or use the ANTHROPIC_API_KEY environment variable\n"),
    );
  }

  await startRepl();
}

// Cleanup on exit
process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDb();
  process.exit(0);
});

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err.message);
  closeDb();
  process.exit(1);
});
