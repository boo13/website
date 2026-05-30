# Hero Z-Depth
**Reference:** `0cc8d3b:v4/CinematicZoom.js`
**What's being tested:** Very high scrub (4×) with long scroll window (300%) and heavy blur (18px) to create a slow, film-edit pull through the hero.
**Verdict:** trying

## Config
- `zoomScale: 1.25`
- `blurMax: 18px` (desktop) / `12px` (mobile)
- `scrollDistance: 300%`
- `scrubAmount: 4.0`

## Notes
- v4 original had 800% scroll across ALL sections — this narrows it to just the hero exit.
- The "rack focus" inspiration: video blurs as content exits, giving the feel of a camera racking focus to the next plane.
- High scrub means the scroll feels heavy and deliberate. Test on a trackpad vs. mouse wheel — may need adjustment.
- If 300% is too long on mobile, consider reducing to 200% with scrub 3.0.
