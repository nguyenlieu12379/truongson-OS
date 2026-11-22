---
kind: handoff
date: 2026-11-22
topic: delicias-scrollcraft
status: done
---

# Pick an F&B client with WhatsApp and no website, then build their site with scroll-craft

## Summary
Son asked for an F&B brand with no website and a WhatsApp account, with all inputs collected before picking, then a scroll-craft build. Client picked: Delícias Cake & Bakery, Burlington, MA. Research is done. The build is blocked on real photos: the cloud session can't reach Instagram, Yelp, Uber Eats or the full Google Maps gallery. This handoff moves the work to a local session with browser use.

## Key takeaways / decisions
- Delícias chosen over Moi Homemade and Pão Brasil (both have websites), Oasis Reading (Toast ordering, no WhatsApp found) and Meritíssimo (too little evidence it's open).
- Four must-haves apply to every client site (Son, 2026-11-22, `websites/README.md`): one engineered peak, layered hero, real photos by default, no AI tells.
- Each F&B site is its own scroll-craft build. Don't copy Vivace's layout or style.
- Was "spec demo only"; changed 2026-11-23: deployed at /delicias-cake/ (noindex) on request. Logged in `decisions/log.md`.
- No kie.ai key, so no generated assets. Real photos only.

## State
- ✅ done: candidate search and vetting; Delícias facts and sources in `RESEARCH.md`; four must-haves logged and added to `websites/README.md`; session-handoff skill installed.
- ✅ done (local session): 14 photos saved to `assets/source/` via Claude in Chrome, sources in `assets/source/SOURCES.md`. Owner confirmed as Roseli Reis. Hours corrected from Instagram.
- ✅ done (2026-11-23): brief, build, liquid-glass revisions, verified in Chrome (desktop, phone frames, reduced motion). Committed and live: https://nguyenlieu12379.github.io/truongson-OS/delicias-cake/
- ⏳ open: confirm WhatsApp number ((781) 365-0181 vs 661-8417) and hours with Delícias. Not checked on a real phone.

## Artifacts
- `websites/TruongSon-demos/scrollcraft/builds/delicias-cake/RESEARCH.md`: facts, sources, shot list, next steps
- `websites/README.md`: must-haves checklist
- `websites/TruongSon-demos/scrollcraft/FINGERPRINTS.md`: registry the new build must clear
- Branch: `claude/hello-de255e`, merged to `main`

## Next step
Contact Delícias with the live link. Confirm the WhatsApp number and hours, then fix them in `index.html` if they differ. Check the site on a real iPhone before the meeting.

## What NOT to do
- Don't use bot-evasion scrapers (undetected chromedriver, proxy rotation, stealth). Blocked by the safety layer and against site terms. ScrapeGraphAI was checked and not installed for this reason.
- Don't build from the three press images alone (one storefront photo, a small owner portrait, and a pão de queijo shot that looks like stock). Not enough for the layered hero.
- Owner name Roseli is confirmed (Instagram profile "Delícias Cake - By Roseli").
- Don't invent prices or stats. None are published.
- Don't use the borrowed account's connectors (Gmail, Drive, Higgsfield, Figma) for business work.
