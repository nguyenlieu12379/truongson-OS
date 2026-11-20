# Espresso Vivace (concept demo, scroll-craft)

A scroll-driven, chaptered editorial page for **Espresso Vivace**, Seattle (espresso bar and roaster since 1988). Built with `/scroll-craft` as a free build: real photos only, no AI generation, no spend.

- **Status:** concept demo on GitHub Pages at https://nguyenlieu12379.github.io/truongson-OS/espresso-vivace/ (after merge to `main`). `noindex`. Not affiliated with Espresso Vivace.
- **Why this prospect:** a real, open business with a strong founder story and a weak homepage. Their current homepage (espressovivace.com) is a looping espresso video with nav only: no headline, no story, no addresses or hours on the first screen. Their "visit" and "learn" links rendered the shop page when we checked (2026-11-20).
- **Brief, grammar, feeling curve, score:** `BRIEF.md`.
- **Peak:** scrolling scrubs a real latte-art pour (Mixkit, free license, not filmed at Vivace), then the next section wipes to a real photo of a Vivace latte.

## Files

| File | What |
|---|---|
| `index.html` | The page. Real semantic HTML. |
| `site.css` | Brand tokens and layout. Engine CSS is untouched. |
| `site.js` | The chapter folio. |
| `scrollcraft.js`, `scrollcraft.css` | Engine, copied unchanged from `.claude/skills/scroll-craft/engine/`. |
| `credits.html` | Full photo credits and licenses. |
| `assets/` | 8 photos as WebP (desktop and `-m` mobile), the pour clip `pour.mp4` (1280x720) and `pour-m.mp4` (576x720 crop), dense GOP for scrubbing, plus first/last-frame posters. |
| `verify/` | Contact sheets from the scroll harness (desktop, phone 390x844, reduced motion) and the pour sequence. |

## Photos and licenses

All from Wikimedia Commons, credited on the page and in `credits.html`. CC BY 2.0 (Breville USA, Ron Diggity, ChrisDag) and CC BY-SA 3.0 (Joe Mabel, Another Believer). The licenses allow commercial use with attribution; CC BY-SA asks that changed versions of those photos stay under the same license. Keep the credits if the page is published.

Pour video: Mixkit "Latte art" (#810), Mixkit Stock Video Free License (commercial use, no attribution required; we credit it anyway). Trimmed, sped up 2.5x, cropped for phones.

If Vivace becomes a client, swap in their own photography and a 10-second phone video of their barista pouring, and drop the third-party credits.

## Facts used (sources)

Wikipedia articles "Espresso Vivace" and "David Schomer" (founding 1988, cart at 5th and Union, PID controllers, latte art credit, 1996 book, Seattle Times quote, 2023 sidewalk bar closure), the closure notice photo on Commons, and web listings for the two current addresses.

**Not on the page because unverified:** hours, menu, prices. Confirm with the business before any real use.

## Run locally

```bash
node ../../../../../.claude/skills/scroll-craft/scripts/serve.mjs --root . --port 4500
```

Open http://localhost:4500.

## Re-verify

```bash
npm i --no-save playwright-core
```

```bash
SCROLLCRAFT_CHROME=/usr/bin/google-chrome node ../../../../../.claude/skills/scroll-craft/scripts/shoot.mjs --url http://localhost:4500 --out lab/shots
```

Add `--width 390 --height 844` for phone, `--reduced-motion` for motion off.

## Verified (2026-11-20, headless Chrome)

- Desktop 1280-1440, phone 390x844, reduced motion: no dead scroll, all text over media at 4.5:1 or better, 0 console errors, 0 failed requests.
- Pour clip checked at 7 progress points on desktop and phone; harness confirms the clip keeps moving whenever on screen. Reduced motion shows the finished pour as a still, no pinned hold.
- Keyboard: tab order is wordmark, Plan a visit, Shop, Directions x2, Full credits. All show a focus ring.

**Not verified:** a real phone (iOS Safari). Open it on an iPhone before showing anyone.

## Publish

Deployed by `.github/workflows/deploy-pages.yml` on push to `main`. `README.md`, `BRIEF.md` and `verify/` are stripped from the deploy. Son approved publishing on 2026-11-20.
