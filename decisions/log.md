# Decisions Log

Append-only record of meaningful decisions and why they were made. `/level-up` Phase 2 (Method interview) writes scoped automation specs here. You can also append manually whenever you decide something worth remembering.

**Format per entry:**

```
## YYYY-MM-DD — Short title

**Decision:** what was decided.

**Why:** the reasoning, constraints, and what would change your mind.

**Alternatives considered:** what else was on the table.

**Owner:** who's accountable.
```

Keep it terse. Future-you will thank present-you for capturing the *why*, not just the *what*.

---

## 2026-09-06 - Audit evidence and routing maintenance

**Decision:** Ship audit rubric v2 and a small /link skill. Audit scores working evidence across the Four Cs, checks operating-manual routing and freshness, and passes one concrete gap into /level-up. A selected repair can improve an existing workflow instead of creating another skill.

**Why:** File counts, configured keys, named rituals, and recent edits do not prove an operational AIOS. Source findability and freshness need explicit checks.

**Alternatives considered:** Keeping presence-based scoring or requiring a hot cache. Neither reliably establishes retrieval quality or successful execution.

## 2026-09-06 - Portable skills and automatic audit history

**Decision:** Ship all four skills for Claude Code and Codex, with bundled resources, matching operating manuals, and a script for regenerating Codex copies. Audit reports are saved automatically, preserve previous runs, and track findings across comparable inspections.

**Why:** Students need the same shared guidance when switching assistants and evidence of actual improvements over time. Intentional runtime adaptations, unknown verification, and confirmed defects are reported separately.

## 2026-09-06 - Portable 3D Brain skill

**Decision:** Add `/3d-brain` for Claude Code and Codex. Ask for a name and categories, map selected local folders, and scaffold a bundled, configurable application with spherical placement, Cinema, and interactive growth replay.

**Why:** Shipping the working renderer preserves the intended appearance and interactions across AIOS installations. A prose-only prompt would produce inconsistent recreations. User config and graph data remain local; the public package includes only code, documentation, dependency notices, and fictional test inputs.

## 2026-09-06 - Add ongoing context interviews

**Decision:** Adapt Herk-2's grill-me skill for the student kit and ship matching Claude/Codex packages. Save every answer to brainstorms/, preserve resumable Q&A history, and update canonical context only with confirmed facts during requested context-building sessions.

**Why:** Onboarding is an initial snapshot. Ongoing interviews capture changing priorities, decisions, and preferences while keeping tentative ideas distinct from current business facts.

## 2026-11-06 - TruongSon agency website (static v1)

**Decision:** Build the TruongSon agency site as a static single page at `websites/TruongSon/index.html`. Two goals: book free discovery calls and show the portfolio. Booking uses a free Google Calendar appointment schedule, set in one `BOOKING_URL` constant. The offer copy says "websites", not AI-generated websites. No pricing shown yet. Portfolio is a placeholder until demo or client sites exist. Layout follows the taste-skill "type-only" direction (Epilogue, olive on bone). Website projects live under `websites/<owner>/<site-name>/`.

**Why:** Son wants a free, simple booking path and no pricing decision yet. The site has no photos of our own work, so a type-led layout avoids faking imagery.

**Alternatives considered:** Framework site (Next.js or Astro), a website builder (Framer or Webflow), an enquiry form instead of booking, and AI-generated offer copy.

**Owner:** Son

**Open items:** Set the booking link. Choose a hosting target (GitHub Pages or Vercel). Replace the Instagram placeholder. Add demo or client sites to the portfolio. Approve the copy before it goes live.

## 2026-11-06 - TruongSon site serves any business, not only F&B

**Decision:** The TruongSon site sells websites to any kind of business. Copy no longer names restaurants or cafés as the only market. It lists a range of business types (shops, clinics, studios, trades, restaurants, cafés, salons, gyms, agencies). The site has one booking control: a green button pinned to the top right.

**Why:** Son said the offer is for any business, not only restaurants and cafés.

**Alternatives considered:** Keeping an F&B-only message. Rejected by Son.

**Owner:** Son

## 2026-11-06 - Offer is websites for any business, F&B first

**Decision:** The offer is websites for any kind of business. F&B (independent restaurants and coffee shops) is the first target segment, not the only one. Updated `CLAUDE.md`, `AGENTS.md`, `aios-intake.md`, `context/about-business.md`, `context/priorities.md`, and the TruongSon site README. The 10-client goal for 2027-02-06 stays, now counted across all businesses with F&B first.

**Why:** Son's offer is for any business. F&B is chosen because it is easier to reach and sell to first, not because it is the only market.

**Alternatives considered:** Keeping F&B as the sole ICP. Rejected per the 2026-11-06 site decision.

**Owner:** Son

## 2026-11-06 - One UI design skill: design-skills (Emil Kowalski)

**Decision:** Use `design-skills` as the single UI design skill. Entry is `emil-design-eng`, then the matching sub-skill. `impeccable` and `taste-skill` are retired for new design work. Their packs stay on disk for reference. `PRODUCT.md` stays as product context.

**Why:** v1 was built with impeccable and design-skills. One skill means one set of rules and less overlap between sessions.

**Alternatives considered:** impeccable as the main skill (broader: layout, type, color, art direction). taste-skill for art direction.

**Owner:** Son

## 2026-11-06 - Remove impeccable and taste-skill completely

**Decision:** Delete the impeccable and taste-skill packs (Claude and Codex copies), the `.impeccable/` surface briefs, and their routing. design-skills is the only UI design skill. `PRODUCT.md` stays as plain product context. This overrides the "move to archives" house rule at the user's request. Git history keeps the old files.

**Why:** User asked to remove them completely, not just retire them.

**Owner:** Son

## 2026-11-06 - Forno Notte is the live GitHub Pages site; v1 and v2 retired

**Decision:** GitHub Pages now serves only the Forno Notte 3D scroll pizzeria demo at https://nguyenlieu12379.github.io/truongson-OS/forno-notte/. The root URL redirects there. The TruongSon v1 and v2 agency sites are offline. Deploys run from `.github/workflows/deploy-pages.yml` on push to `main`. Source: `websites/TruongSon-demos/forno-notte/`.

**Why:** v1 and v2 were already deleted from `main`. Forno Notte is the F&B portfolio piece to show prospects and to use for Instagram content.

**Alternatives considered:** Restoring v2 from git history and keeping it at the root next to the demo. Rejected because it would undo the deletions.

**Owner:** Son

## 2026-11-13 - Merge the walkthrough skills into /3d-walkthrough

**Decision:** Replace `/scroll-base-walkthrough` and `/3d-walkthrough-2` with one scroll-based skill, `/3d-walkthrough` (`.claude/skills/3d-walkthrough/`). Inputs are a floor plan, photos and footage, building context, and a walkthrough guide (a line drawn on the plan, or text describing the scroll POV). Real estate and rentals open on a dollhouse overview, then descend to the front door. Businesses open on the street, then walk to the front door. Photos are mapped onto surfaces as real textures. Unbuilt property with no photos is built from the floor plan with interior design. The demo's WASD walking, style switch, light slider, music and phone controls are dropped. The demo is archived under `archives/skills/3d-walkthrough-2/`.

**Why:** Two overlapping skills meant two sets of rules. The scroll-base pipeline is the one that produces a client-ready site, so the dollhouse opening and interior design were added to it.

**Alternatives considered:** Keeping both skills with a mode switch. Making the freeroam HTML file the only pipeline. Rejected because it loses the photo-driven scroll story.

**Owner:** Son

## 2026-11-14 - Add Muapi video generation as muapi-video

**Decision:** Vendor the video subset of SamurAIGPT/muapi-skills (MIT) into `.claude/skills/muapi-video/` as a kit pack. It covers text-to-video, image-to-video, and 16 motion recipes, all calling the Muapi API. Link it from CLAUDE.md and AGENTS.md, add it to `connections.md` as domain 8, and save the API guide at `references/muapi-api.md`. Auth is `MUAPI_API_KEY`, which is not set yet. The open-generative-ai studio app is referenced for context only and is not installed.

**Why:** Claude needs a video generation path. open-generative-ai is a browser studio on the same Muapi API, and its agent-ready skill and CLI are muapi-skills and muapi-cli.

**Alternatives considered:** Installing the whole open-generative-ai Next.js/Electron app (heavy, and it is a UI for people, not a tool for Claude). Using `npx skills add` at runtime (not reproducible and not pinned). Installing `muapi-cli` globally (not vendored; can be added later).

**Owner:** To confirm (Son or Truong)

## 2026-11-15 - Baked live 3D for walkthrough websites

**Decision:** The `/3d-walkthrough` website is live 3D (three.js) with Blender's lighting and materials baked into the model's textures. The film is an optional output, not the site's background. The film-playback site template is archived in `archives/3d-walkthrough-film-site/`. The coastal cottage gets rebuilt this way next. The film version stays live at `/coastal-cottage/` until then.

**Why:** It's smooth at any scroll speed, about 5 to 15 MB, and close to the Blender render. Re-baking one room is quicker than re-rendering a whole film.

**Alternatives considered:**
- 24 fps film played by scroll: built and live. 17 to 29 MB, and very slow scrolls show steps.
- 90 fps film: simplest pipeline with the fewest bugs, but about 110 MB and a 13 to 18 hour render.
- Plain live 3D (Forno Notte style): lightest and fastest, but looks flat.

Risk: the bake hasn't been run in this setup yet. The cottage is the first test.

**Owner:** Son

## 2026-11-17 - Add Blender craft skills as blender-skills

**Decision:** Vendor arjun988/blender-skills (MIT, commit 904f095) as a whole kit pack in `.claude/skills/blender-skills/`, with `VENDORED.md`. It has 95 Blender skills (modeling, vehicles, vegetation, materials, lighting, archviz, set dressing, realism, rendering). Link it from CLAUDE.md, AGENTS.md, README.md and `/3d-walkthrough`, and sync it to the Codex copy. Leave out the pack's docs site and its Cursor copy.

**Why:** The walkthrough sites need more realism (cars, towns, materials), and the pack is a ready craft reference for that, with `blender-director` to pick the right specialist.

**Alternatives considered:** Writing our own Blender references piece by piece (slower). Installing it as a Claude Code plugin (not pinned in the repo, and not shared with Codex).

Limit: the pack expects Blender MCP and a desktop Blender app. Cloud sessions apply it through headless `bpy` scripts instead.

**Owner:** Son

## 2026-11-20 - Delete blender-skills

**Decision:** Delete the vendored `blender-skills` pack from `.claude/skills/blender-skills/` and its Codex copy in `.agents/skills/blender-skills/`. Remove the links to it from CLAUDE.md, AGENTS.md, README.md and both `3d-walkthrough` SKILL.md files.

**Why:** Requested directly. The pack assumes Blender MCP and a desktop Blender app, which this setup does not use. `/3d-walkthrough` runs headless `bpy` scripts and keeps `references/realism.md` as its craft guide.

**Alternatives considered:** Moving it to `archives/`, which CLAUDE.md prefers over deleting. Not chosen because the request was to delete. The files stay in git history at the commit before this change.

**Owner:** Son

## 2026-11-20 - 3d-walkthrough: clay structure in Blender, real photos and AI models for the look

**Decision:** Rewrite `/3d-walkthrough` for F&B venues only (always real, open places). Blender builds only the structure as plain clay along the route (street, door, inside, hero spot): no materials, lights, decor or bake. Real photos of every corner are the design. An AI image model paints the photos onto each clay shot's first frame, and AI video models carry that look through the shot. The site plays one short clip per chapter, triggered by scroll (not scrubbed), loaded per chapter, all-intra encoded. The specific AI video models get added once that setup is connected.

**Why:** Designing and baking in Blender is slow and still looked plastic. Real photos make the venue look like itself, which is what an F&B owner recognises. Triggered short clips stay smooth on slow scrolls and load one chapter at a time, unlike the old 17 to 29 MB scrubbed film.

**Alternatives considered:** Keep designing and baking in Blender (heavy, plastic). One long scrubbed film (stutters on slow scrolls, heavy). Real estate and BnB modes (dropped: F&B is the focus).

Open: the AI video models, their cost and free-tier limits. Tested so far on Il Dante Caffe clay clips with free Hugging Face demos (Qwen Image Edit, LTX 2.3 Studio); the free GPU quota ran out before a full run.

**Owner:** Son

## 2026-11-20 - 3d-walkthrough site: queued clips that speed up to catch up

**Decision:** The walkthrough site plays one clip per chapter on scroll (triggered, not scrubbed). Clips are queued in route order and speed up (to 3x) when the visitor scrolls ahead or back, hand off on matching frames with a hard cut, reverse by stepping `currentTime`, and load into memory as blobs. Added to step 7 of `/3d-walkthrough`.

**Why:** Tested on the Corner Crema mockup. Fading between clips flashed the background, fast scrolls cut clips off, and reverse failed on hosts without byte-range support. The queued, sped-up playback felt good to Son; scroll-scrubbing was tried and set aside.

**Owner:** Son

## 2026-11-20 - 3d-walkthrough: one continuous camera path, clips that join cleanly

**Decision:** Render the route as one continuous camera path and cut chapter clips from it. Each clip starts on the previous clip's last frame at the same walking speed. Added to step 4 of `/3d-walkthrough`. The Corner Crema mockup is saved as the step 7 reference build in `websites/TruongSon-demos/corner-crema-mockup/`.

**Why:** In the mockup, walking from the door into the cafe showed a slight stop. The two clay shots overlapped by about a second and the first slowed down at its end. Cutting at the matching frame and thinning the slow tail evened the speed across the join.

**Owner:** Son

## 2026-11-20 - 3d-walkthrough: Wan2.1 VACE on Kaggle, photo brief, Maps photo tool

**Decision:** Use Wan2.1 VACE 1.3B (Apache-2.0) on Kaggle's free GPU as the video model for `/3d-walkthrough` step 6. The runner (`assets/vace/`) uploads a shot (clay clip, 1 to 3 photos, optional painted frame), runs on a T4 and downloads the clip. Photos: paying clients get `references/photo-brief.md` (10-minute phone shot list); pitches use `scripts/maps_photos.cjs` (Google Maps photos, never published).

**Why:** VACE takes our two inputs directly (a structure video as control plus reference photos), fits a free 16 GB GPU, and Kaggle can be driven from a cloud session with one API token. The Hugging Face demo pages ran out of free GPU halfway through the Il Dante test.

Open: needs a Kaggle account with a verified phone and an API token (not set up yet). The runner is untested on Kaggle; the first run is the test.

**Owner:** Son
