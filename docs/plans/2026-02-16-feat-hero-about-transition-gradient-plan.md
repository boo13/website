---
title: "feat: Add hero-to-about top gradient fade under fixed header"
type: feat
status: completed
date: 2026-02-16
---

# feat: Add hero-to-about top gradient fade under fixed header

## Overview

Add a subtle top-of-frame gradient that fades in during the hero-to-about transition and sits beneath the fixed header text (`Randy Counsman`). The effect should remain visually consistent across desktop and mobile, and should scrub naturally with the existing hero scroll animation.

## Problem Statement / Motivation

The current transition already fades hero content and darkens the full-frame hero gradient, but it does not provide a dedicated top-edge readability layer under the fixed header title during the handoff into About.

- Existing hero gradient is full-frame and optimized for video mood, not targeted top-header separation (`/Users/randy/Git/website/src/styles/index.css:183`).
- Fixed header title is a separate high-z-index layer that persists independently (`/Users/randy/Git/website/src/styles/index.css:205`).
- Transition timing already exists in `initHero()` and is the correct place to synchronize this new effect (`/Users/randy/Git/website/src/sections/hero.js:24`).

## Research Summary

### Repository Patterns

- Hero structure already includes an overlay node (`.hero-gradient`) in the hero media container (`/Users/randy/Git/website/index.html:195`).
- Fixed header text exists outside hero section and uses fixed positioning + safe-area offset (`/Users/randy/Git/website/index.html:152`, `/Users/randy/Git/website/src/styles/index.css:207`).
- Hero transition animation is controlled by a scrubbed GSAP timeline with ScrollTrigger (`/Users/randy/Git/website/src/sections/hero.js:328`).
- Mobile breakpoints already tune hero header spacing and typography (`/Users/randy/Git/website/src/styles/index.css:1096`, `/Users/randy/Git/website/src/styles/index.css:1218`).

### Institutional Learnings

- Relevant match count in `docs/solutions/`: 1 file, not directly about gradients/hero transition.
- Closest learning (`/Users/randy/Git/website/docs/solutions/integration-issues/index2-to-index-migration-with-vite-shim-system-20260216.md`) reinforces two applicable practices:
  - Keep changes coordinated across code + docs when behavior shifts.
  - Verify with lint/build/browser checks after routing or UI flow changes.

### External Research Decision

Skipped external research. This is a low-risk UI enhancement and the codebase already has clear GSAP/ScrollTrigger patterns and responsive conventions for the exact area being changed.

## Proposed Solution

Introduce a dedicated top transition gradient layer and drive it from the existing hero ScrollTrigger timeline.

1. Add a new decorative gradient element in `/Users/randy/Git/website/index.html` near existing fixed hero header layers so it can stay fixed during section handoff.
2. Add styles in `/Users/randy/Git/website/src/styles/index.css` for:
   - fixed positioning at top of viewport
   - subtle vertical fade (dark at top to transparent)
   - no pointer capture (`pointer-events: none`)
   - z-index below fixed header text but above background/video layers
   - breakpoint-specific height/opacity tuning for `<=768px` and `<=480px`
3. Update `/Users/randy/Git/website/src/sections/hero.js` to animate only opacity (or autoAlpha) for this new layer in the existing scrubbed hero timeline.
4. Keep behavior reversible on scroll-up via scrub and respect reduced-motion behavior (no additional motion when `prefers-reduced-motion` is active).

## Technical Considerations

- **Layering:** Ensure gradient sits below `.hero-fixed-name-container` (`z-index: 40`) but above scene backgrounds to satisfy "beneath header text."
- **Performance:** Animate composited properties (`opacity`/`autoAlpha`), not gradient stop values.
- **Responsiveness:** Use `clamp()`/breakpoint overrides so the gradient does not over-darken mobile viewports.
- **Motion safety:** Reuse existing reduced-motion gate in `initHero()` (`/Users/randy/Git/website/src/sections/hero.js:38`).
- **Cleanup:** Keep animations inside `gsap.context()` for automatic teardown with existing lifecycle.

## SpecFlow Analysis

### User Flow Overview

1. Page loads, preloader exits, hero animation initializes.
2. User scrolls from top: hero recedes, fixed name transitions, top gradient fades in.
3. User enters About intro: gradient remains subtle and does not obscure content.
4. User scrolls back up: gradient fades out in reverse with scrub.

### Flow Permutations Matrix

| Scenario | Expected Behavior |
| --- | --- |
| Desktop, normal motion | Smooth fade-in tied to hero transition progress |
| Mobile (`<=768px`) | Same behavior with tuned gradient height/intensity |
| Small mobile (`<=480px`) | Same behavior, extra subtle to avoid heavy top vignette |
| Reduced motion | No extra animated transition; stable readable baseline |
| Reverse scroll | Gradient intensity reverses smoothly with scrub |

### Gaps and Defaults

- **Ambiguity:** How long gradient should persist after hero handoff.
  - **Default for plan:** Tie entirely to hero ScrollTrigger range so it peaks near transition and naturally reverses; do not add separate long-lived About timeline unless needed.
- **Ambiguity:** Interaction with clickable fixed name.
  - **Default for plan:** Keep gradient non-interactive (`pointer-events: none`) so click-to-scroll remains unchanged.

## Implementation Tasks

- [x] `/Users/randy/Git/website/index.html`: add new top-transition gradient element under fixed header text layer.
- [x] `/Users/randy/Git/website/src/styles/index.css`: add base + responsive styles for new gradient class and z-index rules.
- [x] `/Users/randy/Git/website/src/sections/hero.js`: query gradient node and add scrubbed fade tween in existing timeline.
- [x] `/Users/randy/Git/website/src/sections/hero.js`: ensure reduced-motion path sets a non-animated safe default.
- [x] `/Users/randy/Git/website/docs/plans/2026-02-16-feat-hero-about-transition-gradient-plan.md`: update status/notes after implementation and verification.

## Acceptance Criteria

- [x] A subtle gradient appears from the top edge as scrolling transitions from Hero into About.
- [x] Gradient is visually beneath fixed header text ("Randy Counsman") at all times.
- [x] Effect is visible and appropriately subtle on desktop and mobile (`<=768px`, `<=480px`).
- [x] Scroll-up reverses the gradient smoothly (scrub parity).
- [x] `prefers-reduced-motion` users do not receive new animated motion.
- [x] Existing hero behaviors (name flip, subtitle/social fade, hero zoom) remain intact.

## Success Metrics

- Fixed header text readability remains stable during hero-to-about handoff.
- No z-index conflicts or interaction regressions in fixed header region.
- Visual transition quality is consistent across desktop and mobile checks.

## Dependencies & Risks

- **Dependency:** Existing hero transition timeline and trigger window in `/Users/randy/Git/website/src/sections/hero.js`.
- **Risk:** Overly strong gradient causes heavy top darkening on small screens.
  - **Mitigation:** Separate mobile intensity/height tuning and visual QA.
- **Risk:** Incorrect stacking context places gradient above header text.
  - **Mitigation:** Explicit z-index ordering and verification at runtime.
- **Risk:** False-positive screenshot verification due delayed animation start.
  - **Mitigation:** Validate animation timing before captures, per repo verification rules.

## Verification Plan

1. Run static checks:
   - `npm run lint`
2. Run local app:
   - `npm run dev`
3. Browser verification (required tooling):
   - Use `playwright-cli` terminal commands (not MCP Playwright).
4. Validate at least these states on desktop and mobile viewport:
   - pre-transition (top of hero)
   - mid-transition (hero/about handoff)
   - post-transition (about intro entered)
   - reverse scroll back to hero
5. Confirm no temporary screenshot artifacts are kept unless explicitly requested.

## Implementation Notes (2026-02-17)

- Added `<div class="hero-top-transition-gradient" aria-hidden="true"></div>` just below the fixed header name container in `/Users/randy/Git/website/index.html`.
- Added `.hero-top-transition-gradient` styles in `/Users/randy/Git/website/src/styles/index.css` with `position: fixed`, `z-index: 35`, `pointer-events: none`, and responsive height/intensity tuning for `<=768px` and `<=480px`.
- Updated `/Users/randy/Git/website/src/sections/hero.js` to:
  - query `.hero-top-transition-gradient`
  - fade it in via the existing hero ScrollTrigger timeline (`autoAlpha` tween)
  - set a static reduced-motion-safe default (`autoAlpha: 0.5`) without adding motion.

## Verification Notes (2026-02-17)

- `npm run lint` passed.
- `playwright-cli` verification (after allowing scrub to settle):
  - Desktop `1440x900`: top `0`, mid `0.7613`, post `1`, reverse `0.0007`.
  - Layer order check: top gradient `z-index: 35`, fixed header container `z-index: 40`.
  - Tablet `768x1024`: responsive gradient height/background applied (`112px` with lower-intensity stops).
  - Mobile `390x844`: small-mobile gradient height/background applied (`88px` with lower-intensity stops).
  - Reduced motion emulation: top gradient remained static (`0.5`) at top and after scroll; hero stayed fully opaque (`1`).
- Temporary screenshots were not captured/retained during verification.

## References & Research

### Internal References

- `/Users/randy/Git/website/index.html:152`
- `/Users/randy/Git/website/index.html:195`
- `/Users/randy/Git/website/index.html:226`
- `/Users/randy/Git/website/src/styles/index.css:183`
- `/Users/randy/Git/website/src/styles/index.css:205`
- `/Users/randy/Git/website/src/styles/index.css:1096`
- `/Users/randy/Git/website/src/styles/index.css:1218`
- `/Users/randy/Git/website/src/sections/hero.js:24`
- `/Users/randy/Git/website/src/sections/hero.js:316`
- `/Users/randy/Git/website/src/sections/hero.js:328`
- `/Users/randy/Git/website/src/styles/about-intro.css:9`

### Institutional Learnings

- `/Users/randy/Git/website/docs/solutions/integration-issues/index2-to-index-migration-with-vite-shim-system-20260216.md`

### External References

- None used (intentionally skipped; sufficient local patterns).
