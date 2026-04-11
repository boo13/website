---
title: "Fix Featured Work Gallery Layout and Video Autoplay on Mobile/Tablet"
date: "2026-02-17"
category: ui-bugs
component: featured-work gallery
problem_type: responsive-layout
severity: critical
tags:
  - responsive-design
  - mobile-tablet
  - gsap-context
  - gallery-layout
  - video-autoplay
  - viewport-breakpoints
  - aspect-ratio
  - inline-styles-override
related_files:
  - src/config.js
  - src/styles/index.css
  - src/sections/gallery.js
  - src/main.js
  - src/components/video-lightbox.js
---

# Fix Featured Work Gallery Layout and Video Autoplay on Mobile/Tablet

## Problem

The featured-work gallery section was broken on all non-desktop viewports. Five interrelated issues made it unusable on mobile/tablet:

1. **JS/CSS dual control** — `gallery.js` set inline styles (`flexDirection: column`, `maxWidth: 800px`) that overrode CSS media queries (which set `max-width: 100%`). Two systems fighting over the same properties.
2. **No tablet breakpoint** — `MOBILE_BREAKPOINT = 768` in `config.js`. iPads at 810px got desktop horizontal scroll with 70vw cards — cramped and awkward.
3. **Fragile `vh` heights** — Cards at `70vh`/`50vh`/`45vh` shifted when mobile browsers show/hide the address bar.
4. **No video autoplay on touch** — `setupVideoHover()` skipped touch devices via `ontouchstart` check. Mobile users saw frozen thumbnails.
5. **No cleanup on mobile** — `initGallery()` returned `undefined` on the mobile path (no `gsap.context()`), and `main.js` didn't capture the return value.

## Root Cause

The gallery was designed desktop-first with horizontal scroll as the primary layout. The mobile path was an afterthought that set inline styles to override the desktop CSS — creating a dual-control system where JS and CSS fought over the same properties. The shared `MOBILE_BREAKPOINT` at 768px was too low for tablets (iPad portrait is 820px), so tablets got the cramped desktop horizontal scroll. Card heights used `vh` units that shift when mobile browser chrome appears/disappears. The mobile code path had no `gsap.context()` wrapper and returned nothing, breaking cleanup.

## Solution

### Step 1: Gallery-specific breakpoint (`src/config.js`)

```javascript
export const MOBILE_BREAKPOINT = 768;
export const GALLERY_BREAKPOINT = 1024; // sync with @media (max-width: 1024px) in index.css
```

Separate constant avoids affecting `featured-work.js` parallax section which imports `MOBILE_BREAKPOINT`.

### Step 2: CSS-driven layout at all breakpoints (`src/styles/index.css`)

```css
/* Tablet + mobile: vertical gallery stack — sync with GALLERY_BREAKPOINT in gallery.js */
@media (max-width: 1024px) {
  .featured-work-section {
    height: auto;
    padding: var(--section-padding) 0;
  }

  .gallery-container {
    height: auto;
    display: block;
    overflow: visible;
  }

  .gallery-track {
    flex-direction: column;
    padding: 0 var(--container-padding);
    gap: 2rem;
  }

  .gallery-card {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: none;
    aspect-ratio: 4 / 3;
  }

  .gallery-progress {
    display: none;
  }
}

@media (hover: none) {
  .gallery-card-corner {
    display: none;
  }
}
```

### Step 3: JS mobile path — no inline styles, gsap.context(), vertical video autoplay (`src/sections/gallery.js`)

```javascript
function setupVerticalVideoPlay() {
  cards.forEach((card) => {
    const video = card.querySelector('.card-video');
    if (!video) return;

    ScrollTrigger.create({
      trigger: card,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => {
        if (video.readyState === 0) video.load();
        video.play().catch(() => {});
        card.classList.add('is-playing');
      },
      onLeave: () => {
        video.pause();
        card.classList.remove('is-playing');
      },
      onEnterBack: () => {
        video.play().catch(() => {});
        card.classList.add('is-playing');
      },
      onLeaveBack: () => {
        video.pause();
        card.classList.remove('is-playing');
      },
    });
  });
}

// Mobile/tablet path
if (prefersReducedMotion || isCompact) {
  const ctx = gsap.context(() => {
    if (!prefersReducedMotion) {
      setupVerticalVideoPlay();
    }
  }, section);
  setupVideoHover();
  // ... lightbox-close listener, resize handler ...
  return ctx;
}
```

### Step 4: Cleanup in main.js

```javascript
const cleanupGallery = initGallery();
// ... in pagehide handler:
if (cleanupGallery) cleanupGallery.revert();
```

### Step 5: Lightbox close event (`src/components/video-lightbox.js`)

```javascript
lightbox.on('close', () => {
  document.dispatchEvent(new CustomEvent('gallery:lightbox-close'));
});
```

Gallery listens for this event and resumes playback on visible cards via `ScrollTrigger.isActive`.

## Discovery During Testing

During browser verification at iPad portrait (820x1180), **cards rendered at 0x0**. The gallery track was only 82px wide (just its padding).

**Root cause**: The base `.gallery-container` had `display: flex` (row direction) + `overflow: hidden`. When the track switched to `flex-direction: column` via media query, its width was determined by its content. Since cards had `width: 100%` (relative to the track), and the track's width was determined by its content, we got a circular dependency resolving to 0.

**Fix**: Override `.gallery-container` to `display: block; overflow: visible` in the 1024px media query, so the track inherits the container's natural block-level width.

## Verified Viewports

| Viewport | Card Size | Layout | Status |
|----------|-----------|--------|--------|
| 1440x900 (desktop) | 864x630 | flex/row horizontal scroll | Working |
| 1180x820 (iPad landscape) | 708x574 | flex/row horizontal scroll | Working |
| 820x1180 (iPad portrait) | 738x554 | block/column vertical stack | Working |
| 393x852 (iPhone 14 Pro) | 353x280 | block/column vertical stack | Working |
| 375x667 (small phone) | 335x280 | block/column vertical stack | Working |

## Prevention Strategies

1. **CSS owns layout, JS owns animation** — Never set width, height, display, or overflow via JavaScript. Let CSS media queries handle all responsive behavior. JS should only set up GSAP timelines and ScrollTriggers.

2. **Use section-specific breakpoints** — Global breakpoints don't fit every section. The gallery needed 1024px, not the shared 768px. Define per-section breakpoints and cross-reference between CSS and JS with comments.

3. **Avoid `vh` for persistent card dimensions** — Mobile browsers resize chrome dynamically, shifting `vh` mid-scroll. Use `aspect-ratio` for video containers — it's stable through resize. Reserve `vh` for full-screen overlays.

4. **Flex + overflow:hidden is a layout trap** — `overflow: hidden` on a flex parent can prevent children from calculating their width in a column layout. Override to `display: block` or `overflow: visible` when switching flex direction.

5. **Wrap all animation code in `gsap.context()`, even conditional paths** — Both mobile and desktop branches must return the context for cleanup. Prevents orphaned ScrollTriggers and inline styles.

6. **Use ScrollTrigger (not IntersectionObserver) when ScrollSmoother is active** — ScrollSmoother uses transform-based scrolling. IntersectionObserver sees real DOM positions, not smoothed visual positions, causing timing mismatches.

## Related Documentation

- Plan: `docs/plans/2026-02-16-fix-featured-work-mobile-tablet-layout-plan.md`
- Brainstorm: `docs/brainstorms/2026-02-16-featured-work-mobile-fix-brainstorm.md`
- Related solution: `docs/solutions/integration-issues/index2-to-index-migration-with-vite-shim-system-20260216.md`
- Hero gradient plan (responsive pattern reference): `docs/plans/2026-02-16-feat-hero-about-transition-gradient-plan.md`
