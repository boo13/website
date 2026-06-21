# Featured Work Section — Mobile/Tablet Fix

**Date:** 2026-02-16
**Status:** Brainstorm

## What We're Building

Fix the featured-work gallery section so it works properly across all viewport sizes — phone portrait (~375-430px), iPad portrait (~768-810px), and iPad landscape (~1024-1180px). Currently "everything looks bad" at non-desktop sizes.

## Why It's Broken

### Root Causes

1. **JS/CSS conflict on mobile (<=768px):** `gallery.js` lines 125-132 apply inline styles (`flexDirection: column`, `width: 100%`, etc.) that compete with the CSS `@media (max-width: 768px)` rules. Inline styles win, but the two systems make different assumptions about padding, max-width, and height.

2. **No tablet breakpoint:** The only responsive step is at 768px. iPads in portrait (810px on modern models) get the full desktop horizontal-scroll treatment with `60vw` cards — leaving little room for multiple cards and making the horizontal scroll feel cramped. iPad landscape (1024-1180px) has a single rule reducing cards to `70vw` but the horizontal scroll mechanics aren't adjusted.

3. **Fixed vh heights are fragile:** Cards use `70vh` (desktop), `50vh` (tablet), `45vh` (phone). On mobile browsers where the address bar resizes the viewport, `vh` values shift causing layout jumps. The `gallery-container` at `100vh` has the same problem.

4. **ScrollSmoother + pinned horizontal scroll on narrow viewports:** The GSAP horizontal scroll pin (`start: 'top top'`, `end: +=${scrollDistance}`) doesn't account for touch behavior well. `smoothTouch: 0.1` is set but the scrub-based horizontal scroll can feel janky on touch.

5. **Card content overflow:** At small widths, `.card-content` padding + title text can overflow or crowd the card bottom.

## Approach: Clean Vertical Stack for Mobile/Tablet

**Chosen direction:** Vertical card stack on all viewports below desktop, with videos autoplaying on scroll.

### Key Changes

- **Remove JS inline styles on mobile path.** Let CSS handle the layout entirely via media queries. The JS mobile branch should only skip the GSAP horizontal scroll setup and set up vertical IntersectionObserver-based video autoplay instead.
- **Add a tablet breakpoint (769-1024px).** Cards go full-width vertical stack on tablet too, not just phone. This covers iPad portrait and landscape.
- **Use aspect-ratio instead of vh for card height.** Target ~4:3 ratio on mobile/tablet for taller cards that show more of each image. Use `aspect-ratio: 4/3` with a `min-height` floor.
- **Use `dvh` where supported** for the desktop gallery-container height to handle mobile address bar resizing (progressive enhancement with `vh` fallback).
- **Vertical scroll video autoplay:** On mobile/tablet, use ScrollTrigger (non-containerAnimation) or IntersectionObserver to play videos as cards enter viewport.

### Breakpoint Strategy

| Range | Layout | Card Sizing |
|-------|--------|-------------|
| >1024px | Horizontal scroll (current) | `60vw`, max 900px, `70vh` |
| 769-1024px | Vertical stack | Full width, `aspect-ratio: 4/3` |
| <=768px | Vertical stack | Full width, `aspect-ratio: 4/3`, smaller text |
| <=480px | Vertical stack | Full width, `aspect-ratio: 4/3`, min-height 280px |

## Key Decisions

- **Vertical stack on all sub-desktop viewports** (not horizontal swipe or grid)
- **Taller cards (~4:3)** instead of cinematic 16:9 or fixed vh
- **Autoplay on scroll** for videos on mobile (not thumbnail-only)
- **CSS-driven responsive layout**, JS only controls animation setup/teardown
- **MOBILE_BREAKPOINT in JS raised to 1024px** so tablets also get the vertical path

## Open Questions

None — all key decisions resolved through discussion.
