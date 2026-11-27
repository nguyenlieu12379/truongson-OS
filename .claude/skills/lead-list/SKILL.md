---
bike-method-phase: 1  # Phase 1 — Training wheels. Run manually first.
three-ms-attribution: |
  Adapted from The Three Ms of AI™ © 2026 Nate Herk.
name: lead-list
description: Build a batch of US F&B prospects (WhatsApp live, no real website) into one tracker file, in one run. Fast Google-search path per lead, Scrapling for link checks and bulk city lists when asked. Use when Son or Truong says "build the lead list", "batch leads", "find 10 prospects", "lead list", "find leads", "find prospects", or "prospecting". Drafts the list only; never contacts anyone.
---

# Lead list

Adds a batch of prospects to `prospects/leads.csv` in one run. Replaces the old one-at-a-time `/prospecting`. A prospect is auto-approved (owner, 2026-11-26) when it passes the target below, the no-website check and a confirmed WhatsApp number. No separate candidates file.

Method spec: `decisions/log.md`, entry 2026-11-25 "Lead list: batch find and track US F&B prospects". Autonomy L2 Drafted. KPI: qualified leads added per week (target 10+).

## Inputs

- Batch size N. Default 10.
- Optional city, state or cuisine filter. Only if the user gives one.

## Target

- US, F&B, independent (no chains): sit-down restaurant or cafe only (see the rule below).
- **WhatsApp is required:** a `wa.me` link in the bio, a WhatsApp field, or the number in posts.
- **No real website:** nothing listed, or only Instagram, Facebook, Linktree, WhatsApp, or a DoorDash/UberEats ordering page. A dead or parked domain counts.
- **Brand, not family (Son, 2026-11-25):** a named truck, cafe, restaurant or shop with a logo and its own look. Skip home bakers and family side accounts. Vary the F&B type. Prefer sit-down restaurants (a storefront, hundreds or thousands of Google reviews) over food trucks and pop-ups.
- **Full sit-down only (owner, 2026-11-25):** a storefront restaurant or cafe with a real dining room, where guests sit and are served or eat in. Established: roughly 200+ Google reviews. Skip food trucks, street food, delivery-only or ghost kitchens, kiosks, counter snack shops (açaí, hot dog, pastel stands), home kitchens and pop-ups. A bakery counts only when it is also a sit-down cafe or restaurant. This overrides the "prefer" line above.
- **No cuisine bias (Son, 2026-11-24):** any US F&B business. Don't narrow to one cuisine or state unless asked.
- Skip anyone already listed: `prospects/leads.csv`, `websites/README.md`, `.claude/skills/site-building/FAILURES.md`.

## Steps

1. **Load existing names** from the tracker and the two other files above. Skip duplicates.
2. **Fast path per lead** (browser: Claude in Chrome, signed in as nhson124092010; **read only: never post, follow, like or message**):
   1. One Google search, broad by default: `site:instagram.com "wa.me" (restaurant OR bakery OR "food truck" OR cafe OR catering) USA`. If thin, vary the words ("order on whatsapp", "meal prep", "home bakery", "food truck", or a state name). Pick from snippets without opening every page.
   2. Open the best 1 to 3 Instagram profiles. Check bio link (WhatsApp or social only), posts, followers, real food photos.
   3. Confirm no website with one Google search of name + city. If a domain shows up, check it with `check_url.py` (below) instead of guessing.
   4. Keep it only if it passes the target. Otherwise drop it and move on.
3. **Repeat step 2** until N pass. Do not lower the target to fill N. If fewer pass, stop and report the count.
4. **Append rows** to `prospects/leads.csv` with `status` = `new` and `next_action` = `build demo`, only for prospects that pass every check (sit-down rule, no real website, WhatsApp confirmed). Columns: `#,status,name,city,state,type,whatsapp,instagram,website_check,next_action,notes`. `#` is the row number: continue from the last row (1, 2, 3...). A prospect that fails any check is dropped and never written.
5. **Report** the new rows: name, city, WhatsApp, one proof line for no website, Instagram link. Flag anything uncertain (shared number, second location) so the owner can drop it.

## Scrapling (only when needed)

Scrapling reads a business's own site or link-in-bio page, including Cloudflare-protected ones.

- **Check one link** (a few seconds): is it a real site, dead, parked, social-only? Does it carry a `wa.me` link?
  ```powershell
  .claude\skills\lead-list\.venv\Scripts\python -I .claude\skills\lead-list\scripts\check_url.py "https://example.com"
  ```
  Add `--stealth` if it says "bot wall": a Chrome window opens briefly and passes the Cloudflare check.
- **Bulk city list, only when asked** ("give me a list for Newark"). About 5 minutes per city. OpenStreetMap list, Scrapling checks each site, ranked spreadsheet in `prospects/` (gitignored). OpenStreetMap rarely has WhatsApp, so this finds no-site places, not confirmed leads. Rows from a bulk run still go through step 4 with status `new`.
  ```powershell
  .claude\skills\lead-list\.venv\Scripts\python -I .claude\skills\lead-list\scripts\prospect.py "Newark" "New Jersey" --limit 60
  ```

Don't use Scrapling on Instagram or Facebook. Use the browser.

## Rules

- Read only on Instagram and Facebook.
- Never message, call, follow, like or email a prospect. Outreach is always a cold call by Son or Truong (owner, 2026-11-26), never email or DM, so a `built` or `built-<rank>` lead goes straight to `won` or `rejected`.
- `prospects/` is gitignored. Never commit `leads.csv`.
- **`leads.csv` holds approved prospects only (owner, 2026-11-26).** Passing every check is the approval. Status values:
  - `new`: passed every check, no demo built yet, not called yet.
  - `built-S`, `built-A`, `built-B`, `built-C`: demo built and ranked by the owner (S best), not outreached yet. Same rank as in `websites/README.md` (2026-11-27).
  - `built`: demo built, not ranked yet.
  - `won`: said yes on the cold call and became a paying client.
  - `rejected`: said no on the cold call. Never use it for a prospect that failed our checks (those are not written at all).
  Change a status only when the owner says so, except `new` on add.
- Log a new standing rule from Son or Truong in this file.

## Setup (once per machine)

```powershell
uv venv --python 3.12 .claude\skills\lead-list\.venv
uv pip install --python .claude\skills\lead-list\.venv\Scripts\python.exe "scrapling[fetchers]" openpyxl
```

`--stealth` uses the installed Google Chrome (`real_chrome`). Playwright's bundled Chromium fails to start on this Windows build. Linktree is blocked on this machine's network, so check Linktree pages in the browser.

Scrapling: https://github.com/D4Vinci/Scrapling (BSD-3), installed from PyPI into a gitignored `.venv`.
