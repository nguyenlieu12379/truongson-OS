# Vendored: session-handoff

Source: https://github.com/simplybychris/handoff-skill
Commit: 8990d64805fe340c9e79f59db5a93da273559dc6
License: MIT (detechtive.pl). See `LICENSE`.
Copied: 2026-11-22. `skills/session-handoff/SKILL.md` to this folder, upstream `README.md` as `UPSTREAM-README.md`, and `commands/handoff.md` + `commands/pickup.md` to `.claude/commands/`.
Excluded: .git. Markdown only, no scripts.
Read-only vendor copy. Update by re-cloning and re-copying, then bumping the commit line.

## How we use it

- `/handoff [topic]` writes `session-logs/YYYY-MM-DD-topic.md`: summary, decisions, state, next step, what not to do.
- `/pickup [topic]` reads only the newest handoff and checks it against the real files.
- Main use: move work from a cloud session to a local session on Son's or Truong's computer (browser access, logins), or start a clean window when a session gets long.
- Handoffs are task state only. Durable facts go to `context/`, `decisions/log.md` or `references/`.

## Local changes

- `SKILL.md` frontmatter: added `user-invocable: false` so the `/` menu shows only `/handoff` and `/pickup`, not a duplicate `/session-handoff`. Re-add after an upstream update.
