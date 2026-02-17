---
title: Fix Featured Work Gallery Mobile/Tablet Layout
type: fix
status: active
date: 2026-02-16
brainstorm: docs/brainstorms/2026-02-16-featured-work-mobile-fix-brainstorm.md
---

# Fix Featured Work Gallery Mobile/Tablet Layout

## Overview

The featured-work gallery section is broken on all non-desktop viewports. JS inline styles conflict with CSS media queries, there's no tablet breakpoint (iPads get cramped horizontal scroll), card heights use fragile `vh` units, and videos never autoplay on touch devices. Fix by making CSS the sole layout driver with a clean vertical stack on all viewports <=1024px, and adding scroll-triggered video autoplay on mobile/tablet.

## Problem Statement

Five interrelated issues make the gallery unusable on mobile/tablet:

1. **JS/CSS dual control** — `gallery.js:125-132` sets inline styles (`flexDirection: column`, `maxWidth: 800px`) that override CSS media queries (which set `max-width: 100%`). Two systems fighting over the same properties.
2. **No tablet breakpoint** — `MOBILE_BREAKPOINT = 768` in `config.js`. iPads at 810px get desktop horizontal scroll with 70vw cards — cramped and awkward.
3. **Fragile `vh` heights** — Cards at `70vh`/`50vh`/`45vh` shift when mobile browsers show/hide the address bar.
4. **No video autoplay on touch** — `setupVideoHover()` skips touch devices via `ontouchstart` check. Mobile users see frozen thumbnails unless they open the lightbox.
5. **No cleanup on mobile** — `initGallery()` returns `undefined` on the mobile path (no `gsap.context()`), and `main.js:37` doesn't capture the return value even on desktop.

## Proposed Solution

**CSS-driven layout with JS controlling only animation setup/teardown.**

### Breakpoint Strategy

| Range | Layout | Card Sizing | Video Behavior |
|-------|--------|-------------|----------------|
| >1024px | Horizontal scroll (unchanged) | `60vw`, max 900px, `70vh` | ScrollTrigger + containerAnimation |
| 769-1024px | Vertical stack | Full width, `aspect-ratio: 4/3` | ScrollTrigger (vertical) autoplay |
| <=768px | Vertical stack | Full width, `aspect-ratio: 4/3`, smaller text | ScrollTrigger (vertical) autoplay |
| <=480px | Vertical stack | Full width, `aspect-ratio: 4/3`, min-height 280px | ScrollTrigger (vertical) autoplay |

### Key Design Decisions

- **Gallery-specific breakpoint constant** (`GALLERY_BREAKPOINT = 1024`) — not raising the shared `MOBILE_BREAKPOINT`. The `featured-work.js` parallax section also imports `MOBILE_BREAKPOINT` at line 44, and changing it would unintentionally alter tablet behavior there.
- **ScrollTrigger for mobile video autoplay** (not IntersectionObserver) — ScrollSmoother is active on all non-reduced-motion viewports and uses transform-based scrolling. IntersectionObserver sees real DOM positions, not the smoothed visual position, causing timing mismatches. ScrollTrigger integrates with ScrollSmoother's proxy correctly.
- **`gsap.context()` on both paths** — mobile path wraps in context for proper cleanup. `main.js` updated to capture and clean up the return value.
- **Hide hover corners on touch** via `@media (hover: none)` — avoids sticky `:hover` state on tap.

## Technical Considerations

### Files to Modify

| File | Changes |
|------|---------|
| `src/config.js` | Add `GALLERY_BREAKPOINT = 1024` export |
| `src/sections/gallery.js` | Refactor mobile path: remove inline styles, add `gsap.context()`, add vertical ScrollTrigger video autoplay, use `GALLERY_BREAKPOINT` |
| `src/styles/index2.css` | Add 1024px media query for gallery, switch card heights to `aspect-ratio: 4/3` on mobile/tablet, add `dvh` fallback for gallery-container, hide corners on touch |
| `src/main.js` | Capture `initGallery()` return value, add to `pagehide` cleanup |
| `src/components/video-lightbox.js` | Add `lightbox.on('close')` handler to resume visible card autoplay |

### Architecture

- **CSS handles all layout** — `flex-direction`, widths, heights, gaps, padding at every breakpoint
- **JS mobile path** only does: (1) skip horizontal scroll GSAP setup, (2) create vertical ScrollTrigger per video card for autoplay, (3) `setupVideoHover()` for mouse-capable devices
- **Desktop path** unchanged except cleanup fix
- **Both paths** wrapped in `gsap.context(fn, section)` and returned for cleanup

### ScrollTrigger Video Autoplay (Mobile/Tablet)

For each card with a `<video>`, create a ScrollTrigger (no `containerAnimation`) that:
- `trigger`: the `.gallery-card`
- `start`: `'top 80%'` — begin loading/playing when card is 80% from top
- `end`: `'bottom 20%'` — stop when card exits
- `onEnter` / `onEnterBack`: `video.load()` then `video.play()`, add `.is-playing`
- `onLeave` / `onLeaveBack`: `video.pause()`, remove `.is-playing`

This mirrors the desktop `setupScrollVideoPlay()` pattern but without `containerAnimation`.

### Video Resume After Lightbox Close

In `video-lightbox.js`, add a `close` callback that dispatches a custom event (`gallery:lightbox-close`). The gallery listens for this event and re-evaluates which cards are in viewport via `ScrollTrigger.isActive` to resume playback.

### Potential Risks

- **Off-by-one at breakpoint boundary**: CSS uses `max-width: 1024px` (includes 1024px), JS uses `<= GALLERY_BREAKPOINT` (also includes 1024px). These must stay aligned. Add a comment in both files cross-referencing each other.
- **ScrollSmoother interaction**: ScrollSmoother remains active on mobile/tablet. The vertical ScrollTriggers should work correctly since they don't use `containerAnimation`, but verify that `start`/`end` positions are accurate within the smooth-scroll wrapper.
- **Video loading on slow connections**: `preload="none"` means videos load on ScrollTrigger enter. On slow connections, the thumbnail remains visible (`.card-video` starts at `opacity: 0`) until video has frames. The `.is-playing` class triggers the opacity transition. No change needed — existing pattern handles this.

## Acceptance Criteria

### Functional

- [x] Gallery displays as vertical card stack on viewports <=1024px (iPad portrait, landscape, phones)
- [x] Cards use `aspect-ratio: 4/3` sizing on mobile/tablet (no `vh`-based heights)
- [x] Videos autoplay when card scrolls into viewport on mobile/tablet
- [x] Videos pause when card scrolls out of viewport
- [x] Lightbox opens on tap for video cards
- [x] Videos resume autoplay after lightbox close if card is still visible
- [x] Desktop horizontal scroll behavior unchanged at >1024px
- [x] Gallery progress indicator hidden on mobile/tablet
- [x] No JS inline styles applied on mobile/tablet path
- [x] `prefers-reduced-motion` respected — no autoplay, static layout

### Cleanup

- [x] `initGallery()` returns `gsap.context` on both desktop and mobile paths
- [x] `main.js` captures return value and calls `.revert()` on `pagehide`
- [x] Hover corner elements hidden on touch devices via `@media (hover: none)`

### Breakpoints

- [x] >1024px: horizontal scroll, `60vw` cards, `70vh` height
- [x] 769-1024px: vertical stack, full width, `aspect-ratio: 4/3`
- [x] <=768px: vertical stack, full width, `aspect-ratio: 4/3`, smaller text
- [x] <=480px: vertical stack, full width, `aspect-ratio: 4/3`, `min-height: 280px`
- [x] Resize across 1024px boundary triggers reload (existing behavior, threshold updated)

### Testing Viewports

- [x] Desktop: 1440x900
- [x] iPad landscape: 1180x820
- [x] iPad portrait: 820x1180
- [x] iPhone 14 Pro: 393x852
- [x] Small phone: 375x667

## Dependencies & Risks

- **No external dependencies** — all changes use existing GSAP/ScrollTrigger APIs
- **`MOBILE_BREAKPOINT` unchanged** — `featured-work.js` parallax section unaffected
- **Lightbox integration** — the `close` handler in `video-lightbox.js` is the only cross-component change; it uses a custom event to stay decoupled
- **No HTML changes required** — card structure, video elements, and data attributes remain the same

## Implementation Sequence

1. `src/config.js` — add `GALLERY_BREAKPOINT` constant
2. `src/styles/index2.css` — CSS breakpoint changes (layout works without JS changes)
3. `src/sections/gallery.js` — refactor mobile path, add video autoplay, fix cleanup
4. `src/main.js` — capture and clean up gallery context
5. `src/components/video-lightbox.js` — add close handler for video resume
6. Verify at all target viewports

## References

- Brainstorm: `docs/brainstorms/2026-02-16-featured-work-mobile-fix-brainstorm.md`
- Gallery JS: `src/sections/gallery.js` (mobile path lines 125-135, desktop ScrollTrigger lines 137-170, resize handler lines 174-186)
- Gallery CSS: `src/styles/index2.css` (base styles ~line 350, 1024px query ~line 1106, 768px query ~line 1113, 480px query ~line 1245)
- Config: `src/config.js` (MOBILE_BREAKPOINT line 2)
- Main init: `src/main.js` (initGallery call line 37, pagehide cleanup lines 64-77)
- Video lightbox: `src/components/video-lightbox.js` (pause-all on open lines 22-29)
- Hero gradient plan (responsive pattern reference): `docs/plans/2026-02-16-feat-hero-about-transition-gradient-plan.md`
