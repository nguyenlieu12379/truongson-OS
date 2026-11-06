# External kits (vendored)

Read-only copies of Sunaii-agency kits, installed for Son and Truong. Do not edit files here. Each folder has a `VENDORED.md` with its source repo and commit. To update, re-clone and re-copy, then bump the commit line.

| When to use it | Path | Entry point |
|---|---|---|
| Design vocabulary for UI work (polish, critique, audit, AI-slop checks). Use when building or reviewing client sites. | `external/impeccable/` | `external/impeccable/skill/SKILL.src.md` (also `external/impeccable/README.md`) |
| Animation and UI design skills (animate, choreograph, review animations, pick UI library). | `external/design-skills/` | `external/design-skills/skills/*/SKILL.md` |
| Taste-driven frontend design skill. Use when a site needs a stronger visual direction. | `external/taste-skill/` | `external/taste-skill/skills/taste-skill/SKILL.md` |
| Video editing and motion graphics (cut mistakes/silences, HyperFrames, short-form). Use for client or Instagram video. | `external/video-edit-kit/` | `external/video-edit-kit/.claude/skills/*/SKILL.md` (Codex mirror in `.agents/skills/`) |
| Autonomous cold-outreach sales agent (finds businesses, writes and sends cold email, works replies). Use for the outbound pipeline. Sends real email: review before running. | `external/sales-agent/` | `external/sales-agent/README.md` |

## Notes

- **Not run on install.** No `install.sh`, `npx`, or setup script has been executed. Each kit's setup is a separate, reviewed step.
- **Excluded from the copy:** `.git`, CI config, build output, `node_modules`, media files, and bulky sample projects (`video-edit-kit/video-projects/`, `examples/`; `impeccable/crates/`, `tests/`).
- **Credentials:** `sales-agent` and `video-edit-kit` have `.env.example` templates only. Real keys go in a local `.env` (gitignored) and never in this repo.
- **Licenses:** each kit keeps its own `LICENSE` file. Check it before reuse outside this business.
- **Skills are active from `.claude/skills/`:** 34 kit skills were copied there (canonical) and mirrored to `.agents/skills/`. The copies under `external/` stay as the source. Re-copy after a kit update.
