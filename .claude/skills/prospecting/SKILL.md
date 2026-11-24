---
name: prospecting
description: Find US F&B prospects for Son and Truong - independent restaurants, cafes, bakeries and food trucks that take orders on WhatsApp but have no real website. Fast by default - one Google search for Instagram bios with wa.me links, a quick no-website check, a short report. Scrapling is only for checking a link or pulling a bulk city list on request. Use when Son or Truong says "find leads", "find prospects", "find me a f&b brand without a website", "next prospect", "prospecting", or wants a lead list.
---

# Prospecting

Goal: a US F&B business that **has WhatsApp** and **has no real website**, so we can build them a spec site with `/site-building`.

**No cuisine bias (Son, 2026-11-24):** the target is any US F&B business. Past prospects happened to be Brazilian; that is not a filter.

**Speed rule (Son, 2026-11-24):** one prospect should take a few minutes, no longer than a plain "find me a lead" prompt. Don't ask setup questions, don't run the bulk finder unless asked. Go straight to the fast path.

## The target

- US, F&B, independent (no chains): restaurant, cafe, bakery, food truck, meal prep, catering.
- **WhatsApp is required:** a `wa.me` link in the bio, a WhatsApp field, or the number in posts.
- **No real website:** nothing listed, or only Instagram, Facebook, Linktree, WhatsApp, or a DoorDash/UberEats ordering page. A dead or parked domain also counts.
- Any cuisine, any US city. Don't narrow to one cuisine or state unless Son or Truong asks.
- Skip anyone already built or rejected (`websites/README.md`, `.claude/skills/site-building/FAILURES.md`).

## Fast path (default)

Browser: Claude in Chrome, signed in as nhson124092010. **Read only: never post, follow, like or message.**

1. **One Google search**, broad by default (add a city or cuisine only if the user gave one):
   `site:instagram.com "wa.me" (restaurant OR bakery OR "food truck" OR cafe OR catering) USA`
   If results are thin, vary the words: "order on whatsapp", "meal prep", "home bakery", "food truck", or a state name. The result snippets usually show the `wa.me` link and the city, so pick from the snippets without opening every page.
2. **Open the best 1 to 3 Instagram profiles.** Check: bio link is WhatsApp or social only, posts, followers, real food photos.
3. **Confirm no website with one Google search** of the name + city. If Google's summary and results point only to Instagram/Facebook/WhatsApp, that's the proof. If a domain shows up, check it with Scrapling (below) instead of guessing.
4. **Report** and stop.

## Report (brief)

Per prospect, a few lines:
- **Name**, city, what they sell
- **WhatsApp:** number, where seen
- **No website:** proof in one line
- **Instagram:** link, followers, real photos or promo graphics

Then: "Build this one?" Don't start `/site-building` until Son or Truong confirms.

## Scrapling (only when needed)

Scrapling reads a business's own site or link-in-bio page, including ones behind Cloudflare. Use it for:

- **Checking one link** (a few seconds): is it a real site, dead, parked, social-only? Does it carry a `wa.me` link?
  ```powershell
  .claude\skills\prospecting\.venv\Scripts\python -I .claude\skills\prospecting\scripts\check_url.py "https://example.com"
  ```
  Add `--stealth` if it says "bot wall": a Chrome window opens briefly and passes the Cloudflare check.
- **Bulk city list, only when asked** ("give me a list for Newark"). Takes about 5 minutes per city. OpenStreetMap list, Scrapling checks every listed site, ranked spreadsheet in `prospects/` (gitignored). OpenStreetMap rarely has WhatsApp, so this finds no-site places, not confirmed leads.
  ```powershell
  .claude\skills\prospecting\.venv\Scripts\python -I .claude\skills\prospecting\scripts\prospect.py "Newark" "New Jersey" --limit 60
  ```

Don't use Scrapling on Instagram or Facebook. Use the browser.

## Rules

- Never message, call or email a prospect. Outreach is done by hand.
- Keep prospect lists out of git (`prospects/` is gitignored).
- Log a new standing rule from Son or Truong in this file.

## Setup (once per machine)

```powershell
uv venv --python 3.12 .claude\skills\prospecting\.venv
uv pip install --python .claude\skills\prospecting\.venv\Scripts\python.exe "scrapling[fetchers]" openpyxl
```

`--stealth` uses the installed Google Chrome (`real_chrome`). Playwright's bundled Chromium fails to start on this Windows build. Linktree is blocked on this machine's network, so check Linktree pages in the browser.

Scrapling: https://github.com/D4Vinci/Scrapling (BSD-3), installed from PyPI into a gitignored `.venv`.
