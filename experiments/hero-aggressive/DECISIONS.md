# Hero Aggressive
**Reference:** `bd9f06e:v2/zoom-transition.js`
**What's being tested:** High-impact zoom (2.5× scale, 20px blur) with About emerging from the fog of the hero exit.
**Verdict:** trying

## Config
- `zoomScale: 2.5` (desktop) / `2.0` (mobile)
- `blurMax: 20px` (desktop) / `12px` (mobile)
- `scrollDistance: 200%`
- `scrubAmount: 1.2`

## Notes
- The "About emerges from blur" was a v2 original feature. Re-implement in `hero-aggressive.js` if not already present.
- Risk: 2.5× zoom on the hero may feel jarring or overdone vs. the more cinematic restraint of other variants.
- Watch for the transition feeling too abrupt — the about-stub blur reveal needs to be timed so it reads as intentional emergence, not a pop.
