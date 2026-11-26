---
kind: handoff
date: 2026-11-25
topic: moho-character-build
status: blocked
---

# Build a rigged cartoon character in Moho 14 on this PC, following YouTube tutorials

## Summary
Goal: build a rigged 2D cartoon character in Moho 14 with computer use, matching the McCoy Buck "Character Rigging Tutorial" and the "Learning Moho 14" course (Parts 21 and 24). Moho 14 installed and running from the signed `C:\Program Files\Moho 14\Moho.exe`. Current drawing is a placeholder, not a character. Blocked on creating a Bone layer: the Layers panel "+" → Bone popup stops accepting clicks and keys.

## Key takeaways / decisions
- Use only the signed `Moho.exe`. `C:\Program Files\Moho 14\Crack\Moho.exe` fails its signature check (HashMismatch) and comes from an unofficial RAR. Do not run it. The user should delete the `Crack` folder.
- Do not download or run the unofficial RAR ("Moho Pro 14.2 Build 20240604 Multilingual.rar" on Google Drive). Refused in session.
- Computer use is required for Moho; the YouTube window is a browser app, so only Claude in Chrome can drive YouTube.
- Bones workflow (Part 24): Bone layer holding the parts → `A` for Add Bone tool → pelvis pin bone → torso chain → alt-click chest for arms (shoulder, elbow, hand) → alt-click pelvis for legs (hip, knee, foot) → bind parts to bones.
- Part 21 drawing workflow: vector layers, Swatch from reference via custom image, pen tool clicks + Return, Auto-fill on. Closing a shape requires clicking the first point again, then Return.
- Moho UI quirks: menu items often need a second click or Return; the Layers panel is hidden under Style, so Window → Style toggled off to show Layers; Layers "+" → Bone popup ignores clicks.

## State
- ✅ done: Moho 14 installed and running; Untitled 3.moho open (blank → drawn); head as filled closed shape; body as filled closed shape; arms and legs drawn as open outlines (not filled).
- 🔄 in progress: none
- ⛔ blocked / waiting for: Bone layer creation in Moho (Layers panel "+" → Bone popup does not respond). Untitled 2.moho has unsaved stray strokes; discard.

## Artifacts
- `C:\Program Files\Moho 14\Moho.exe` (signed, valid)
- `C:\Program Files\Moho 14\Crack\Moho.exe` (tampered, do not use; user to delete)
- Untitled 3.moho in progress (unsaved, no file path yet)
- Watch transcripts (scratchpad, not in repo): Part 21 `xee53xSvpPs`, Part 24 `l9nBd1Of8qI`
- Course playlist: https://www.youtube.com/playlist?list=PLynyD-7entJ2giKWS9ReviR-exwJ3UJ3T
- McCoy Buck tutorial: https://youtu.be/83LwZTQnJU4

## Next step
Open Layers panel in Untitled 3.moho (Window → Style off if Layers is hidden), click the "+" button, and create a Bone layer manually. Then move the head and body into it and start the Add Bone tool.

## What NOT to do
- Do not run `Crack\Moho.exe` or install the RAR from Google Drive.
- Do not keep retrying the Layer type popup clicks; if it still fails, use Layer menu or ask the user to create the Bone layer.
- Do not treat the current drawing as a finished character; it is a placeholder.
- Do not save or commit anything to `main` or the local clone (user instruction).
