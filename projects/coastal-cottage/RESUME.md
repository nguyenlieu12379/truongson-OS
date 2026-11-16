# Resume note: coastal cottage surroundings pass (2026-11-16)

User request (they're away, don't ask anything):
- Surroundings like a Miami coastal road (Ocean Drive feel): busy walking streets with NO people, infrastructure (street lights, traffic lights, crosswalks, curbs, sidewalks, bus shelter, benches, bins, hydrants, parked cars), more realistic houses, dense convenience stores and shopfronts.
- Render and prop distance further (bigger area, thinner fog).
- More realistic colours of the surroundings (muted, natural), shades and shadows (from the bake).
- Beach: surfboards, more beach mats with items on them (towels, bags, coolers, books, sandals), large standing umbrellas, so the sand isn't blank.

Where things are:
- Surroundings: projects/coastal-cottage/environment.py (add(dp) is called by bake_web.py)
- Bake: projects/coastal-cottage/bake_web.py (groups G_Env*, density, decimate; --quick = 2-min test into a scratch site)
- Site: websites/TruongSon-demos/coastal-cottage/ (spec.js fog: theme.fogDensity)
- Skill notes: .claude/skills/3d-walkthrough/references/baking.md

Workflow: edit -> quick bake (--quick --site <scratch>/site --work <scratch>/work) -> look -> full bake
(about 22 min, writes into the site) -> shoot.cjs at 1280x720 and 440x956 -> commit, push to
claude/serene-pasteur-hr1jid, PR + merge to main (the user asked for that) -> send the user screenshots
and https://nguyenlieu12379.github.io/truongson-OS/coastal-cottage/

## Status (2026-11-16, 11:00 UTC)

- Done in code: `town.py` (road, shops, street furniture, cars, beach items), `environment.py` (hill moved behind the town, more and better beach houses, palms on both sidewalks), new bake groups, Draco compression (gltf-transform) and DRACOLoader in the engine, fog 0.0009.
- Quick bake checked. Full bake started 11:00 UTC into the site folder (log in the session scratchpad).
- Next: screenshots (desktop 1280x720, phone 440x956), commit, PR to main and merge, send the user screenshots and the live link.
