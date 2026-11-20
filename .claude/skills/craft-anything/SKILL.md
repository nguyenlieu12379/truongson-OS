---
name: craft-anything
description: Use when Son or Truong asks to study how a website, web app, CRM or app works and rebuild their own version with craft-anything (storytold). Also when they say "craft anything", "rebuild this site", "recreate this app", or want to test it against the current website flow. Not set up yet (needs Rust, system libraries and a signed-in coding agent). Only for software we own or have permission to copy.
---

# craft-anything

Entry point for the vendored craft-anything pack (source and commit in `VENDORED.md`). Early alpha.

## Status

Added and linked. Not set up: nothing built or installed. Decision: `decisions/log.md`, 2026-11-20. First planned test: rebuild our own Forno Notte demo and compare with the scroll-craft flow.

## Rules

- Only start setup or a run when Son or Truong asks for it in this conversation.
- Targets: our own sites, a client's site with their written OK, or open-source software. Never a competitor's site or app.
- Default to Clean room mode. Deep mode only on software we own.
- Installing a rebuilt project's dependencies runs code. Use `npm install --ignore-scripts` unless the dependencies are trusted.
- For a CRM, check open-source CRMs (Twenty, EspoCRM) before rebuilding one.

## How to run it

1. Read `README.md` in this folder: install, Clean room vs Deep, the CLI.
2. Setup (when asked): Rust 1.97+, the apt packages listed in the README, then `cargo install --path apps/craft-anything-cli` and `craft-anything-cli doctor`. Or use a prebuilt installer from the GitHub Releases page.
3. Rebuild: `craft-anything-cli rebuild <url> "<what you want>"`. Output is a project folder with `app/`, `checks/` and `craft.json`.
4. `AGENTS.md` and `CLAUDE.md` in this folder are upstream's rules for contributing to craft-anything itself, not for using it.
