# Failures: read this before anything else

Builds Son or Truong marked as failures, and why. Read the whole file before stage 1. Before stage 2, write in BRIEF.md how the new build avoids every pattern below. If the plan matches one, change the plan.

## 1. Brazilian Passion Foods, 2026-11-23 (Son): "looks AI slop"

Build: `websites/TruongSon-demos/scrollcraft/builds/brazilian-passion-foods/` (v2, kept offline as the example of what not to do; not deployed).

What Son called out:
- **"Just picture + letter on a side."** A tall photo panel on one side and a block of copy on the other, for the whole page. It's the default AI landing layout. Swapping which photo shows doesn't make it a design.
- **"The colors."** Washed off-white over a blurred copy of the photo, with tiny brand accents. That reads as generic AI beige and grey, not as their brand.
- **"The way objects sit on each other."** Things stacked with no relationship to each other: a glass card floating over a blur, a pill over a panel, a timeline bar along the bottom. Layers that don't interact, overlap on purpose, or share an edge look pasted on.

Don't repeat:
- One media panel and one text column held for the whole scroll.
- Blurred-photo or soft-gradient backgrounds used to "fill space".
- Floating cards and pills dropped over content without a compositional reason (alignment, crop, overlap that means something).
- Muted beige or grey palettes with the brand colour only as a thin accent. If the brand is loud (green and yellow truck), the page can be too.
- Copy repeating the same small-label + big-sentence card on every beat.

Do instead:
- Compose each moment like a poster or a magazine spread: type and image interlock (type crossing the photo, the photo cropped by the type, a full-bleed image with type set into it). Vary the composition beat to beat.
- Use the client's real colours at real strength, taken from their truck, sign or packaging.
- Every layer earns its place: if two things overlap, the overlap should mean something.
- Before showing anything, run the "is this slop?" check: would this layout fit any other business with the photos swapped? If yes, it fails.

Earlier, same client (v1, retired): drawn CSS props (a pan, bubbles) instead of real photos. Son's rule: "always stay away from the plastic graphics objects at all cost." See `references/standing-preferences.md`.

## 2. El Budare Café, 2026-11-25 (Son): "this site looks no serious and slops"

Build: `websites/TruongSon-demos/scrollcraft/builds/el-budare-cafe/` (kept offline as the example of what not to do; not deployed). A big sit-down restaurant: two locations, 2,000+ Google reviews.

Why it failed, in Son's words (2026-11-25):
1. **Font and colour too playful.** "the font and color choice is too playful, not serious business."
2. **Theme toggle stranded mid-bar.** "the light dark button just sit there in the middle al the time, when the CTA aren't block its way, just move it to the corner so the site looks clean." The toggle sat left of an empty CTA slot whenever the button was elsewhere.
3. **Empty of value.** "its just show some 'nice to have' things and really no valuable at all, thats why it feels empty although there're full of motion and items in the site." Motion and widgets are not content. Nothing told a customer what to order, what it costs, when they're open or why people come back.
4. **The cutout is never whole.** "its not full, its left half disappeared, this may be you choose the image that have obstacle in fornt of the main thing, or the image doesn't catch the whole food, or you cutting skill is bad." The stack's lower left was hidden behind fries in the source photo, so the cut lost it. The earlier cachapa was cropped by the photo's own edge.

Earlier diagnosis:
- **Not serious.** A cartoon display font (Chewy) at hero size, a food cutout floating on blank white with a soft drop shadow like a sticker, and gimmick UI (a rolling clock, "tickets", a clock chip riding a bar). It read as a demo of tricks, not as a restaurant with 2,000 reviews.
- **Slop.** The same hero formula for the fourth build in a row (giant word + floating cutout + covered letters wobbling). Large white voids holding small widgets. Small uppercase tracked labels ("OPEN 24 HOURS"). A white card with a map. Every piece is a template part.
- **Earlier rounds:** a saturated flag-colour sky ("make it light, not AI slops"), copy that said nothing ("don't write random text, each must do one job"), a cutout clipped by the photo's own edge ("the food's cut image looks off"), the tagline over the word ("letter overlap"), an empty scene ("the whole page looks empty"), the card and map cut off on a short screen.

Don't repeat:
- A novelty mechanic as the centrepiece (a clock, a turntable, a counter) when the business is a serious restaurant. The mechanic becomes the subject instead of the food and the place.
- Cartoon or novelty display fonts at hero scale, even if they echo the sign.
- Cutouts floating on an empty background. A cutout needs a real surface or scene to sit in.
- The giant-wordmark-plus-cutout hero on every build. Treat it as one option, not the default.
- Blank space holding small UI pieces (tickets, chips, pills). Empty is not clean.
- Uncheck-able English names for dishes, and dishes captioned by an invented time of day.

- A theme toggle anywhere but the corner. It sits at the far edge of the bar, always; the button docks beside it, never outside it.
- A cutout from a photo where anything (fries, a hand, a glass, the frame edge) covers part of the dish. Whole dish, fully in frame, nothing in front, or don't cut it.

Do instead:
- Value before motion. Every scene must answer something a customer needs: what to order (signature dishes with real names and prices from their menu), when they're open, where, why people love it (real review quotes or numbers). Motion only carries that content.
- Serious type and colour: a confident text face, the brand's colours used with restraint. No novelty fonts.
- Cutout acceptance: before using a cutout, view it alone at full size on white and on black, and check every edge against the original photo. If any part of the dish is missing or blurred, pick another photo.
- Match the business's weight. A busy restaurant gets the confidence of a real restaurant site: large, full-bleed photos of their food and their room, calm strong type, few moving parts, each one doing a clear job.
- Before building, check the plan against: would the owner of a 2,000-review restaurant show this to customers without feeling it's a toy?

