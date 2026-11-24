---
name: session-handoff
user-invocable: false
description: Save and resume work across sessions without loading the whole previous conversation. Use when the user wants to "wrap up the session", "save a handoff", "summarize the session to a file", "start from the last session", "continue from the previous window", or types /handoff or /pickup. Works in ANY project (code and content), sections adapt to the project. Triggers: handoff, wrap session, save session, continue work, pickup, resume last session, clean session, pass the context, zapisz handoff, czysta sesja, przekaż kontekst, wznów sesję.
---

# Session Handoff

Carry context between sessions with the **"document & clear"** method: near the end of a session (while the model still remembers everything sharply) you save a **short, curated file**, and you start the new, clean session by reading **only that file**, not the whole old conversation.

Why this beats auto-`/compact`: compaction fires when the context is FULL (the model is already dulled) and produces "summaries of summaries" that distort decisions. A handoff is written consciously, earlier, in one selective pass.

## Two modes

- **SAVE mode** (`/handoff`): write or update the handoff file for the current session.
- **RESUME mode** (`/pickup`): read the newest handoff and get up to speed without loading history.

## Where files live and how to name them

- Folder: `session-logs/` in the project root (create it if missing).
- Name: `YYYY-MM-DD-slug.md`, where `slug` is 2-4 words describing what the session was about.
- Each thread gets its own file; nothing is overwritten. If **today's file on the same topic** already exists, **update it** instead of creating a second one.
- `session-logs/` may also hold plain logs and brainstorms; handoffs are distinguished by the `kind: handoff` frontmatter (`/pickup` filters on it).

## File format (adaptive)

The frontmatter header is fixed, the sections adapt to the project. **Skip sections that do not fit**: no `git/branch` in a writing project, no "published video link" in a code project.

```markdown
---
kind: handoff
date: YYYY-MM-DD
topic: <slug>
status: in-progress | done | blocked
---

# <Header: one sentence on what the session was about>

## Summary
2-4 sentences: what we did and why.

## Key takeaways / decisions
- decision + **why** (this is the know-how that led to the goal)
- ...

## State
- ✅ done: ...
- 🔄 in progress: ...
- ⛔ blocked / waiting for: ...

## Artifacts
- paths to files we created or changed
- [code] branch / PR / tests
- [content] link to the published piece, draft folder

## Next step
Exactly where to start in the new session (one concrete move).

## What NOT to do
Dead ends and rejected approaches, so the new session does not go back there.
```

Adaptation rule: always keep **Summary, Takeaways, State, Next step**; add the rest only when it makes sense for the project.

## When to save (discipline)

- **Do it at ~50-60% context usage, not at 90%.** Earlier means a sharper, better summary.
- Natural moments: closing a thread, before switching tasks, end of the day on a topic.
- **Do not interrupt a working implementation halfway** just because the context meter grew; finish the micro-step, then save.

## Persistent memory vs handoff (keep them separate)

- **`session-logs/<...>.md` (handoff)** = the ephemeral state of ONE task. Deletable once the task is closed.
- **The project's persistent memory** (e.g. `MEMORY.md` / Claude Code memory) = durable facts that outlive everything (preferences, project decisions, references).
- During `/handoff`: if a **durable fact** came up in the session (not just task state), offer to add it to persistent memory, not to the handoff.

## RESUME mode (/pickup): what to do

1. Find the **newest** file with `kind: handoff` in `session-logs/` (or the topic/path the user pointed to).
2. Read **only that file**. Do not load the history of old sessions.
3. Take a light look at reality: `git status`/`git diff --stat` (code) or `ls` of the working folder (content), to verify the file matches the real state.
4. Summarize in ~3 lines: **where we are → next step → what to avoid**. Wait for confirmation before moving on.

## Emergency: when auto-compact caught you anyway

If the context got compacted before you saved a handoff, stick to this while salvaging:
- **KEEP**: current goal, changed files, decisions, errors/tests, next step.
- **SUMMARIZE**: exploration, debugging paths, general discussion.
- **DROP**: repetitive logs, dead ends.
Then immediately save `/handoff` to persist it on disk.
