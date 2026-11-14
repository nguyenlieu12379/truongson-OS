# 3d-walkthrough-realism (draft skill)

A copy of `.claude/skills/3d-walkthrough/` with the future process added. **Not active**: it sits here, outside `.claude/skills/`, so it never loads or triggers. The live skill is unchanged.

## What is different from the live skill

- New **step 5b, realism pass**: render the Blender walkthrough as the master, then wrap a realistic look onto it room by room. Real footage first. Dreamina AI video for rooms with no usable footage. Blender always keeps the point of view.
- **Step 7 (verify)**: realistic shots must line up with the Blender render.
- **Step 8 (deliver)**: say which rooms use real footage and which use Dreamina.
- **Rules**: Blender owns the point of view; real footage before Dreamina; label AI shots for clients.
- New reference: `references/realism-pass.md` (how to do the pass, the review, and the open decisions).

Everything else (inputs, study, route, Blender model, website, copy, film) is the same as the live skill.

## Before activating

1. Set up Dreamina access (manual or API) and decide who pays.
2. Decide how the site shows the realistic version (see `references/realism-pass.md#open-decisions`).
3. Test step 5b on one build, for example the coastal cottage (`projects/coastal-cottage/`).
4. Move this folder to `.claude/skills/3d-walkthrough-realism/` (or merge into the live skill), update its paths from `.claude/skills/3d-walkthrough/` to its own folder, list it in `CLAUDE.md` and `AGENTS.md`, and run `scripts/sync-codex-skills.sh`.
