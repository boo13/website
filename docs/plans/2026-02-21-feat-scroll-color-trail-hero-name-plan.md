---
title: "feat: Scroll-Triggered Color Trail on Hero Name"
type: feat
status: completed
date: 2026-02-21
---

# feat: Scroll-Triggered Color Trail on Hero Name

## Overview

After the initial hero name text-mask-rise animation settles (~3s on page load), color-trail clones (chromatic aberration layers) are retained in the DOM at `opacity: 0` instead of being removed. A GSAP ticker reads scroll velocity every frame and drives the clones — shifting them opposite to the direction of scroll to create a kinetic "speed trail" effect, then spring-backing to rest when scrolling stops.

One mechanism handles both trigger scenarios: the Flip morph (name shrinking from hero size to header size during the first ~45% of scroll) and general scroll (any time `#hero-name-fixed` is visible and the page is scrolling).

## Problem Statement / Motivation

The chromatic aberration effect currently exists only during the page-load animation. The hero name is the most visible element during scroll — especially during the Flip morph — and the color trail would reinforce the kinetic feel of that transition. Extending the effect to scroll makes the name feel physically reactive throughout the session.

## Proposed Solution

**Approach A: Velocity ticker with always-on clones** (chosen in brainstorm)

After `textMaskRiseWords` settles, clones remain in the DOM at `opacity: 0`. A named ticker function runs every frame, reads `ScrollSmoother.get().getVelocity()`, applies Y-offset and opacity proportional to velocity magnitude, and spring-backs to rest when velocity drops below a threshold.

One ticker handles both the Flip morph phase and general scroll — no special-casing needed.

## Technical Approach

### Files Modified

| File | Change |
|---|---|
| `src/animations/text-mask-rise.js` | Add `retainClones` + `onComplete` options; skip DOM removal when retaining |
| `src/sections/hero.js` | Capture clone refs via callback; register ticker; update cleanup |
| `src/config.js` | Add trail tuning constants |

### 1. `text-mask-rise.js` API Extension

Add two new options to `textMaskRiseWords(target, options)`:

- **`retainClones: boolean`** — When `true`, suppresses the `removeTrailClones` call on `tl.onComplete`. Clones remain in the DOM at `opacity: 0` (the existing fade-out tween still runs; only the `.remove()` is skipped).
- **`onComplete: (clones: Element[][]) => void`** — Callback invoked on `tl.onComplete` instead of (or after) the normal cleanup. Receives `clones` as an array of arrays: one sub-array per color layer, each containing the clone word elements. This is where the caller registers the ticker.

The existing cleanup function (the current return value) continues to remove clones from the DOM when called, enabling proper teardown via `cleanupHeroNameMask()`.

**No return type change needed** — backward compatibility is maintained. The `onComplete` callback handles the handoff.

### 2. Ticker State Machine

```
States: IDLE → ACTIVE → SPRING_BACK → IDLE

IDLE:
  vel ≤ THRESH → do nothing
  vel > THRESH → apply gsap.set(), set isActive = true → ACTIVE

ACTIVE:
  vel > THRESH → apply gsap.set() (continue)
  vel ≤ THRESH → start spring-back tween, set isSpringBack = true → SPRING_BACK

SPRING_BACK:
  vel > THRESH → kill tween, clear isSpringBack, apply gsap.set() → ACTIVE
  tween onComplete → clear isActive, clear isSpringBack → IDLE
```

Ticker logic (pseudocode in `hero.js`):

```js
// src/sections/hero.js (inside onComplete callback, outer initHero scope)
let tickerFn = null;
let isActive = false;
let isSpringBack = false;
let springBackTween = null;

const createTrailTicker = (clones) => {
  const allClones = clones.flat();
  return function trailTicker() {
    const vel = ScrollSmoother.get()?.getVelocity() ?? 0;
    const absVel = Math.abs(vel);

    if (absVel > TRAIL_THRESH) {
      if (springBackTween) { springBackTween.kill(); springBackTween = null; }
      isSpringBack = false;
      isActive = true;
      const yOff = gsap.utils.clamp(-TRAIL_MAX_PX, TRAIL_MAX_PX, vel * -TRAIL_K);
      const op = gsap.utils.mapRange(TRAIL_THRESH, TRAIL_THRESH * 6, 0, TRAIL_OPACITY, absVel);
      gsap.set(allClones, { y: yOff, opacity: Math.min(op, TRAIL_OPACITY) });
    } else if (isActive && !isSpringBack) {
      isSpringBack = true;
      springBackTween = gsap.to(allClones, {
        y: 0, opacity: 0, ease: 'power2.out', duration: 0.5,
        onComplete() { isSpringBack = false; isActive = false; springBackTween = null; }
      });
    }
  };
};
```

### 3. Scoping Ticker Cleanup (Critical)

`gsap.ticker.add()` is a global side effect. `ctx.revert()` does NOT remove ticker listeners. The ticker ref must be in the outer `initHero` closure so the cleanup function can call `gsap.ticker.remove(tickerFn)`.

```js
// src/sections/hero.js — outer scope
let tickerFn = null;

// Inside fontsReady.then(rAF).ctx.add() → textMaskRiseWords onComplete callback:
tickerFn = createTrailTicker(clones);
gsap.ticker.add(tickerFn);

// Cleanup return (alongside existing ctx.revert + cleanupHeroNameMask):
return () => {
  if (nameRafId !== null) cancelAnimationFrame(nameRafId);
  if (tickerFn !== null) { gsap.ticker.remove(tickerFn); tickerFn = null; }
  if (springBackTween) { springBackTween.kill(); springBackTween = null; }
  ctx.revert();
  cleanupHeroNameMask();
};
```

### 4. Tuning Constants (`src/config.js`)

```js
export const TRAIL_K = 0.03;         // velocity → pixels multiplier
export const TRAIL_MAX_PX = 20;      // max Y offset in px
export const TRAIL_THRESH = 50;      // px/s — below this, spring-back triggers
export const TRAIL_OPACITY = 0.85;   // max clone opacity
```

These are starting values. Visual tuning during implementation is expected.

### 5. Timing: Clone Fade-Out During Initial Animation

`text-mask-rise.js` already fades clones to `opacity: 0` at the end of the rise timeline (existing behavior). With `retainClones: true`, this tween still plays — the clones end at `opacity: 0` before `onComplete` fires. The ticker is registered in `onComplete`, so there is no overlap between the initial fade-out tween and ticker-driven opacity.

### 6. `overflow: clip` Window

`hero.js` uses `gsap.delayedCall(3, ...)` to remove `overflow: clip` from mask wrappers. If the user scrolls in the first 3 seconds, the Y-offset on clones may be clipped visually. This is acceptable — the preloader covers most of this window. The ticker is registered after `onComplete` (~3s), so in the normal case the clip is already removed before the ticker activates.

### 7. Velocity API

Use `ScrollSmoother.get()?.getVelocity()`. This returns the smoothed scroll velocity in px/s, signed (negative = scrolling up). It is the correct source for this transform-based scroll setup. `ScrollTrigger.getVelocity()` (static method) reflects raw scroll position — less accurate under ScrollSmoother.

## Acceptance Criteria

### Functional

- [x] Scrolling down at moderate speed shows clones shifted upward (trail behind) with visible opacity
- [x] Scrolling up shows clones shifted downward
- [x] Stopping scroll causes clones to return to `y: 0, opacity: 0` within ~0.5s
- [x] Trail is visible during the Flip morph phase (name scaling from hero to header size)
- [x] Trail is visible during general scroll (fixed header name, any scroll depth)
- [x] Applies on mobile — no breakpoint guard

### Lifecycle / Correctness

- [x] Ticker is removed on `pagehide` / cleanup (no active ticker after navigation)
- [x] `prefers-reduced-motion`: no ticker registered, no trail (existing early-return in `hero.js` handles this)
- [x] No console errors when scrolling before animation completes (clones don't exist yet, ticker not registered — silent miss is acceptable)
- [x] `springBackTween` is killed before starting a new one when direction reverses mid-spring-back
- [x] No GSAP warnings from setting properties on detached DOM nodes (ticker removed before `ctx.revert()` in cleanup)

### Code

- [x] Ticker ref declared in outer `initHero` scope and nulled after removal
- [x] `retainClones` and `onComplete` options are additive — existing `textMaskRiseWords` callers unaffected
- [x] Tuning constants in `src/config.js` (not inline magic numbers)

## Dependencies & Risks

**Risk: Spring-back tween vs. ticker conflict**
Mitigated by the state machine: any active spring-back tween is killed when the ticker detects velocity re-crossing `THRESH`. The `isSpringBack` flag prevents the spring-back from re-triggering while it is in progress.

**Risk: Ticker registered before clone fade-out completes**
Mitigated by timing: ticker is registered in `tl.onComplete`, which fires after the fade-out tween has already animated clones to `opacity: 0`. No overlap.

**Risk: Scale-adjusted offset inconsistency during Flip morph**
During the Flip morph, `#hero-name-fixed` may have `scaleY > 1` (hero-size). A `20px` local-space offset appears larger in screen-space. This is accepted as a minor visual inconsistency during a sub-second transition — iterating on constants handles it if jarring.

**Risk: `ScrollSmoother.get()` null in edge cases**
Optional-chaining (`?.`) returns `0` safely. The `prefers-reduced-motion` early-return in `hero.js` means the ticker is never registered in the most common null case.

## References & Research

### Internal References

- Color trail creation: `src/animations/color-trail.js:21-77`
- Clone cleanup (current): `src/animations/text-mask-rise.js:100-106`
- Clone creation call site: `src/animations/text-mask-rise.js:109`
- Hero Flip setup and `ctx.add()` deferral: `src/sections/hero.js:91-281`
- `#hero-name-fixed` DOM: `index.html:152-154`
- `cleanupHeroNameMask` call site: `src/sections/hero.js:53,365`
- `gsap.delayedCall(3)` mask cleanup: `src/sections/hero.js:271`
- Hero cleanup pattern (Pattern B): `src/sections/hero.js:363-366`
- `ScrollSmoother.create()`: `src/main.js:25-29`

### Institutional Learnings

- Wrap all animation code in `gsap.context()` — from `docs/solutions/ui-bugs/fix-featured-work-mobile-tablet-layout-conflicts-20260217.md`. The ticker is a global side effect and must be manually removed; `ctx.revert()` handles tweens/triggers, not ticker listeners.
- Use ScrollTrigger (or ScrollSmoother velocity), never IntersectionObserver, when ScrollSmoother is active — from `docs/solutions/performance-issues/grid-batch-loader-offscreen-column-filter.md`.
- Clone lifecycle: let `cleanupHeroNameMask()` handle DOM removal on teardown — don't splice manually. Ticker must be removed before cleanup reverts the DOM.

### GSAP APIs

- `gsap.ticker.add(fn)` / `gsap.ticker.remove(fn)` — global per-frame listener
- `ScrollSmoother.get().getVelocity()` — smoothed scroll velocity in px/s (signed)
- `gsap.utils.clamp(min, max, value)` — clamped linear
- `gsap.utils.mapRange(inMin, inMax, outMin, outMax, value)` — linear remap for opacity
