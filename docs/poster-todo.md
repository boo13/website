# Poster TODO — Credits Section

These credits have no high-quality horizontal image available online. Each one needs a manual screenshot from the actual show/episode to serve as a 16:9 title card.

**Target spec:** 1280×720 minimum, landscape (wider than tall). Save to `public/images/shows/<Name>_TitleCard.webp` and update the `preview` field in `public/data/Projects.json`.

---

## No image found (currently show an empty panel when expanded)

| Show | Network | Year | `id` in Projects.json | Notes |
|------|---------|------|----------------------|-------|
| The Séance | A&E | 2014 | `the-seance` | Paranormal pilot with psychic Jackie Barrett. No online footprint — not indexed in TMDB/TVDB. Grab a landscape frame from the episode itself. |
| Travel Testers | TLC | 2011 | `travel-testers` | Waterpark/vacation testing special. Completely absent from all major databases. |

---

## Low-quality placeholders (currently using 480×360 YouTube thumbnails — 4:3, small)

These show *something* rather than a broken image, but they're low-res and slightly cropped (4:3 source in a 16:10 box). Replace with a proper 1280×720 screenshot when possible.

| Show | Network | Year | `id` in Projects.json | Current file | Action |
|------|---------|------|----------------------|-------------|--------|
| Inside the NSA | Nat Geo | 2012 | `inside-the-nsa` | `InsideNSA_TitleCard.webp` | Find a 16:9 still from the documentary |
| Heavily Ever After | TLC | 2011 | `heavily-ever-after` | `HeavilyEverAfter_TitleCard.webp` | Grab landscape still from the episode |
| Holiday Inc | HGTV | 2011 | `holiday-inc` | `HolidayInc_TitleCard.webp` | Grab landscape still from the episode |
| Ton of Love | TLC | 2011 | `ton-of-love` | `TonOfLove_TitleCard.webp` | Grab landscape still from the episode |

---

## How to update

1. Take a screenshot from the show (or find a proper press image).
2. Resize/crop to 1280×720: `sips -z 720 1280 input.jpg --out resized.jpg`
3. Convert to webp: `cwebp -q 85 resized.jpg -o public/images/shows/<Name>_TitleCard.webp`
4. Update `"preview"` field in `public/data/Projects.json` for the matching `id`.
