---
title: "Filter off-screen grid videos on narrow viewports to avoid wasting bandwidth"
date: 2026-02-21
tags:
  - css-grid
  - aspect-ratio
  - performance
  - video
  - gsap
  - viewport-visibility
  - bandwidth
  - mobile
problem_type: performance-issues
components:
  - src/sections/about-slides.js
  - src/styles/about-slides.css
symptoms:
  - All 25 inner-grid videos activated on load regardless of horizontal visibility
  - On ~390px phone viewport only 3 of 7 columns visible (1 full, 2 partial)
  - 10+ off-screen videos loaded, buffered, and decoded unnecessarily
  - Excess network bandwidth consumed on mobile devices
environment:
  browser: all
  device: narrow phone viewport (~390px wide)
  context: >
    CSS grid switched from square 1fr columns to 16:9 aspect-ratio columns,
    reducing the number of visible columns on small screens from 7 to ~3.
---

# Filter off-screen grid videos on narrow viewports

## Root Cause

The 7×7 `.slide-goes-big .grid-container` uses fixed-width 16:9 columns:

```css
grid-template-columns: repeat(7, calc((100vh - 18px) / 7 * 16 / 9));
```

On a standard phone (~390px wide), each column is ~210px wide, making the total
grid width ~1487px — nearly 4× the viewport. With `justify-content: center`, the
overflow clips symmetrically, leaving only ~3 of 7 columns in view.

The JS batch-loader had no awareness of this. It activated all 25 inner-grid
videos unconditionally — including the 10 videos in columns that are entirely
clipped off-screen — wasting bandwidth on content the user would never see.

A secondary constraint: the grid is at GSAP `scale: 7` when activation fires
(the animation zooms from 7→1 on scroll). This makes `getBoundingClientRect()`
unusable for visibility detection — it returns post-transform coordinates, not
layout positions.

## Solution

### CSS (`src/styles/about-slides.css`)

Changed `grid-template-columns` from `repeat(7, 1fr)` to fixed 16:9 columns,
and centered the grid so horizontal overflow clips symmetrically:

```css
.slide-goes-big .grid-container {
  grid-template-columns: repeat(7, calc((100vh - 18px) / 7 * 16 / 9));
  justify-content: center;
  /* other properties unchanged */
}

@supports (height: 100svh) {
  .slide-goes-big .grid-container {
    grid-template-columns: repeat(7, calc((100svh - 18px) / 7 * 16 / 9));
  }
}
```

The `svh` override matches the existing `@supports` pattern on `.slide-transition-wrapper`
and excludes the mobile browser address bar from the height calculation.

### JS (`src/sections/about-slides.js`)

Three changes, each addressing a distinct concern:

**1. Pre-compute column indices at init (O(N) once → O(1) per lookup)**

```js
const videoColIndex = new Map();
Array.from(gridContainer.children).forEach((item, i) => {
  const vid = item.querySelector('video');
  if (vid) videoColIndex.set(vid, i % 7);
});
```

Avoids re-allocating an array and doing a linear search on every activation call.

**2. `buildVisibilityCheck()` — reads layout metrics once, returns a predicate**

```js
const buildVisibilityCheck = () => {
  const gap = 3; // matches gap: 3px in .slide-goes-big .grid-container
  const containerHeight = gridContainer.offsetHeight;
  const cellWidth = ((containerHeight - gap * 6) / 7) * (16 / 9);
  const gridWidth = cellWidth * 7 + gap * 6;
  const gridLeft = (window.innerWidth - gridWidth) / 2;
  return (video) => {
    const colLeft =
      gridLeft + (videoColIndex.get(video) ?? 0) * (cellWidth + gap);
    return colLeft + cellWidth > 0 && colLeft < window.innerWidth;
  };
};
```

Called once per activation round, closing over the layout values so each video
check is a pure arithmetic comparison with no DOM reads.

**3. Filter before activating — both load paths**

```js
// Idle prefetch path (fires once after loadingComplete)
const onLoadingComplete = () => {
  const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  idleCallbackId = ric(() => {
    const isVisible = buildVisibilityCheck();
    if (heroGridVideo) activateVideo(heroGridVideo); // center cell always visible
    loadBatch(otherGridVideos.filter(isVisible), 0);
  });
};

// ScrollTrigger fallback (fires once when section enters viewport)
ScrollTrigger.create({
  trigger: section,
  start: 'top bottom+=300',
  once: true,
  onEnter: () => {
    const isVisible = buildVisibilityCheck();
    gridVideos.filter(isVisible).forEach(activateVideo);
  },
});
```

`activateVideo` itself is kept clean — no visibility logic inside it. Filtering
happens at the call sites via pre-filtered lists.

## Phone geometry reference

For a 390×844px phone (iPhone 14, portrait):

| Metric | Value |
|--------|-------|
| `svh` | ~844px |
| Row height | (844 − 18) / 7 ≈ 118px |
| Column width | 118 × 16/9 ≈ 210px |
| Total grid width | 7 × 210 + 18 ≈ 1487px |
| Overflow per side | (1487 − 390) / 2 ≈ 548px |

| CSS column | Viewport position | Status |
|------------|------------------|--------|
| 1 | −548 → −338 | hidden |
| 2 | −335 → −126 | hidden (5 videos skipped) |
| 3 | −123 → +87  | partial (41% visible) |
| 4 | +90 → +300  | full (center) |
| 5 | +303 → +513 | partial (41% visible) |
| 6 | +516 → +726 | hidden (5 videos skipped) |
| 7 | +729 → +938 | hidden |

Result: 10 videos (CSS cols 2 & 6, rows 2–6) are never fetched on portrait phone.

## Prevention

### When to apply this pattern

Any time a CSS grid can overflow horizontally on supported viewports AND a
deferred/lazy batch loader activates all children in one shot. The trigger
condition: grid width (cell width × columns + gaps) can exceed viewport width
at any breakpoint. If the loader fires once, the waste is permanent — there is
no second chance to skip already-activated elements.

### `offsetHeight` vs `getBoundingClientRect` with GSAP transforms

When GSAP applies a `scale` transform to a container, `getBoundingClientRect()`
returns the post-transform bounding box — useless for layout geometry. Use
`offsetWidth`, `offsetHeight`, `offsetLeft`, `offsetTop` instead. These are
layout-based values unaffected by CSS transforms. Reconstruct viewport
visibility purely from layout math: compute natural cell dimensions, column
count, and offset, then derive which column indices are visible.

**Rule:** Never use `getBoundingClientRect()` on a GSAP-transformed ancestor to
make visibility decisions.

### The "compute once, filter before loop" pattern

Structure deferred batch loaders in two phases:

- **Init phase:** Walk the grid's children once and build a `Map<video, colIndex>`.
  O(N) at setup, O(1) per lookup at activation.
- **Activation phase:** Before the activation loop, call `buildVisibilityCheck()`
  to read layout metrics once (single `offsetHeight` + `innerWidth` read).
  Filter the child list through the returned predicate. Activate only the
  passing elements.

This keeps the activation loop tight and avoids per-element DOM reads.

### On skipping a resize handler

Acceptable to omit when the loader is fire-once by design (both paths use
`once: true` / single idle callback). Once the activation round has fired,
a resize listener has nothing to re-trigger. Document the assumption explicitly
so a future maintainer doesn't add resize re-triggering without revisiting the
visibility filter.

### Gap constant in JS

If a CSS gap value is duplicated in JS for geometry math, annotate the constant
with a comment pointing at the CSS source:

```js
const gap = 3; // matches gap: 3px in .slide-goes-big .grid-container
```

This makes the coupling explicit and prevents silent drift.

## Related

- `docs/plans/2026-02-21-feat-grid-items-16x9-aspect-ratio-plan.md` — The CSS
  change that established the 16:9 column geometry this optimization builds on.
- `docs/brainstorms/2026-02-21-grid-item-16x9-aspect-ratio-brainstorm.md` —
  Evaluated CSS calc vs aspect-ratio vs JS approaches; explains why pure CSS
  calc was chosen and why the column-width math takes the form it does.
- `docs/solutions/ui-bugs/fix-featured-work-mobile-tablet-layout-conflicts-20260217.md` —
  The `overflow: hidden` parent chain on `.slide-bg`/`.about-slide`/
  `.slide-transition-wrapper` that clips the overflowing grid is documented
  there. Same mechanism; different manifestation.
- **CLAUDE.md gotcha — "Use ScrollTrigger, not IntersectionObserver, when
  ScrollSmoother is active":** The batch-loader uses ScrollTrigger for its
  fallback activation trigger for this exact reason.
- **CLAUDE.md gotcha — "Flex + overflow:hidden blocks column child width":**
  Background on why the `overflow: hidden` parent chain exists and how it
  interacts with grid overflow.
