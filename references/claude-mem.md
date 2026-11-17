# claude-mem (persistent memory plugin)

Source: https://github.com/thedotmack/claude-mem (Apache-2.0, checked at v15.19.0, commit 3d1aa47).

## What it does

- Hooks record what Claude does in each session (prompts, tool calls, files touched).
- An "observer" model compresses that into short observations and session summaries.
- The next session in the same project starts with those notes injected, so Claude picks up where it left off.
- Search old work with the `mem-search` skill or its MCP tools. Viewer at the worker URL it prints (default http://localhost:37777).

## How it is wired here

- `.claude/settings.json` registers the `thedotmack` marketplace for this repo. Claude Code offers it when you trust the folder.
- The plugin itself is installed per computer, not in the repo. Memory lives in `~/.claude-mem` on that computer.

## Install (each of Son and Truong, on your own computer)

Needs Node 20.19+ or 22.12+. Bun and uv install themselves.

```bash
npx claude-mem install
```

Or inside Claude Code in this repo:

```
/plugin install claude-mem@thedotmack
```

Then restart Claude Code. Your second session in this repo opens with memory from the first.

## Choices you make at install

- **Memory provider** (who runs the observer):
  - your Anthropic plan (free, uses some of your plan's usage), or
  - your own OpenRouter or Gemini key, or
  - the claude-mem observer: 30-day trial, asks for a payment method, paid after that.
  - Cheapest: your Anthropic plan. Skip the trial unless usage gets tight.
- **Telemetry:** on by default (anonymous). Turn off: `npx claude-mem telemetry disable`.
- **Cloud sync:** off by default. Leave it off. Client details stay on your machine.

## Rules for this repo

- Wrap anything secret in `<private>...</private>` in a prompt. It is never stored.
- Never paste API keys or client passwords into chat anyway (same rule as always).
- Memory is per person and per computer. It does not replace `decisions/log.md`, `context/` or `brainstorms/`. Shared facts still go in those files.

## Cloud sessions (claude.ai/code)

Not useful there: the container is wiped after each session, so `~/.claude-mem` is lost. Cloud sessions keep using the repo files as memory.

## Check or remove

```bash
npx claude-mem doctor
```

```
/plugin uninstall claude-mem@thedotmack
```
