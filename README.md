# Stifler CLI

<p align="center">
  <img src="https://static.wikia.nocookie.net/americanpie/images/0/0c/Oyln2i2l.png/revision/latest/scale-to-width-down/1200?cb=20250623122741" alt="Stifler" width="400" />
</p>

<p align="center"><em>Yes, named after <strong>that</strong> Stifler.</em></p>

> **⚠️ Development version** — This project is under active development. Things may break, features may vanish overnight, and your terminal might get a little too chatty. You've been warned.

## What is Stifler?

A terminal-first AI assistant with persistent memory and a proactive daemon that monitors your calendar, email, and memories to notify you of relevant events before you ask.

Stifler lives in your terminal, reads and writes files, remembers things across sessions, creates reminders with native macOS notifications, and connects to external services via MCP. It also runs a background daemon that periodically checks your data sources and uses Claude to decide if something is worth interrupting you for.

Built because GUIs are for people who enjoy clicking things.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Database**: SQLite (via `bun:sqlite`)
- **AI**: [Anthropic SDK](https://docs.anthropic.com) (Claude)
- **Scheduling**: [Croner](https://github.com/hexagon/croner) for daemon jobs and reminders
- **Notifications**: Native macOS notifications via `osascript`
- **Rendering**: Markdown in terminal via `marked` + `marked-terminal`

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- An [Anthropic API key](https://console.anthropic.com)
- macOS (for native notifications)

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
| `/daemon`                   | Show daemon status          |
| `/daemon pause`             | Pause the daemon            |
| `/daemon resume`            | Resume the daemon           |
| `/remind "<text>" <when>`   | Create a reminder           |
| `/remind list`              | List pending reminders      |
| `/remind delete <id>`       | Delete a reminder           |
| `/notifications`            | Show recent notifications   |
| `/clear`                    | Clear chat history          |
| `/export`                   | Export history to file      |
| `/exit`                     | Exit the application        |

## Tool Groups

| Group          | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| **filesystem** | Read, write, list, and delete files (requires allowed paths configuration) |
| **memory**     | Store and search persistent memories across sessions                       |
| **reminders**  | Create, list, and delete reminders with native macOS notifications         |

All tool groups are enabled by default. Claude can also create reminders conversationally (e.g. "remind me to check the PR tomorrow at 3pm").

## Proactive Daemon

Stifler runs a background daemon that starts automatically with the REPL. It:

- **Polls data sources** on a schedule (calendar, Gmail via MCP, memories)
- **Evaluates relevance** using Claude — only notifies you if something actually matters
- **Sends native macOS notifications** for relevant items
- **Deduplicates** seen items so you're never notified twice
- **Respects quiet hours** (configurable, default 22:00–08:00)

### Reminder Time Formats

```
5min, 2h, 30s                     # relative
tomorrow 3pm, today 14:00         # day + time
monday 9am, friday 2pm            # weekday + time
every day 9am, every monday 2pm   # recurrent
12/25 10am, 2024-12-25 10am       # date + time
```

### Daemon Configuration

| Config Key                 | Default                     | Description              |
| -------------------------- | --------------------------- | ------------------------ |
| `daemon_enabled`           | `true`                      | Enable/disable daemon    |
| `daemon_calendar_interval` | `*/5 * * * *`               | Calendar poll schedule   |
| `daemon_gmail_interval`    | `*/5 * * * *`               | Gmail poll schedule      |
| `daemon_memory_check_time` | `0 8 * * *`                 | Memory scan schedule     |
| `daemon_model`             | `claude-haiku-4-5-20250929` | Model for relevance eval |
| `daemon_quiet_hours_start` | `22`                        | Quiet hours start (hour) |
| `daemon_quiet_hours_end`   | `8`                         | Quiet hours end (hour)   |

## Data Storage

All data is stored locally in `~/.stifler/data.db` (SQLite). No data is sent anywhere other than the Anthropic API for chat completions and relevance evaluation.

## License

MIT
