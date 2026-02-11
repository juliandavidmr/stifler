import chalk from "chalk";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(
  markedTerminal({
    reflowText: true,
    width: Math.min(process.stdout.columns || 80, 100),
  }),
);

export function formatAssistantMessage(text: string): string {
  try {
    return (marked.parse(text) as string).trim();
  } catch {
    return text;
  }
}

export function formatError(message: string): string {
  return chalk.red(`✗ ${message}`);
}

export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

export function formatHeader(config: {
  model: string;
  tools: string[];
  mcps: string[];
}): string {
  const toolsStr = config.tools.length > 0 ? config.tools.join(", ") : "none";
  const mcpsStr = config.mcps.length > 0 ? config.mcps.join(", ") : "none";

  return [
    chalk.dim("╭─────────────────────────────────────────────────╮"),
    chalk.dim("│") +
      chalk.bold.white("  Stifler v0.1.0") +
      " ".repeat(33) +
      chalk.dim("│"),
    chalk.dim("│") +
      `  Model: ${chalk.cyan(config.model)}`.padEnd(57) +
      chalk.dim("│"),
    chalk.dim("│") +
      `  Tools: ${chalk.green(toolsStr)} ${chalk.dim("|")} MCPs: ${chalk.green(mcpsStr)}`.padEnd(
        57,
      ) +
      chalk.dim("│"),
    chalk.dim("╰─────────────────────────────────────────────────╯"),
  ].join("\n");
}

export function formatHelpCommand(
  command: string,
  description: string,
): string {
  return `  ${chalk.yellow(command.padEnd(30))} ${chalk.dim(description)}`;
}
