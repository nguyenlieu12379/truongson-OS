---
name: pre-build
description: Ask Son or Truong their preferences before a website build, and save the answers to the build's PREFS.md. Runs automatically before every /scroll-craft run (a hook reminds you), and on its own when someone says "pre-build", "ask me before you build", or starts a new client site. Covers who is asking, client and assets, vibe, hero, journey, feeling and peak, signature move, style, world, UI material, motion and performance, facts to confirm, the one action, and deploy.
---

# Pre-build

Collect the build preferences **before** anything is planned or generated, in one pass, then hand them to scroll-craft. Built from the questions that shaped the Delícias build (2026-11-22/23), so the next build starts where that one ended instead of finding out halfway through.

**Always runs before `/scroll-craft`.** If scroll-craft was invoked first, stop at its Step 0, run this, then continue scroll-craft with the answers.

## 1. Load what is already known

Read, if they exist:
- `references/standing-preferences.md` in this skill: Son and Truong's defaults from past builds.
- The build folder: `websites/TruongSon-demos/scrollcraft/builds/<client>/` (`RESEARCH.md`, `assets/source/SOURCES.md`, any old `PREFS.md` or `BRIEF.md`).
- The newest handoff in `session-logs/` for this client.

Fill every answer you can from those, and show it as the default ("Last time: X. Same?"). Never ask something the files already answer; ask to confirm it instead.

## 2. Ask the questions, all in one message

Start with **"Son or Truong?"** unless the session already says. Then ask the rest as one numbered list. Short lines, our voice, no em dashes. For each, give the default in brackets so "same" or "u decide" is a one-word answer.

1. **Client and folder.** Which business, and is the research done? [the client in the latest handoff]
2. **Photos.** Where do they come from (their Instagram, Google, client upload)? Should I show you the picks before saving? Any off limits (people, kids, text graphics)? Generated images allowed? [their Instagram via Chrome; show picks first; no people or kids; no generated images]
3. **Vibe.** 3 to 5 words, plus references that aren't websites. Or "match their IG". [match their IG]
4. **Hero.** Which product is the hero (the one they love most)? Real cutout in front of big text? What happens to the letters it covers? [their signature product, real cutout one layer in front of the brand word, covered letters animate]
5. **Journey.** What should the visitor see first, next, last? Or "u decide". [u decide]
6. **Feeling and the one moment.** How should it feel stage by stage, and what's the one moment people tell a friend about? Or "u decide". [u decide]
7. **Signature move.** The one thing no other site does. Or "u decide". [u decide]
8. **Style.** How far from premium-minimal: playful, maximalist, editorial, retro, brutalist, dense, minimal? Or "fit their IG". [fit their IG]
9. **World.** One unbroken world, or separate scenes? [unbroken]
10. **UI material.** Liquid glass (clear lens, no blur, no frost, thin rim, bends at edges, cursor lens), solid cards, or something else? Cursor effects? [liquid glass, clear lens, cursor lens and rim light]
11. **Motion and speed.** Smooth first, or effects first? Must it be checked on a real phone? [smooth first; real phone before the client sees it]
12. **Facts to confirm.** Phone or WhatsApp, hours, owner's name, languages on the page (English, Portuguese, Vietnamese...). [use only what their own listing or IG says; flag any conflict]
13. **The one action.** One button label used everywhere. [Order on WhatsApp]
14. **Deploy.** Local only, or live on GitHub Pages? Hidden from Google (noindex)? [local until you say; noindex when live]

If the answer to a question is "u decide", write **authored** next to it and decide it yourself later in BRIEF.md. That is delegation, not a gap.

## 3. Save the answers

Write `websites/TruongSon-demos/scrollcraft/builds/<client>/PREFS.md` right after the answers arrive:

```markdown
# Pre-build preferences: <client>

Asked <YYYY-MM-DD>. Answered by: <Son | Truong>.

| # | Topic | Answer (their words) | Default used? |
|---|---|---|---|
| 1 | Client and folder | ... | yes / no |
...

## Changes from standing preferences
- <anything that differs from references/standing-preferences.md, or "none">
```

Keep their words verbatim. Mark which answers came from defaults.

If an answer changes a standing preference for future builds (not just this client), update `references/standing-preferences.md` and say so in one line.

## 4. Hand off to scroll-craft

Continue with scroll-craft. In its Step 0, reuse PREFS.md: its eight interview topics map to questions 3 to 9 and 2 above. Ask only what PREFS.md left open. Put the answers in BRIEF.md as usual, and link PREFS.md from it.

Carry the non-scroll-craft answers through the build:
- 10 and 11 decide the UI material and the performance budget.
- 12 goes in RESEARCH.md as "to confirm" until the client confirms.
- 13 is the CTA label everywhere on the page.
- 14 decides whether the build is added to `.github/workflows/deploy-pages.yml`. Never deploy without a "live" answer.

## Rules

- One message of questions, not a drip. Follow-ups only for real contradictions.
- Don't ask what a file already answers; confirm it.
- No em dashes, short sentences, casual (see `references/voice.md` at the repo root).
- Log a decision in `decisions/log.md` only if an answer changes a standing rule (for example, a new must-have).
