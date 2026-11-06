# TruongSon v2 agency site

Second, from-scratch take on the TruongSon agency site. The original lives in `websites/TruongSon/` and is untouched.

- **Job:** back up cold calls/emails. A small business owner opens the link, trusts us fast, books a 15-min Google Meet.
- **Look:** engineering blueprint. Blueprint blue, white linework, yellow for the action and the money.
- **Proof:** the guarantee: "Love the design or you don't pay."
- **Sections:** Hero, What you get, How it works, Guarantee, FAQ, Final CTA.
- **Stack:** one static `index.html` (HTML/CSS + a few lines of JS). Fonts from Google Fonts. Hosted on GitHub Pages at https://nguyenlieu12379.github.io/truongson-OS/ (deployed by `.github/workflows/deploy-truongson-site.yml` on every push to `main`). The old site is at `/v1/`.
- **Decisions:** `brainstorms/2026-11-06-truongson-site-v2.md` (local), `PRODUCT.md`.

## Before going live

1. **Booking link.** Open `index.html`, find `const BOOKING_URL = "";` near the bottom, paste the Google Calendar appointment page link. Every "Book" button uses it. Until then the buttons scroll to the last section.
2. **Guarantee sign-off.** Truong confirms "Love it or don't pay" and it gets logged in `decisions/log.md`.

## Edit

Open `index.html` in any editor. Colors are CSS variables at the top (`--paper`, `--line`, `--mark`). Copy is plain HTML.

## Preview

Open `index.html` in a browser. No build step.
