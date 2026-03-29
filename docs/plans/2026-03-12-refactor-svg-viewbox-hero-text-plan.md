---
title: "refactor: Replace hero text with SVG viewBox elements"
type: refactor
status: completed
date: 2026-03-12
---

# Replace Hero Text with SVG ViewBox Elements

## Overview

Replace the hero name and subtitle with SVG viewBox text that sizes proportionally to the grid. Replace the SplitText mask-rise and color-trail entrance with an SVG-native clip-path reveal (vertical rise). Flip.fit continues to animate the SVG container between hero and header sizes.

## Problem Statement / Motivation

The current hero text uses CSS `clamp()` for font sizing and SplitText for word-level animation. This works but:
- SplitText mask wrappers cause compositor glitches during Flip scaling (requires a 3s delayed cleanup hack)
- Font-size responsive overrides require per-breakpoint CSS tuning
- The text sizing doesn't inherently follow the grid — it's approximated with `vw` units

SVG viewBox text scales proportionally with its container width, eliminating breakpoint overrides and providing grid-native sizing. SVG `<clipPath>` replaces SplitText mask wrappers with a cleaner animation primitive.

## Design Decisions

1. **Vertical rise reveal** — clipPath rects animate `y`/`height` (bottom-to-top), matching the current mask-rise motion language
2. **Per-layer clipPath for trail** — each `<use>` color trail layer gets its own `<clipPath>` with delayed timing, creating visible lag during entrance
3. **Linear SVG scaling** — single viewBox with `width: 100%`, no breakpoint font-size overrides
4. **Opacity-only scroll trail** — scroll-velocity trail drops y-offset for simplicity (can add back via `transform: translateY()` on `<use>` in follow-up)

## Current System Summary

**HTML (index.html):**
- In-flow: `<h1 class="hero-name">Randy Counsman</h1>` inside `.hero-content` (~line 200)
- Fixed: `<h1 id="hero-name-fixed" class="hero-name hero-name-fixed">Randy Counsman</h1>` inside `.hero-fixed-name-container` (~line 153)
- In-flow subtitle: `<p class="hero-subtitle">...</p>` (~line 201)
- Fixed subtitle: `<p id="hero-subtitle-fixed" ...>...</p>` (~line 156)

**CSS (index2.css):**
- `.hero-name` — `font-size: clamp(3rem, 8vw, 6rem)`, weight 300, ivypresto-display, opacity: 0
- `.hero-name-fixed` — `font-size: clamp(1.25rem, 3.2vw, 2.25rem)`, white-space: nowrap
- `.hero-subtitle` / `.hero-subtitle-fixed` — `clamp(0.875rem, 2vw, 1.125rem)`, uppercase, letter-spacing
- SplitText wrapper rules: `.hero-name .word`, `.hero-name div` (inline-block, overflow: hidden)
- Responsive overrides at 768px

**JS (hero.js):**
1. `textMaskRiseWords(fixedHeroName)` — SplitText word split + y-rise + color trail clones
2. `Flip.fit(fixedHeroName, heroName, { scale: true })` — scale tween between hero/header sizes
3. ScrollTrigger scrubs the Flip tween
4. Fixed subtitle/social track `fixedHeroName.getBoundingClientRect().bottom`
5. Post-animation ticker: scroll velocity drives color trail clone opacity/y-offset
6. After 3s, mask wrapper overflow is cleared (hack for Flip compositor glitches)

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/animations/svg-text-reveal.js` | **Create** | SVG clip-path reveal animation + per-layer color trail |
| `src/sections/hero.js` | **Modify** | Swap textMaskRiseWords for SVG reveal; adapt Flip.fit; update subtitle tracking |
| `src/styles/index2.css` | **Modify** | Replace `.hero-name` font-size rules with SVG container styles; remove SplitText wrapper rules |
| `index.html` | **Modify** | Replace `<h1>` text nodes with `<svg>` elements (both in-flow and fixed) |

Files NOT modified:
- `src/animations/text-mask-rise.js` — still used elsewhere
- `src/animations/color-trail.js` — still used elsewhere

---

## Chunk 1: SVG Markup and Styling

### Task 1: Replace in-flow hero-name with SVG in index.html

**Files:** `index.html:200`

- [x] **Step 1: Replace the in-flow `<h1 class="hero-name">` with an SVG element**

Replace:
```html
<h1 class="hero-name">Randy Counsman</h1>
```

With:
```html
<h1 class="hero-name" aria-label="Randy Counsman">
    <svg class="hero-name-svg" viewBox="0 0 800 80" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <text x="0" y="64" class="hero-name-text">Randy Counsman</text>
    </svg>
</h1>
```

Notes:
- Keep `<h1>` wrapper for accessibility (aria-label) and as Flip measurement target
- viewBox will be auto-fitted after fonts load (Task 5) — initial values are placeholders
- `preserveAspectRatio="xMinYMid meet"` keeps text left-aligned and vertically centered

- [x] **Step 2: Verify page loads without JS errors** — `npm run dev`, check console

### Task 2: Replace fixed hero-name with SVG in index.html

**Files:** `index.html:153`

The fixed hero-name gets the full clip-path + trail structure. Each `<use>` trail layer gets its own `<clipPath>`.

- [x] **Step 1: Replace the fixed `<h1 id="hero-name-fixed">` with SVG**

Replace:
```html
<h1 id="hero-name-fixed" class="hero-name hero-name-fixed">Randy Counsman</h1>
```

With:
```html
<h1 id="hero-name-fixed" class="hero-name hero-name-fixed" aria-label="Randy Counsman">
    <svg class="hero-name-svg" viewBox="0 0 800 80" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <defs>
            <!-- Main text clipPath — one rect per word, animated for vertical rise reveal -->
            <clipPath id="hero-clip-main">
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
            </clipPath>
            <!-- Trail layer 1 clipPath — same rects, delayed timing -->
            <clipPath id="hero-clip-trail-0">
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
            </clipPath>
            <!-- Trail layer 2 clipPath — same rects, more delayed -->
            <clipPath id="hero-clip-trail-1">
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
                <rect class="clip-word" x="0" y="80" width="0" height="0"/>
            </clipPath>
        </defs>
        <!-- Trail layers render behind main text -->
        <use href="#hero-name-text-src" class="hero-trail-layer" clip-path="url(#hero-clip-trail-0)" fill="oklch(0.804 0.146 220)" style="mix-blend-mode: screen; filter: blur(0.4px); opacity: 0;"/>
        <use href="#hero-name-text-src" class="hero-trail-layer" clip-path="url(#hero-clip-trail-1)" fill="oklch(0.656 0.235 13)" style="mix-blend-mode: screen; filter: blur(0.4px); opacity: 0;"/>
        <!-- Main text -->
        <g clip-path="url(#hero-clip-main)">
            <text id="hero-name-text-src" x="0" y="64" class="hero-name-text">Randy Counsman</text>
        </g>
    </svg>
</h1>
```

Notes:
- Three `<clipPath>` elements: one for main text, one per trail color
- Clip rects start at `y="80" height="0"` — the vertical rise animation moves `y` up and expands `height`
- Two `clip-word` rects per clipPath: one for "Randy", one for "Counsman"
- `<use>` elements reference `#hero-name-text-src` (the main `<text>`)
- Trail layers are OUTSIDE the main `<g clip-path>` so they clip independently

- [x] **Step 2: Verify page loads** — `npm run dev`, confirm no console errors

### Task 3: Replace subtitle elements with SVG in index.html

**Files:** `index.html:201` (in-flow), `index.html:156` (fixed)

- [x] **Step 1: Replace in-flow subtitle**

Replace:
```html
<p class="hero-subtitle">Nonfiction Video Development & Production</p>
```

With:
```html
<p class="hero-subtitle" aria-label="Nonfiction Video Development and Production">
    <svg class="hero-subtitle-svg" viewBox="0 0 600 30" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <text x="0" y="20" class="hero-subtitle-text">NONFICTION VIDEO DEVELOPMENT &amp; PRODUCTION</text>
    </svg>
</p>
```

- [x] **Step 2: Replace fixed subtitle**

Replace:
```html
<p id="hero-subtitle-fixed" class="hero-subtitle-fixed" aria-hidden="true">Nonfiction Video Development &amp; Production</p>
```

With:
```html
<p id="hero-subtitle-fixed" class="hero-subtitle-fixed" aria-hidden="true">
    <svg class="hero-subtitle-svg" viewBox="0 0 600 30" preserveAspectRatio="xMinYMid meet">
        <text x="0" y="20" class="hero-subtitle-text">NONFICTION VIDEO DEVELOPMENT &amp; PRODUCTION</text>
    </svg>
</p>
```

- [x] **Step 3: Verify page loads** — `npm run dev`, confirm no console errors

- [x] **Step 4: Commit HTML changes**

```bash
git add index.html
git commit -m "refactor: replace hero text elements with SVG viewBox markup"
```

### Task 4: Update CSS for SVG hero text

**Files:** `src/styles/index2.css`

- [x] **Step 1: Replace `.hero-name` font-size styles with SVG container styles**

Replace lines 230-239:
```css
.hero-name {
  font-family: var(--ff-display);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 300;
  line-height: 1;
  color: var(--color-offwhite);
  margin-bottom: 0.5rem;
  text-shadow: 0 4px 30px oklch(0 0 0 / 0.5);
  opacity: 0;
}
```

With:
```css
.hero-name {
  margin-bottom: 0.5rem;
  opacity: 0;
}

.hero-name-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.hero-name-svg .hero-name-text {
  font-family: 'ivypresto-display', Georgia, serif;
  font-weight: 300;
  fill: var(--color-offwhite);
}
```

Notes:
- Font-size no longer needed — SVG viewBox handles scaling
- `text-shadow` doesn't work on SVG `<text>` — use SVG `<filter>` if needed (follow-up)
- `overflow: visible` allows descenders to render outside viewBox

- [x] **Step 2: Update `.hero-name-fixed` styles**

Replace lines 241-247:
```css
.hero-name-fixed {
  font-size: clamp(1.25rem, 3.2vw, 2.25rem);
  margin-bottom: 0;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
}
```

With:
```css
.hero-name-fixed {
  margin-bottom: 0;
  opacity: 0;
  visibility: hidden;
}
```

- [x] **Step 3: Update `.hero-subtitle` styles**

Replace lines 296-306:
```css
.hero-subtitle {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: oklch(0.968 0.006 75 / 0.7);
  margin-bottom: 2rem;
  text-shadow: 0 2px 15px oklch(0 0 0 / 0.4);
  opacity: 0;
  transform: translateY(20px);
}
```

With:
```css
.hero-subtitle {
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(20px);
}

.hero-subtitle-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.hero-subtitle-svg .hero-subtitle-text {
  font-family: 'aktiv-grotesk', sans-serif;
  font-weight: 400;
  letter-spacing: 0.1em;
  fill: oklch(0.968 0.006 75 / 0.7);
}
```

- [x] **Step 4: Update `.hero-subtitle-fixed` styles**

Replace lines 249-262:
```css
.hero-subtitle-fixed {
  position: fixed;
  z-index: 40;
  pointer-events: none;
  margin: 0;
  opacity: 0;
  visibility: hidden;
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: oklch(0.968 0.006 75 / 0.7);
  text-shadow: 0 2px 15px oklch(0 0 0 / 0.4);
}
```

With:
```css
.hero-subtitle-fixed {
  position: fixed;
  z-index: 40;
  pointer-events: none;
  margin: 0;
  opacity: 0;
  visibility: hidden;
}
```

- [x] **Step 5: Remove SplitText wrapper rules**

Remove lines 282-294:
```css
/* SplitText word animation support */
.hero-name .word,
.hero-name-fixed .word {
  display: inline-block;
  will-change: transform, opacity;
}

/* Mask wrapper for rise effect */
.hero-name div,
.hero-name-fixed div {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.15em;
}
```

- [x] **Step 6: Remove responsive font-size overrides at 768px**

Replace lines 1174-1186:
```css
  .hero-name {
    font-size: clamp(2.5rem, 10vw, 4rem);
  }

  .hero-subtitle {
    font-size: clamp(0.55rem, 2.8vw, 0.75rem);
    letter-spacing: 0.1em;
  }

  .hero-subtitle-fixed {
    font-size: clamp(0.55rem, 2.8vw, 0.75rem);
    letter-spacing: 0.1em;
  }
```

With:
```css
  /* Hero name and subtitle scale automatically via SVG viewBox */
```

- [x] **Step 7: Verify reduced-motion rules still apply**

The existing `@media (prefers-reduced-motion: reduce)` rules target `.hero-name` and `.hero-subtitle` — these selectors still work since the `<h1>` and `<p>` wrappers remain. No change needed.

- [x] **Step 8: Commit CSS changes**

```bash
git add src/styles/index2.css
git commit -m "refactor: update hero CSS for SVG viewBox text, remove SplitText wrapper rules"
```

---

## Chunk 2: SVG Reveal Animation

### Task 5: Create svg-text-reveal.js

**Files:** Create `src/animations/svg-text-reveal.js`

This module replaces `textMaskRiseWords` for SVG text. It animates `<clipPath>` rectangles with a vertical rise (y/height) per word. Each `<use>` trail layer gets its own `<clipPath>` with delayed timing.

- [x] **Step 1: Create the module with viewBox auto-fit and vertical clip-path reveal**

Create `src/animations/svg-text-reveal.js`:

```js
/**
 * SVG text reveal animation with per-layer color trail.
 *
 * Replaces SplitText mask-rise for SVG <text> elements.
 * Uses <clipPath> rectangles per word to create a vertical rise reveal,
 * and colored <use> elements with independent clipPaths for the trail.
 */
import { gsap } from 'gsap';

const preset = {
  duration: 2.2,
  stagger: 0.12,
  ease: 'expo.out',
  delay: 0.3,
};

/**
 * Measures each word in an SVG <text> element and returns bounding data.
 * Relies on SVG's getSubStringLength / getStartPositionOfChar APIs.
 *
 * @param {SVGTextElement} textEl - The <text> element
 * @returns {{ word: string, x: number, width: number }[]}
 */
function measureWords(textEl) {
  const fullText = textEl.textContent;
  const words = fullText.split(/\s+/);
  const measurements = [];
  let charIndex = 0;

  for (const word of words) {
    while (charIndex < fullText.length && fullText[charIndex] === ' ') {
      charIndex++;
    }

    const startPos = textEl.getStartPositionOfChar(charIndex);
    const wordLength = textEl.getSubStringLength(charIndex, word.length);

    measurements.push({
      word,
      x: startPos.x,
      width: wordLength,
    });

    charIndex += word.length;
  }

  return measurements;
}

/**
 * Auto-fits an SVG's viewBox to tightly wrap its <text> element's bounding box.
 * Call after fonts are loaded. Includes a retry for Firefox (returns 0 on hidden elements).
 *
 * @param {SVGSVGElement} svg - The <svg> element
 * @param {{ padding?: number }} [options]
 */
export function fitSvgViewBox(svg, { padding = 4 } = {}) {
  const textEl = svg.querySelector('text');
  if (!textEl) return;

  const bbox = textEl.getBBox();

  // Firefox returns 0x0 for hidden SVGs — retry next frame
  if (bbox.width === 0 && bbox.height === 0) {
    requestAnimationFrame(() => fitSvgViewBox(svg, { padding }));
    return;
  }

  svg.setAttribute(
    'viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
  );
}

/**
 * Sets up and plays vertical clip-path reveal animation on SVG text.
 *
 * The reveal animates clipPath rects from y=bottom, height=0 upward to
 * y=top, height=full — a bottom-to-top vertical rise per word.
 *
 * Trail layers use independent <clipPath> elements with delayed timing.
 *
 * @param {SVGSVGElement} svg - The <svg> containing <text>, <clipPath>s, and <use> layers
 * @param {Object} [overrides] - Override preset values
 * @returns {{ cleanup: Function, trailLayers: SVGUseElement[][] }}
 */
export function svgTextReveal(svg, overrides = {}) {
  const settings = { ...preset, ...overrides };
  const textEl = svg.querySelector('.hero-name-text');

  if (!textEl) {
    return { cleanup: () => {}, trailLayers: [] };
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Measure word positions
  const words = measureWords(textEl);
  const bbox = textEl.getBBox();

  // Collect all clipPaths — main + trail layers
  const mainClipRects = svg.querySelectorAll('#hero-clip-main .clip-word');
  const trailClipGroups = [];
  let i = 0;
  while (true) {
    const clipPath = svg.querySelector(`#hero-clip-trail-${i}`);
    if (!clipPath) break;
    trailClipGroups.push(clipPath.querySelectorAll('.clip-word'));
    i++;
  }

  const trailLayers = Array.from(svg.querySelectorAll('.hero-trail-layer'));

  // Set initial positions for ALL clip rects (main + trail)
  const allClipRectSets = [mainClipRects, ...trailClipGroups];
  const bottomY = bbox.y + bbox.height; // start at text bottom

  for (const rectSet of allClipRectSets) {
    words.forEach((w, wi) => {
      if (!rectSet[wi]) return;
      rectSet[wi].setAttribute('x', String(w.x));
      rectSet[wi].setAttribute('y', String(bottomY));
      rectSet[wi].setAttribute('width', String(w.width + 4)); // padding for antialiasing
      rectSet[wi].setAttribute('height', '0');
    });
  }

  if (prefersReducedMotion) {
    // Show text immediately — expand all clips to full
    for (const rectSet of allClipRectSets) {
      words.forEach((w, wi) => {
        if (!rectSet[wi]) return;
        rectSet[wi].setAttribute('y', String(bbox.y));
        rectSet[wi].setAttribute('height', String(bbox.height + 8));
      });
    }
    return { cleanup: () => {}, trailLayers: [trailLayers] };
  }

  const tl = gsap.timeline({ delay: settings.delay });
  const trailStaggerOffset = settings.trailStaggerOffset ?? 0.15;

  // --- Animate main text clip rects (vertical rise) ---
  words.forEach((w, wi) => {
    if (!mainClipRects[wi]) return;
    tl.to(
      mainClipRects[wi],
      {
        attr: {
          y: bbox.y,
          height: bbox.height + 8,
        },
        duration: settings.duration,
        ease: settings.ease,
      },
      wi * settings.stagger
    );
  });

  // --- Animate trail layer clip rects with staggered delay ---
  trailClipGroups.forEach((rectSet, layerIndex) => {
    const layerDelay = (layerIndex + 1) * trailStaggerOffset;

    // Reveal trail clip rects (same vertical rise, delayed)
    words.forEach((w, wi) => {
      if (!rectSet[wi]) return;
      tl.to(
        rectSet[wi],
        {
          attr: {
            y: bbox.y,
            height: bbox.height + 8,
          },
          duration: settings.duration,
          ease: settings.ease,
        },
        wi * settings.stagger + layerDelay
      );
    });

    // Fade in trail layer
    if (trailLayers[layerIndex]) {
      tl.to(
        trailLayers[layerIndex],
        {
          opacity: 0.85,
          duration: settings.duration,
          ease: settings.ease,
        },
        layerDelay
      );

      // Fade out as reveal settles
      tl.to(
        trailLayers[layerIndex],
        {
          opacity: 0,
          duration: settings.duration * 0.25,
          ease: 'power2.in',
        },
        layerDelay + settings.duration * 0.75
      );
    }
  });

  const cleanup = () => {
    tl.kill();
  };

  // Return trail layer elements for the scroll velocity ticker
  return { cleanup, trailLayers: trailLayers.map((el) => [el]) };
}
```

- [x] **Step 2: Run linter** — `npm run lint`, expect no errors in new file

- [x] **Step 3: Commit**

```bash
git add src/animations/svg-text-reveal.js
git commit -m "feat: add SVG vertical clip-path text reveal with per-layer trail"
```

---

## Chunk 3: Hero.js Integration

### Task 6: Update hero.js to use SVG reveal instead of SplitText

**Files:** `src/sections/hero.js`

Changes:
1. Replace `textMaskRiseWords` import with `svgTextReveal` + `fitSvgViewBox`
2. Replace the textMaskRiseWords call with svgTextReveal
3. Add viewBox auto-fitting after fonts load (BEFORE Flip.fit measurement)
4. Remove the 3s delayed mask-wrapper overflow cleanup
5. Adapt the scroll-velocity color trail ticker for SVG `<use>` elements (opacity-only)

- [x] **Step 1: Update imports**

Replace:
```js
import { textMaskRiseWords } from '../animations/text-mask-rise.js';
```

With:
```js
import { svgTextReveal, fitSvgViewBox } from '../animations/svg-text-reveal.js';
```

- [x] **Step 2: Replace textMaskRiseWords call with svgTextReveal**

Replace the entire `cleanupHeroNameMask = textMaskRiseWords(...)` block (lines 79-158) with:

```js
    const fixedSvg = fixedHeroName?.querySelector('.hero-name-svg');

    if (fixedSvg) {
      const { cleanup, trailLayers } = svgTextReveal(fixedSvg, {
        delay: 0.3,
        duration: 2.2,
        stagger: 0.12,
        trailStaggerOffset: 0.15,
      });
      cleanupHeroNameMask = cleanup;

      // Set up scroll-velocity color trail ticker
      if (trailLayers.length) {
        const allClones = trailLayers.flat();
        const numLayers = trailLayers.length;
        let isActive = false;
        let isSpringBack = false;

        const aboutIntroPinST = ScrollTrigger.getById('about-intro-pin');
        const galleryEl = document.querySelector('.featured-work-section');

        tickerFn = function trailTicker() {
          const vel = ScrollSmoother.get()?.getVelocity() ?? 0;
          const absVel = Math.abs(vel);
          const suppressed =
            (aboutIntroPinST?.isActive ?? false) ||
            (galleryEl?.classList.contains('active') ?? false);

          if (!suppressed && absVel > TRAIL_THRESH) {
            if (springBackTween) {
              springBackTween.kill();
              springBackTween = null;
            }
            isSpringBack = false;
            isActive = true;
            const baseOp = gsap.utils.mapRange(
              TRAIL_THRESH,
              TRAIL_THRESH * 6,
              0,
              TRAIL_OPACITY,
              absVel
            );
            trailLayers.forEach((layerClones, i) => {
              const fraction = (i + 1) / numLayers;
              gsap.set(layerClones, {
                opacity: Math.min(baseOp * fraction, TRAIL_OPACITY),
              });
            });
          } else if (isActive && !isSpringBack) {
            isSpringBack = true;
            springBackTween = gsap.to(allClones, {
              opacity: 0,
              ease: 'power2.out',
              duration: 0.5,
              onComplete() {
                isSpringBack = false;
                isActive = false;
                springBackTween = null;
              },
            });
          }
        };

        gsap.ticker.add(tickerFn);
      }
    }
```

Key difference from old code: the velocity ticker no longer animates `y` on clones. SVG `<use>` trail is opacity-only for simplicity. The `trailLayers` return from `svgTextReveal` provides the same array-of-arrays structure the ticker expects.

- [x] **Step 3: Add viewBox auto-fitting after fonts load**

Inside the `fontsReady.then(() => { ... })` block, add viewBox fitting BEFORE the Flip measurement:

```js
      fontsReady.then(() => {
        nameRafId = requestAnimationFrame(() => {
          nameRafId = null;
          ctx.add(() => {
            // Auto-fit SVG viewBoxes to actual font metrics
            const heroSvg = heroName?.querySelector('.hero-name-svg');
            if (heroSvg) fitSvgViewBox(heroSvg);
            if (fixedSvg) fitSvgViewBox(fixedSvg);

            // Also fit subtitle SVGs
            const heroSubSvg = heroSubtitle?.querySelector('.hero-subtitle-svg');
            const fixedSubSvg = fixedSubtitle?.querySelector('.hero-subtitle-svg');
            if (heroSubSvg) fitSvgViewBox(heroSubSvg);
            if (fixedSubSvg) fitSvgViewBox(fixedSubSvg);

            // Flip.fit — same as before, targets the <h1> wrapper
            const nameFlip = Flip.fit(fixedHeroName, heroName, {
```

The rest of the Flip logic stays the same — `Flip.fit` operates on the `<h1>` container, which gets its size from the SVG inside it.

- [x] **Step 4: Remove the post-animation mask-wrapper cleanup**

Delete the delayed call near lines 348-355:
```js
            gsap.delayedCall(3, () => {
              fixedHeroName.querySelectorAll('.word').forEach((w) => {
                if (w.parentElement && w.parentElement !== fixedHeroName) {
                  w.parentElement.style.overflow = '';
                }
                w.style.willChange = 'auto';
              });
            });
```

This targeted SplitText mask wrappers which no longer exist.

- [x] **Step 5: Verify the page loads and hero section works**

Run: `npm run dev`
Expected:
- Hero name appears via vertical clip-path reveal (bottom-to-top rise)
- Color trail visible during reveal with per-layer lag
- Name Flip-scales from hero to header on scroll
- Subtitle and social icons track below the name
- No console errors

- [x] **Step 6: Run linter** — `npm run lint`, expect no errors

- [x] **Step 7: Commit**

```bash
git add src/sections/hero.js
git commit -m "feat: integrate SVG vertical clip-path reveal into hero, replace SplitText"
```

---

## Chunk 4: Verification and Polish

### Task 7: Visual verification across breakpoints

**Files:** None (verification only)

- [x] **Step 1: Desktop verification (1440px)**

Run: `just visual-audit` or manually check at 1440px viewport width.

Check:
- Hero name renders at appropriate size, left-aligned
- Subtitle renders below name, uppercase, correct font
- Scroll: name smoothly scales to header position
- Subtitle fades out during scroll
- Color trail visible during entrance with per-layer lag

- [x] **Step 2: Tablet verification (768px)**

Check:
- SVG text scales proportionally (no font-size media queries — linear scaling)
- Name and subtitle remain readable
- Flip animation still works

- [x] **Step 3: Mobile verification (375px)**

Check:
- Text is legible and not clipped
- No horizontal overflow

- [x] **Step 4: Compare with grid-text-lab.html**

Open both pages side by side. The hero text sizing should match the SVG viewBox behavior demonstrated in the lab page.

### Task 8: Final cleanup

**Files:** `src/styles/index2.css` (if needed)

- [x] **Step 1: Check for orphaned CSS rules**

Search for remaining rules referencing `.hero-name .word`, `.hero-name div`, or other SplitText-specific selectors. Remove if found.

- [x] **Step 2: Check `.color-trail-word` class**

The `.color-trail-word` rule may still be used by other sections. Leave in place.

- [x] **Step 3: Commit any cleanup**

```bash
git add -A
git commit -m "chore: clean up orphaned hero text CSS rules"
```

---

## Risks and Gotchas

### Critical

1. **SVG `<text>` measurement timing** — `getSubStringLength()` and `getBBox()` return 0 if fonts haven't loaded or the SVG isn't in DOM layout. The `fonts.ready` + `requestAnimationFrame` pattern handles this. `fitSvgViewBox` includes a retry for Firefox (returns 0 on hidden elements).

2. **Firefox `getBBox()` on hidden elements** — Firefox returns 0x0 for `visibility:hidden` SVGs. The in-flow hero name starts with CSS `opacity: 0`. If `autoAlpha: 0` is set before measurement (which sets `visibility: hidden`), Firefox breaks. Ensure measurement happens BEFORE `gsap.set(heroName, { autoAlpha: 0 })`.

3. **Per-layer clipPath count** — With 2 words × 3 clipPaths (main + 2 trail) = 6 animated rects. Each rect animates 2 attributes (`y` + `height`) per frame during entrance. This is main-thread work, not compositor-friendly. Monitor frame times on mobile Safari/Chrome.

4. **Flip.fit with SVG containers** — `Flip.fit` measures `getBoundingClientRect()` on the `<h1>` wrapper. SVG with `overflow: visible` may cause descenders to extend beyond the container rect. Test that Flip measurements are stable. If unstable, try `overflow: hidden` on the SVG and adjust viewBox padding.

### Important

5. **`<use>` + independent clipPath** — Each trail `<use>` has its own `clip-path` attribute referencing its own `<clipPath>`. The `<use>` elements are siblings of the main `<g>`, not inside it. Verify that `<use href="#hero-name-text-src">` resolves correctly when the referenced text is inside a `<g>` with its own clip.

6. **No `text-shadow` on SVG** — The old hero name had `text-shadow: 0 4px 30px oklch(0 0 0 / 0.5)`. SVG doesn't support `text-shadow`. Add an SVG `<filter>` with `<feDropShadow>` in a follow-up if the shadow is visually important.

7. **Scroll velocity trail is opacity-only** — The old trail had both y-offset and opacity. SVG `<use>` can do y-offset via `transform: translateY()` or `attr:y` — this was intentionally deferred to simplify the first iteration. Can be added back later.

### Low Risk

8. **Ticker cleanup** — `gsap.ticker.add()` is a global side effect that `ctx.revert()` does NOT remove. The ticker ref must be in the outer `initHero` closure so cleanup calls `gsap.ticker.remove(tickerFn)`. This is already handled in existing code.

9. **Accessibility** — Both SVG elements are `aria-hidden="true"`, with `aria-label` on the `<h1>` wrapper. The in-flow name is hidden via `autoAlpha: 0` (`visibility: hidden`) which removes it from the accessibility tree. The fixed name has `aria-hidden`. This is an existing gap — not new to SVG migration. Consider adding a `.sr-only` text element in a follow-up.

10. **SVG clipPath animation performance** — Animating SVG clipPath rect attributes is main-thread repaints, unlike the current `transform: translateY()` + `opacity` which are compositor-friendly. The entrance is a one-time animation (~2.2s), so frame drops are unlikely to be noticeable. The scroll ticker only animates opacity on `<use>` elements, which is fine.

## Follow-up Items

- [ ] SVG `<feDropShadow>` filter to replace `text-shadow` (cosmetic)
- [ ] Y-offset on scroll-velocity trail via `transform: translateY()` on `<use>` (if opacity-only feels weak)
- [ ] `.sr-only` accessible text element decoupled from SVG (accessibility improvement)
- [ ] Performance benchmarking on iOS Safari / Android Chrome for clipPath entrance animation

## References

- `grid-text-lab.html` — standalone SVG viewBox sizing test page in repo root
- `docs/plans/2026-02-21-feat-scroll-color-trail-hero-name-plan.md` — original color trail plan (ticker lifecycle docs)
- `docs/brainstorms/2026-02-21-scroll-color-trail-brainstorm.md` — color trail design decisions
