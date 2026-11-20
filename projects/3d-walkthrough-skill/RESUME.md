# Resume: /3d-walkthrough skill build (2026-11-20)

Handoff from a long session (Son). Start the next session by reading this, then `.claude/skills/3d-walkthrough/SKILL.md`.

## Where we are

The skill is rewritten and on `main` (PRs #46 to #52). The whole pipeline works except the AI video step, which has never run.

- **Clients:** F&B only (restaurants, cafes, coffee shops, bars), always real, open venues.
- **Blender = clay structure only** along one continuous camera path. Uses Blender MCP when a local session has it, headless `bpy` in the cloud.
- **Photos = the design.** Paying clients: `references/photo-brief.md` (send to the owner). Pitches: `scripts/maps_photos.cjs` (Google Maps, never published).
- **Video model:** Wan2.1 VACE 1.3B on Kaggle's free GPU (`assets/vace/run_vace.py`, `push_and_fetch.sh`). Free: about 30 GPU hours a week, no card. Hugging Face demos dropped.
- **Site:** one clip per chapter, triggered by scroll, queued, speeds up to 3x to catch up, seamless hand-off. Reference build: `websites/TruongSon-demos/corner-crema-mockup/` (Son confirmed it's smooth).

## Next steps

1. **Kaggle setup (Son, about 5 min, free):** sign up at kaggle.com, verify phone in Settings, Settings > API > Create New Token. Then the session opens the secure credential form for `www.kaggle.com` (never paste the token in chat).
2. **First real VACE run:** one 2.5 s shot. Test inputs: the Corner Crema clay clips (`websites/TruongSon-demos/corner-crema-mockup/clips/`) plus 1 to 3 interior photos. Expect a fix or two (untested on Kaggle: memory on the T4, diffusers version). Then update step 6 of the skill with what worked.
3. **First real venue:** pick an F&B lead, get photos (owner brief or Maps for a pitch), run the skill end to end in the cloud.

## Constraints and preferences (Son)

- No money: free tools only.
- Prefers cloud sessions (often runs work from his phone with his computer off). Local Blender MCP is a nice-to-have.
- Updates go to `main` through a PR and merge.
- Il Dante Caffe is dropped. Don't publish third-party photos or clips made from them.
- Short, plain answers. One task per session; keep memory in the repo, not the chat.

## Links

- Simple workflow doc: https://claude.ai/artifact/GaBuv1a7av4scqz1xgVk9E
- Corner Crema mockup page: https://claude.ai/artifact/Bq3GnN6VJH1ZcqbqzKDHrM
- Decisions: `decisions/log.md`, entries dated 2026-11-20.
