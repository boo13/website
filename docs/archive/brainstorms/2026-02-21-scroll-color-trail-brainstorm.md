---
date: 2026-02-21
topic: scroll-color-trail
---

# Scroll-Triggered Color Trails on Hero Name

## What We're Building

The color-trail animation (`createColorTrailWords`) currently only plays during the initial word-rise on page load — clones are cleaned up at ~3s. We want the same chromatic aberration / color-trail effect to appear whenever the user scrolls, giving a kinetic sense of speed and direction.

Two trigger moments:
1. **During the Flip morph** — as the hero name shrinks from large hero size to fixed header size (first ~45% of scroll distance)
2. **During general scroll** — any time the fixed header name (`#hero-name-fixed`) is visible and the page is scrolling

## Why This Approach

**Velocity ticker with always-on clones (Approach A)** — After the initial text-mask-rise completes, instead of removing clones entirely, keep them in the DOM at `opacity: 0`. A GSAP ticker reads `ScrollTrigger.getVelocity()` every frame and applies:
- Y-offset to clones opposite to scroll direction (scrolling down → clones shifted above → trail behind)
- Opacity proportional to velocity magnitude
- Spring-back to `Y: 0, opacity: 0` via GSAP tween when velocity drops

One mechanism handles both scenarios (Flip morph + general scroll) because the ticker is always running.

Rejected alternatives:
- **Recreate on scroll start/end** — Clone creation latency misses the first scroll burst; more lifecycle complexity
- **Scrub tied to Flip only** — Doesn't generalize to general scrolling; scrub-based offset feels mechanical rather than physical

## Key Decisions

- **Trail direction**: Colors trail behind (opposite to scroll direction). Scrolling down → clones shifted upward (negative Y).
- **Intensity**: Similar to load animation — not subtle, not velocity-scaled. Consistent visual weight.
- **Clone lifecycle**: Don't cleanup after initial animation. Modify `textMaskRiseWords` (or its caller in `hero.js`) to retain clones at `opacity: 0` instead of removing them.
- **Scope**: Both in-flow hero name (`.hero-name`) for the Flip morph, and fixed header name (`#hero-name-fixed`) for general scroll.
- **Velocity source**: `ScrollTrigger.getVelocity()` — already available since ScrollSmoother is active.

## Implementation Sketch

```
After textMaskRiseWords settles:
  → retain color clones (modify cleanup to only fade, not remove)
  → store clone refs for both hero-name and hero-name-fixed

GSAP ticker (added once in hero.js):
  → vel = ScrollTrigger.getVelocity()
  → yOffset = clamp(vel * -K, -MAX_PX, MAX_PX)  // K = tuning constant
  → opacity = map(|vel|, 0→THRESH, 0→TARGET_OPACITY)
  → set each clone's transform: translateY(yOffset)
  → set each clone's opacity
  → when vel → 0: GSAP.to(clones, { y: 0, opacity: 0, ease: 'power2.out', duration: 0.5 })
```

## Resolved Questions

- **Mobile behavior**: Apply on all screen sizes — no breakpoint guard needed.

## Open Questions

- **Tuning constants**: What K value maps velocity → pixels naturally? Initial guess: `vel * -0.03` with `MAX_PX = 20`. Needs visual tuning during implementation.
- **Ticker cleanup**: Should the ticker be registered once globally or per section? Per GSAP conventions, it should be added inside a `gsap.context()` and removed on cleanup.

## Next Steps

→ `/workflows:plan` for implementation details
