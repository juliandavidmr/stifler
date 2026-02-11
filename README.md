# Stifler CLI

<p align="center">
  <img src="https://static.wikia.nocookie.net/americanpie/images/0/0c/Oyln2i2l.png/revision/latest/scale-to-width-down/1200?cb=20250623122741" alt="Stifler" width="400" />
</p>

<p align="center"><em>Yes, named after <strong>that</strong> Stifler.</em></p>

> **⚠️ Development version** — This project is under active development. Things may break, features may vanish overnight, and your terminal might get a little too chatty. You've been warned.

## What is Stifler?

You know that friend who remembers _everything_ you told them, can dig through your files faster than you can say "where did I put that?", and never sleeps? That's Stifler — except it won't eat your leftovers.

Stifler is an interactive command-line AI assistant powered by Claude. It lives in your terminal, reads and writes files, remembers things across sessions (unlike your coworker), and connects to external services via MCP. Think of it as your overachieving CLI buddy that actually _wants_ to help.

Built because GUIs are for people who enjoy clicking things.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Database**: SQLite (via `bun:sqlite`)
- **AI**: [Anthropic SDK](https://docs.anthropic.com) (Claude)
- **Rendering**: Markdown in terminal via `marked` + `marked-terminal`

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/juliandavidmr/stifler.git
cd stifler
bun install
```

### Usage

```bash
bun run start
```

Development mode with hot-reload:

```bash
bun run dev
```

On first run, you'll be prompted for your Anthropic API key. You can also set it via the `ANTHROPIC_API_KEY` environment variable.

## CLI Commands

| Command                     | Description                 |
| --------------------------- | --------------------------- |
| `/help`                     | Show available commands     |
| `/config`                   | Show current configuration  |
| `/config set <key> <value>` | Set a config value          |
| `/tools`                    | List tools and their status |
| `/tools enable <group>`     | Enable a tool group         |
| `/tools disable <group>`    | Disable a tool group        |
| `/mcp`                      | List MCPs and their status  |
| `/mcp connect <type> <url>` | Connect an MCP              |
| `/mcp disconnect <id>`      | Disconnect an MCP           |
| `/memory`                   | List active memories        |
| `/memory add`               | Add a memory manually       |
| `/memory delete <id>`       | Delete a memory             |
| `/clear`                    | Clear chat history          |
| `/export`                   | Export history to file      |
| `/exit`                     | Exit the application        |

## Tool Groups

| Group          | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| **filesystem** | Read, write, list, and delete files (requires allowed paths configuration) |
| **memory**     | Store and search persistent memories across sessions                       |

All tool groups are enabled by default.

## Data Storage

All data is stored locally in `~/.stifler/data.db` (SQLite). No data is sent anywhere other than the Anthropic API for chat completions.

## License

MIT
