# Brainstorm: Grid Items Fixed 16:9 Aspect Ratio

**Date:** 2026-02-21
**Status:** Ready for planning

---

## What We're Building

Change the 7×7 `grid-container` cells in the "Storytelling that goes BIG" slide from viewport-derived (currently ~square) to a fixed 16:9 aspect ratio.

Each `grid-item` should be exactly 16:9 regardless of viewport dimensions. The grid fills the viewport height; on non-16:9 screens it overflows horizontally and gets clipped symmetrically.

---

## Context

- **File:** `src/styles/about-slides.css` (`.slide-goes-big .grid-container`)
- **Current behavior:** `grid-template-columns: repeat(7, 1fr)` + `grid-template-rows: repeat(7, 1fr)` on a container with `inset: 0`. Cells are square on square viewports, otherwise match viewport aspect ratio.
- **GSAP animation:** Scales `grid-container` from `scale: 7` to `scale: 1` on scroll. The animation targets the container element directly — its transform origin and scale behavior should be unaffected by the sizing change.
- **Gap:** 3px between cells, 6 gaps per axis = 18px total per axis.

---

## Why This Approach

### Chosen: CSS `calc` column widths (Approach A)

**Change `grid-template-columns` from:**
```css
grid-template-columns: repeat(7, 1fr);
```
**To:**
```css
grid-template-columns: repeat(7, calc((100vh - 18px) / 7 * 16 / 9));
justify-content: center;
```

**Math:**
- Row height = `(100vh - 18px) / 7` (viewport height minus 6 row gaps, divided by 7 rows)
- Column width = row height × 16/9 = `(100vh - 18px) / 7 * 16 / 9`
- Total grid width = 7 × col + 18px ≈ `(100vh - 18px) × 16/9 + 18px`
- On a 16:9 viewport this equals ~100vw (fills exactly)
- On portrait/tall viewports the grid is narrower than the viewport width — `justify-content: center` centers the overflow symmetrically

**Why not the alternatives:**
- `aspect-ratio: 16/9` on grid items with `auto` columns: CSS Grid track sizing with aspect-ratio on items is underspecified when rows have definite sizes — browser inconsistencies are a real risk.
- JS-computed custom property: overkill when pure CSS calc is exact and has zero runtime cost.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Overflow behavior | Fill height, clip sides | User specified; grid always fully covers viewport height |
| Sizing mechanism | CSS `calc` with `100vh` | Explicit math, reliable, no JS needed |
| Centering | `justify-content: center` | Ensures horizontal overflow is symmetric on portrait viewports |
| HTML/JS changes | None | Pure CSS change |

---

## Implementation Scope

**Files to change:**
- `src/styles/about-slides.css` — 2 CSS property changes on `.slide-goes-big .grid-container`

**No changes needed:**
- `index.html` — HTML structure unchanged
- `src/sections/about-slides.js` — GSAP animation unchanged

---

## Open Questions

_None._

---

## Resolved Questions

- **Overflow behavior on non-16:9 viewports** → Fill height, clip sides (symmetric horizontal overflow)
