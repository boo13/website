# Poster TODO — Credits Section

Credit previews are driven by `preview` or `poster` in `public/data/Projects.json`.
Rows with no image now render text-only instead of an empty/broken image slot.

**Target spec:** 1280×720 minimum, landscape 16:9. Save to `public/images/shows/<Name>_TitleCard.webp` and update the matching `preview` field in `public/data/Projects.json`.

---

## No preview assigned

These currently render as text-only when expanded.

| Show | Network | Year | `id` in Projects.json | Notes |
|------|---------|------|------------------------|-------|
| American Genius | Nat Geo | 2015 | `american-genius` | Find a landscape title card or episode still. |
| Extreme Cheapskates | TLC | 2012–2014 | `extreme-cheapskates` | Find a landscape show still. |
| Gold Fever | Discovery | 2013 | `gold-fever` | Find a landscape show still. |
| The Séance | A&E | 2014 | `the-seance` | Paranormal pilot with psychic Jackie Barrett. No online footprint found; grab a landscape frame from the episode. |
| Commander in Chief: Inside the Oval Office | Discovery | 2012 | `commander-in-chief-inside-the-oval-office` | Find a landscape title card or episode still. |
| Travel Testers | TLC | 2011 | `travel-testers` | Waterpark/vacation testing special. No major database footprint found; grab a landscape frame from the episode. |
| Heavily Ever After | TLC | 2011 | `heavily-ever-after` | Grab a landscape still from the episode. |
| Holiday Inc | HGTV | 2011 | `holiday-inc` | Grab a landscape still from the episode. |
| Ton of Love | TLC | 2011 | `ton-of-love` | Grab a landscape still from the episode. |
| Jobsite | History | 2011 | `jobsite` | Find a landscape title card or episode still. |

---

## Temporary placeholders

These show an existing poster rather than an empty panel, but the sources are vertical and should be replaced with proper 16:9 title cards.

| Show | Network | Year | `id` in Projects.json | Current file | Action |
|------|---------|------|------------------------|--------------|--------|
| Beyond the Spotlight | CuriosityStream | 2020–2021 | `beyond-the-spotlight` | `images/portfolio/beyond-the-spotlight/poster.large.webp` | Replace with landscape title card. |
| Inside the NSA | Nat Geo | 2012 | `inside-the-nsa` | `images/portfolio/inside-the-nsa/poster.large.webp` | Replace with landscape title card. |
| Redrum | I.D. | 2013–2015 | `redrum` | `images/portfolio/redrum/poster.large.webp` | Replace with landscape title card. |

---

## How to update

1. Take a screenshot from the show, or find a proper press image.
2. Resize/crop to 1280×720: `sips -z 720 1280 input.jpg --out resized.jpg`
3. Convert to WebP: `cwebp -q 85 resized.jpg -o public/images/shows/<Name>_TitleCard.webp`
4. Update the `"preview"` field in `public/data/Projects.json` for the matching `id`.
5. Run `npm run build` and verify the live-intended path resolves under `/images/shows/...`.
