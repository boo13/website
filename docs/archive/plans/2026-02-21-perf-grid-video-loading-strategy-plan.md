---
title: "perf: Improve grid video loading strategy for fluid about-slides experience"
type: perf
status: completed
date: 2026-02-21
---

# perf: Improve grid video loading strategy for fluid about-slides experience

## Overview

Rework how the `slide-goes-big` grid section loads its ~25 R2-hosted videos and ~24 lazy images so that assets are warm by the time the user scrolls into view. Three coordinated changes: replace the IntersectionObserver with ScrollTrigger, prefetch grid assets after the hero preloader finishes, and prioritize the center cell (`grid-hero`) that's visible first at 7× zoom.

## Problem Statement / Motivation

The `slide-goes-big` section inside `.about-slides-section` is the most asset-heavy part of the site — a 7×7 grid containing ~25 videos (R2 CDN, `preload="none"`, `data-src` deferred) and ~24 poster images (`loading="lazy"`). Currently:

- **IntersectionObserver is unreliable with ScrollSmoother.** ScrollSmoother uses transform-based scrolling, so IntersectionObserver sees real DOM positions instead of smoothed visual positions (`AGENTS.md` gotcha). The 300px `rootMargin` may fire too late or at the wrong scroll position, causing videos to still be loading when the user arrives.
- **No background prefetching.** After the hero preloader completes, the browser is idle but no work is done to warm up the grid assets. The user scrolls through hero → about-intro with nothing happening in the background.
- **Center cell has no priority.** The grid starts at `scale: 7` zoomed into the center `grid-hero` cell. This is the first thing visible, but it loads in the same batch as all 24 other videos.

### Current loading flow

- `about-slides.js:90-112` — `IntersectionObserver` with `rootMargin: '300px'` swaps `data-src` → `src` and calls `.load()` + `.play()` on all grid videos simultaneously when section intersects.
- `main.js:56-61` — `runPreloader` resolves → dispatches `loadingComplete` → hero animations start. No further asset work.
- `index.html:395-399` — Center cell (`grid-hero`) has same `preload="none"` / `data-src` pattern as every other cell.

## Research Summary

### Repository Patterns

- `src/sections/about-slides.js:89-112` — Current IntersectionObserver lazy loader for grid videos.
- `src/sections/about-slides.js:320-412` — ScrollTrigger already pinning the wrapper with `id: 'about-slides-pin'`, `start: 'top top'`, `end: '+=350%'`, `scrub: SCRUB.smooth`.
- `src/sections/about-slides.js:414-431` — Second IntersectionObserver for phone video play/pause (also has the ScrollSmoother mismatch issue, but lower priority since phones appear mid-pin).
- `src/main.js:56-61` — `loadingComplete` event is the natural hook for post-preloader background work.
- `src/components/preloader.js:64-69` — `shouldTrackVideo` skips `preload="none"` videos without autoplay, so grid videos are already excluded from preloader tracking.
- `src/config.js:3` — `CDN_BASE` for R2 video URLs.
- `index.html:395-399` — Center cell (`grid-hero`) markup with poster `images/portfolio/MWBA.jpg`.

### Institutional Learnings

- `AGENTS.md` gotcha: "Use ScrollTrigger, not IntersectionObserver, when ScrollSmoother is active."
- `AGENTS.md` convention: "Use `gsap.context()` per section for clean setup/teardown."

### External Research Decision

Skipped. All three changes use existing GSAP/ScrollTrigger patterns already established in the codebase.

## Proposed Solution

Three coordinated changes, implemented in dependency order:

### Change 1: Replace IntersectionObserver with ScrollTrigger for grid video activation

Replace the `IntersectionObserver` in `about-slides.js:89-112` with a `ScrollTrigger.create()` that fires `onEnter` when the section approaches the viewport. This fixes the ScrollSmoother position mismatch.

- Use the existing `wrapper` element (already has a ScrollTrigger) or the `section` element as trigger.
- Use a separate `ScrollTrigger.create()` with `trigger: section`, `start: 'top bottom+=300'` (equivalent to the current 300px `rootMargin`), and a one-shot `onEnter` that activates videos.
- `once: true` on the ScrollTrigger to auto-kill after first trigger, matching the current `sectionObserver.disconnect()` behavior.

### Change 2: Prefetch grid assets after `loadingComplete`

After the hero preloader resolves and dispatches `loadingComplete`, begin warming up the grid's center-cell video and poster images in the background using idle-time fetching.

- Listen for `loadingComplete` in `about-slides.js` — all grid logic lives there; `main.js` should not know about section-specific prefetch.
- Use `requestIdleCallback` (with a `setTimeout` fallback) to avoid competing with hero animations.
- Swap `data-src` → `src` and call `.load()` on videos in priority order (center cell first, then remaining cells).
- If the ScrollTrigger from Change 1 fires before idle prefetch completes, let it take over — the `data-src` swap is idempotent (checks `source.src` before setting).

### Change 3: Prioritize center cell (`grid-hero`) loading

The grid starts at `scale: 7` showing only the center cell. This video should begin loading first so it's ready before any other grid cell.

- In the prefetch logic from Change 2, separate `grid-hero` video from the rest and load it first.
- The remaining ~24 videos load after, either via idle prefetch or the ScrollTrigger fallback.
- No HTML changes needed — `grid-hero` poster is on the `<video poster>` attribute (not a separate `<img>`), so `loading="lazy"` doesn't apply.

## Technical Considerations

- **Idempotent activation:** The `data-src` → `src` swap already guards with `if (!source.dataset.src || source.src) return;`, so multiple triggers (idle prefetch + ScrollTrigger) won't double-load.
- **Network contention:** Loading 25 videos simultaneously on idle could saturate bandwidth. Batch them — center cell immediately, then stagger remaining videos (e.g., 3-4 at a time using `video.onloadeddata` callbacks to chain the next batch).
- **ScrollTrigger refresh timing:** The new ScrollTrigger for activation should be created inside `ctx` (already the case for the pin trigger) so `ScrollTrigger.refresh()` in `main.js:43` picks it up.
- **Phone IntersectionObserver (L414-431):** This has the same ScrollSmoother mismatch issue but is lower risk since phones appear mid-pin when the section is already active. Out of scope for this plan — note for future cleanup.
- **`requestIdleCallback` availability:** Not available in Safari < 16.4. Use `window.requestIdleCallback || ((cb) => setTimeout(cb, 200))` as fallback.
- **Cleanup:** All new ScrollTriggers go inside `gsap.context()`. Idle callback IDs need cancellation in the cleanup return function.

## SpecFlow Analysis

### User Flow Overview

1. Page loads → preloader tracks hero assets → preloader exits → `loadingComplete` fires.
2. Hero animations play. In background: idle prefetch begins warming center-cell video, then remaining grid videos.
3. User scrolls through hero → about-intro. ScrollTrigger fires when about-slides approaches viewport (300px away).
4. ScrollTrigger activation ensures any remaining un-prefetched videos get `data-src` swapped and loaded.
5. User enters `slide-goes-big` pin. Center cell video is already playing at 7× zoom. Grid zoom-out reveals remaining cells with videos already loaded and playing.

### Flow Permutations Matrix

| Scenario | Expected Behavior |
| --- | --- |
| Fast connection, slow scroll | Idle prefetch loads all grid videos before ScrollTrigger fires. Section fully ready. |
| Fast connection, fast scroll | Idle prefetch loads center cell + some videos. ScrollTrigger activates remainder. Center cell always ready. |
| Slow connection, slow scroll | Idle prefetch loads center cell + progressive batch. ScrollTrigger may activate remaining. Some outer cells may still be loading on entry. |
| Slow connection, fast scroll | ScrollTrigger fires first, activates all. Center cell had head start from prefetch. Some videos still buffering on entry. |
| Reduced motion | No animations, content shown immediately. Prefetch still runs for poster/video visibility. |
| Page hidden before scroll | `pagehide` cleanup cancels idle callbacks and reverts context. No wasted resources. |

## Implementation Tasks

- [x] `src/sections/about-slides.js`: Replace `IntersectionObserver` (L89-112) with `ScrollTrigger.create()` using `trigger: section`, `start: 'top bottom+=300'`, `once: true`, same activation logic.
- [x] `src/sections/about-slides.js`: Add idle-prefetch function that listens for `loadingComplete`, uses `requestIdleCallback` to swap `data-src` → `src` on grid videos in priority order (center cell first, then batches of 4).
- [x] `src/sections/about-slides.js`: Update cleanup function to cancel idle callback IDs and remove `loadingComplete` listener.
- [x] `index.html:395-399`: No change needed — center cell poster is set via the `<video poster>` attribute, not a separate `<img>`, so `loading="lazy"` does not apply. `preload="none"` is intentional and will be cleared by the prefetch logic in Change 2.
- [x] Verify `data-src` swap idempotency — confirm both prefetch path and ScrollTrigger path can run without conflict.
- [x] Update this plan document status after implementation and verification.

## Acceptance Criteria

- [x] Grid video activation uses ScrollTrigger instead of IntersectionObserver, fixing ScrollSmoother position mismatch.
- [x] Center cell (`grid-hero`) video begins loading after hero preloader completes, before user scrolls to section.
- [x] Remaining grid videos load progressively in batches during idle time.
- [x] If user scrolls fast, ScrollTrigger fallback activates any videos not yet prefetched.
- [x] No double-loading — `data-src` swap is idempotent regardless of which path triggers first.
- [x] Cleanup function properly cancels idle callbacks and removes event listeners.
- [x] No regression to hero load time or preloader behavior.
- [x] `npm run lint` passes.

## Dependencies & Risks

- **Dependency:** `loadingComplete` custom event dispatched from `main.js:60` after preloader resolves.
- **Dependency:** Existing `gsap.context()` in `about-slides.js:40` for ScrollTrigger cleanup.
- **Risk:** Idle prefetch competes with hero video playback for bandwidth.
  - **Mitigation:** `requestIdleCallback` defers until browser is idle. Center cell is a single 360p video — minimal bandwidth impact.
- **Risk:** Batched loading via `loadeddata` chaining stalls if one video fails.
  - **Mitigation:** Add error handler per video that advances to next batch regardless. The ScrollTrigger fallback also ensures activation.
- **Risk:** New ScrollTrigger conflicts with existing `about-slides-pin` trigger.
  - **Mitigation:** Use a separate trigger element or position (`'top bottom+=300'` vs `'top top'`) and `once: true` to auto-kill.

## Verification Plan

1. Run static checks:
   - `npm run lint`
2. Run local app:
   - `npm run dev`
3. Browser verification (required tooling):
   - Use `playwright-cli` terminal commands (not MCP Playwright).
4. Validate:
   - Center cell video is loaded/playing before section reaches viewport (check `readyState` or network panel).
   - Remaining videos activate before or as section enters view.
   - Fast-scroll scenario: ScrollTrigger fallback fires correctly.
   - No IntersectionObserver references remain for grid video loading.
   - Hero preloader behavior unchanged — same assets, same timing.
   - Cleanup on `pagehide` properly cancels idle callbacks.
5. Confirm no temporary screenshot artifacts are kept unless explicitly requested.

