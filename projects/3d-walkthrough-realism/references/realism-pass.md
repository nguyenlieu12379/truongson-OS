# Realism pass

The future step that makes the walkthrough look real without changing it. Status: draft. Dreamina access is not set up yet.

## The rule

Blender owns the point of view. The camera path, framing, timing and the layout of every frame come from the Blender scene along the confirmed route. Real footage and Dreamina are only a look wrapped onto that render: surfaces, light, detail. They never move the camera, the walls or the furniture.

## Order of sources

1. **Client's real footage and photos.** Used first, wherever they show a room's surfaces clearly.
2. **Dreamina AI video.** Only for rooms with no usable footage.

## Real footage rooms

- Crop and straighten each photo to its surface, then place it in Blender with `photo()`.
- Match floor, wall and ceiling finishes and the light colour to the footage.
- Re-render the shots for that room. No AI involved.

## Dreamina rooms

Per shot (one shot = the stretch of route inside one room):

- **Input:** the Blender render of the shot (a short video, or its first and last frame), at the site's aspect ratio.
- **Prompt:** built from `brief.md`. Materials, furniture style, light, time of day, mood. Then the constraint, word for word: "Keep the camera movement, the room shape, the doors and windows and the furniture positions exactly as in the input. Change only materials, textures, lighting and small detail."
- **Style reference:** the closest real photos of the client's place, or of the style they want.
- **Until access is set up:** the user runs Dreamina by hand. Prepare one folder per shot (`realism/<nn>-<room>/`) with `render.mp4` (or `first.png` and `last.png`), `prompt.txt` and `refs/`. The user puts the result back as `result.mp4`.
- **Later, automated:** Dreamina's video model is Seedance (ByteDance). The repo's `muapi-video` skill can reach Seedance models through Muapi with a `MUAPI_API_KEY`. Check that a video-to-video or first-and-last-frame mode keeps the layout before relying on it.

## Review against the master

- Put each realistic shot next to its Blender render, frame by frame (start, middle, end).
- Reject when a wall, door, window or piece of furniture moved, appeared or disappeared, or the room changed size.
- Redo with a stronger constraint, a shorter shot, or the first and last frame instead of the whole video.
- Show the user the passing shots before they go into the site.

## Open decisions

Decide these with Son and Truong before the first build:

1. **How the site shows the realistic version.**
   - Option A: scroll scrubs the realistic video along the route, in place of the live 3D. Looks most real. The 3D style switch goes away unless each style gets its own realistic pass.
   - Option B: keep the live 3D scene, and show the realistic shot at each stop (a fade from 3D into the clip and back). Keeps the style switch, costs more to build.
2. **Dreamina access.** Manual (user runs it) or automated through an API, and whose account pays.
3. **Labelling.** How AI-generated shots are labelled for clients (a small "AI visualisation" note on those stops is the safe default for real estate).
