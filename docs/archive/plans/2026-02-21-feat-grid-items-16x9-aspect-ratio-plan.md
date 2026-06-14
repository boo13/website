---
title: "feat: Grid Items 16:9 Aspect Ratio"
type: feat
status: completed
date: 2026-02-21
---

# feat: Grid Items 16:9 Aspect Ratio

Each cell in the 7×7 `grid-container` should be a fixed 16:9 aspect ratio rather than adapting to the viewport's own ratio. The grid fills the viewport height; on non-16:9 screens it overflows horizontally and gets clipped symmetrically by the existing `overflow: hidden` parent chain.

## Context

- **File:** `src/styles/about-slides.css` — `.slide-goes-big .grid-container` (lines 151–162)
- **Current columns:** `grid-template-columns: repeat(7, 1fr)` — cells are square (~1:1) because both column and row tracks are equal fractions of a viewport-filling container
- **Gap:** `3px`, 6 gaps per axis = 18px total per axis
- **GSAP animation:** `scale: 7 → 1` with `transform-origin: center center` — unaffected by column width changes, just row × column sizing changes
- **Clipping:** `.slide-bg`, `.about-slide`, and `.slide-transition-wrapper` all have `overflow: hidden` — horizontal overflow clips correctly without any extra CSS

## Math

Row height = `(container_height - 18px) / 7`

Container height ≈ `100vh` (grid is `inset: 0` inside a `height: 100vh` parent)

Column width for 16:9 cells = row height × 16/9 = `(100vh - 18px) / 7 * 16 / 9`

On a 16:9 monitor: total grid width ≈ 100vw (fills exactly). On portrait/tall viewports: grid is wider than viewport — `justify-content: center` ensures symmetric horizontal overflow.

## Acceptance Criteria

- [x] Each `grid-item` is 16:9 on all viewport sizes
- [x] Grid fills viewport height on all viewport sizes
- [x] On non-16:9 viewports, overflow clips symmetrically (grid is centered)
- [x] GSAP scale animation still works — hero cell fills viewport at `scale: 7`
- [x] No HTML or JS changes

## Implementation

**One file: `src/styles/about-slides.css`**

### Change 1 — Column tracks + centering

In `.slide-goes-big .grid-container`, replace:
```css
grid-template-columns: repeat(7, 1fr);
```
With:
```css
grid-template-columns: repeat(7, calc((100vh - 18px) / 7 * 16 / 9));
justify-content: center;
```

### Change 2 — `svh` unit override for mobile

Add after the `.grid-container` rule block:
```css
@supports (height: 100svh) {
  .slide-goes-big .grid-container {
    grid-template-columns: repeat(7, calc((100svh - 18px) / 7 * 16 / 9));
  }
}
```

`svh` (small viewport height) excludes the mobile browser address bar, matching the `@supports (height: 100svh)` rule already on `.slide-transition-wrapper`. Without this, `100vh` can be slightly taller than the actual container on mobile, making columns fractionally wider than intended.

## Verification

1. Open dev server (`npm run dev`)
2. At desktop (16:9): grid cells should look like landscape video frames (wider than tall)
3. Use browser DevTools to inspect a `.grid-item` — computed width / computed height should be ~1.778 (16/9)
4. Resize to portrait — grid should overflow horizontally and clip symmetrically; no vertical gaps
5. Scroll through the animation — hero cell should still fill the screen at full zoom
