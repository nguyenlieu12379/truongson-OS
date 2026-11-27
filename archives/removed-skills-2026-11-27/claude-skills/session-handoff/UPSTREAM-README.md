# handoff-skill: /handoff + /pickup for Claude Code

A Claude Code skill for managing context across sessions. Instead of letting `/compact` decide what the model remembers, you save a short curated handoff note and start the next session with a clean window, reading only that note.

The method matches what Anthropic describes as **structured note-taking** in [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): persistent notes kept outside the context window and pulled back in later sessions.

## Why not /compact?

- `/compact` kicks in when the context is already stuffed, and at that point the model is "dulled" and decides on its own what matters.
- Every compression loses something: compress a photo and you lose detail, compress a session and you lose decisions. Compact after compact is a photocopy of a photocopy.
- A handoff is written deliberately and early (at roughly 50-60% context usage), in one selective pass. It is a plain markdown file in your project, so you can review and correct it.

## How it works

1. The session gets heavy, so you type **`/handoff`**. The agent writes a structured note to `session-logs/YYYY-MM-DD-topic.md`: summary, decisions, state (done / in progress / blocked), artifacts, the next step, and **what NOT to do** (dead ends).
2. You clear the window (**`/clear`**) or open a new terminal.
3. In the fresh session you type **`/pickup`**. The agent reads **only the newest handoff** (not the old conversation), verifies reality (`git status` / `ls`) and summarizes: where we are, the next step, what to avoid.

## Installation

```bash
git clone https://github.com/simplybychris/handoff-skill.git
cd handoff-skill

mkdir -p ~/.claude/skills ~/.claude/commands
cp -R skills/session-handoff ~/.claude/skills/
cp commands/handoff.md commands/pickup.md ~/.claude/commands/
```

From now on `/handoff [optional-topic]` and `/pickup [optional-topic]` work in every project.

## When to hand off (rough thresholds)

- Models with smaller windows: around **100k tokens**.
- A standard 200k window: around **200k tokens** is already the risk zone, aim earlier.
- A 1M window: around **300-400k tokens**.
- Universal rule: **~50-60% of the context meter, not 90%**. And do not interrupt a working implementation mid-step just because the meter grew; finish the micro-step, then save.

Research (including "Lost in the Middle" and Chroma's test of 18 models) shows that the longer the context, the more often a model loses information from the middle of the conversation, even on trivial tasks.

## Repo structure

```
handoff-skill/
├── skills/session-handoff/SKILL.md   # the skill (mechanics, file format, rules)
├── commands/handoff.md               # /handoff, save mode
└── commands/pickup.md                # /pickup, resume mode
```

## License

MIT
