---
name: site-building
description: The one site-building skill for Son and Truong's websites, run in order. Stage 1 pre-build asks the client preferences and saves PREFS.md. Stage 2 scroll-craft builds the scroll-driven landing page. Stage 3 liquid-glass adds the glass layer (theme toggle, cursor ball, glass buttons, venom strands). Use for any website build, a new client site, "build a site", "scrollcraft", "scroll craft", "pre-build", "liquid glass", or "glass venom". Stage 1 always runs before stage 2.
---

# Build

**Read `FAILURES.md` first, every time, before stage 1.** It lists builds Son and Truong marked as failures and the patterns to avoid. BRIEF.md must say how the new build avoids each one.

Run the stages in order. Each stage's file holds its detail.

| Stage | File | Does | Output |
|---|---|---|---|
| 1 pre-build | `01-prebuild.md` | One message of questions, then saves the answers | `PREFS.md` in the build folder |
| 2 scroll-craft | `02-scroll-craft.md` | Brief (reusing PREFS), grammar, fingerprint gate, build, Playwright scroll check | page in `websites/TruongSon-demos/scrollcraft/builds/<name>/` |
| 3 liquid-glass | `03-liquid-glass.md` | Theme sweep, cursor ball (56px), glass buttons, optional venom | glass assets copied into the site |

## Modes

- `/site-building` runs stage 1, then 2, then 3 if the pre-build answers ask for glass.
- `/site-building scroll` runs stage 2 only. Run stage 1 first unless this session's PREFS.md exists.
- `/site-building glass` runs stage 3 only, on a site that already exists.

## Rules

- **FAILURES.md before stage 1, every time.** No exceptions for autopilot.
- **Stage 1 before stage 2, every time.** Autopilot or "don't ask me" never skips the stage 1 questions. A settings hook reminds Claude when a prompt mentions scroll-craft. Skip stage 1 only if the build's PREFS.md exists and is from this session.
- **Stage 3 comes after the page exists.** Glass goes over a finished layout.
- **Scripts run from the repo root:** `node .claude/skills/site-building/scripts/<name>`.
- **Shared folders:** `references/`, `engine/`, `scripts/`, `templates/` (stage 2); `assets/`, `examples/` (stage 3); `agents/`, `hooks/` (stage 1).
- **Provenance:** `VENDORED.md` lists the scroll-craft upstream commit. Everything else is ours.
