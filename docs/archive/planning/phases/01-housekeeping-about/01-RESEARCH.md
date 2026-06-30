# Phase 1: Housekeeping & About Section Structure - Research

**Researched:** 2026-02-09
**Domain:** GSAP ScrollTrigger scroll-driven animations, multi-page HTML extraction, full-viewport slide sections
**Confidence:** HIGH

## Summary

Phase 1 requires two distinct tasks: extracting the Wyatt Earp parallax section to a standalone HTML page, and building a full-viewport slide-based About section with scroll-driven animations. The project already uses GSAP 3.14.2 with ScrollTrigger, and as of 2024, all GSAP plugins (including previously premium plugins like SplitText and DrawSVG) are now 100% free for commercial use following Webflow's acquisition of GSAP.

The About section follows a proven pattern: full-viewport slides (100svh with 100vh fallback) that combine large typography with visual media, animated on scroll using GSAP ScrollTrigger. Each slide uses either scrub-linked (animation progress tied directly to scroll position) or trigger-based animations depending on the desired effect. The technical approach builds on existing codebase patterns: gsap.context() for section initialization, SplitText for text reveals, and ScrollTrigger for scroll binding.

**Primary recommendation:** Use scrub-linked ScrollTrigger timelines for the zoom-out grid effect, trigger-based animations for phone mockup reveals, and leverage the existing text-mask-rise.js pattern for headline animations. For handwritten text draw-on effects, create SVG text paths and animate with DrawSVGPlugin (now free).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.14.2 | Animation engine | Industry standard for complex scroll animations, already in project |
| ScrollTrigger | 3.14.2 (bundled) | Scroll-driven animations | Official GSAP plugin, best-in-class scroll binding |
| SplitText | Latest (free) | Text splitting for animations | Official GSAP plugin, optimized for word/char splitting |
| DrawSVGPlugin | Latest (free) | SVG path drawing | Official GSAP plugin, perfect for handwriting effects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite | 7.3.1 (current) | Build tool | Already configured for multi-page setup |
| Native CSS | Modern spec | Viewport units (svh/dvh) | Full-viewport sections with mobile support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP ScrollTrigger | Framer Motion | GSAP already in project, more mature for scroll effects |
| SplitText | Manual DOM manipulation | SplitText is now free, handles edge cases, optimized |
| DrawSVGPlugin | CSS animation | DrawSVG now free, smoother control, better performance |

**Installation:**
```bash
# Already installed:
npm install gsap@^3.14.2

# Free plugins (no additional install needed):
# SplitText, DrawSVGPlugin, MorphSVG - all now included
```

**Note:** As of fall 2024, Webflow acquired GSAP and made all plugins free including SplitText, DrawSVG, MorphSVG. No Club GSAP membership required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── sections/
│   ├── about-slides.js      # New: About section slide animations
│   └── wyatt-parallax.js    # Extracted: Wyatt Earp for case study page
├── animations/
│   ├── text-mask-rise.js    # Existing: Use for headlines
│   ├── text-draw-on.js      # New: Handwritten SVG text animation
│   └── scroll-defaults.js   # Existing: Plugin registration
├── styles/
│   ├── about-slides.css     # New: Full-viewport slide layouts
│   └── wyatt-parallax.css   # Extracted: Standalone case study styles
case_study_wyatt.html        # New: Standalone case study page
```

### Pattern 1: Full-Viewport Slide Section
**What:** Container sections that fill 100% of viewport height, stacked vertically
**When to use:** Multi-slide narrative sections like About, where each slide is a distinct statement

**Example:**
```css
/* Source: Modern CSS viewport units + GSAP best practices */
.about-slide {
  height: 100vh; /* Fallback */
  height: 100svh; /* Small viewport (address bar visible) */
  min-height: 100svh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Fallback support */
@supports not (height: 100svh) {
  .about-slide {
    height: 100vh;
  }
}
```

### Pattern 2: Scrub-Linked Timeline (Zoom-Out Grid)
**What:** Animation progress directly tied to scroll position (no delay)
**When to use:** Effects that should feel "controlled" by user scroll (zoom, parallax)

**Example:**
```javascript
// Source: GSAP ScrollTrigger docs + existing landing.js pattern
const ctx = gsap.context(() => {
  const tl = gsap.timeline({ paused: true });

  tl.to('.grid-container', {
    scale: 0.3,           // Zoom out to reveal full grid
    duration: 1,
    ease: 'none',         // Linear for scrub
  });

  ScrollTrigger.create({
    trigger: '.slide-goes-big',
    start: 'top top',
    end: '+=150%',        // Scroll distance controls zoom
    scrub: 1.5,           // Smooth catch-up (1.5s delay)
    pin: true,
    animation: tl,
    invalidateOnRefresh: true,
  });
}, section);
```

### Pattern 3: Staggered Trigger Animation (Phone Mockups)
**What:** Elements animate in sequence when section enters viewport
**When to use:** Elements that should have staggered entrance (cards, phones, grid items)

**Example:**
```javascript
// Source: GSAP stagger patterns + existing gallery.js
gsap.from('.phone-mockup', {
  y: 200,               // Rise from below
  opacity: 0,
  duration: 1.2,
  ease: 'power3.out',
  stagger: {
    amount: 0.8,        // Total stagger time across all elements
    from: 'start',      // Stagger from first to last
  },
  scrollTrigger: {
    trigger: '.slide-in-your-hand',
    start: 'top 80%',   // Start when 80% down viewport
    toggleActions: 'play none none reverse',
  },
});
```

### Pattern 4: Section Context Cleanup
**What:** Wrap all section animations in gsap.context() for automatic cleanup
**When to use:** Always, for every section initialization

**Example:**
```javascript
// Source: Existing codebase pattern (landing.js, gallery.js)
export function initAboutSlides() {
  const section = document.querySelector('.about-section');
  if (!section) return () => {};

  const ctx = gsap.context(() => {
    // All ScrollTriggers and animations here
  }, section);

  return () => {
    ctx.revert(); // Automatic cleanup of all animations/triggers
  };
}
```

### Pattern 5: Overlapping Pinned Sections (Goes BIG → In Your Hand)
**What:** Two sections crossfade while both are pinned, creating overlap effect
**When to use:** Deliberate transitions between related slides (scale contrast)

**Example:**
```javascript
// Source: GSAP community forums on overlapping pins
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.slide-goes-big',
    start: 'top top',
    end: '+=200%',
    scrub: 1,
    pin: true,
    pinSpacing: false,  // Critical: allows next section to overlap
  }
});

// Second section pins at same time
ScrollTrigger.create({
  trigger: '.slide-in-your-hand',
  start: 'top top',
  end: '+=100%',
  pin: true,
  scrub: 1,
});
```

### Pattern 6: Multi-Page Vite Configuration
**What:** Add new HTML entry points to rollupOptions.input
**When to use:** Creating standalone pages (case studies, landing variants)

**Example:**
```javascript
// Source: Existing vite.config.js + Vite docs
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        index2: resolve(import.meta.dirname, 'index2.html'),
        wyatt: resolve(import.meta.dirname, 'case_study_wyatt.html'), // New
        // ... other pages
      },
    },
  },
});
```

### Anti-Patterns to Avoid

- **Don't use `scrub: true` for all animations** — Instant scrub (true) feels robotic for some effects. Use `scrub: 1` or `scrub: 1.5` for smooth catch-up delay.

- **Don't create ScrollTriggers before heavy animations finish** — If a timeline with pinning hasn't called refresh() yet, subsequent ScrollTriggers won't account for pin offset. Solution: Call ScrollTrigger.refresh() after timeline creation or use invalidateOnRefresh: true.

- **Don't use 100vh alone for mobile full-viewport sections** — Mobile address bars cause layout shift. Use 100svh (small viewport height) with 100vh fallback.

- **Don't forget prefers-reduced-motion** — Existing codebase pattern: Check at section init, disable animations if user prefers reduced motion.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Splitting text into words/chars for animation | Manual DOM manipulation with .split() | SplitText plugin (now free) | Handles edge cases (line breaks, inline elements, aria labels), optimized, 50% smaller in v3 |
| SVG path drawing animation | Custom stroke-dasharray calculations | DrawSVGPlugin (now free) | Handles complex paths, performance optimized, works with all SVG shapes |
| Scroll position tracking | window.addEventListener('scroll') | ScrollTrigger | Handles resize, refresh, performance, pin spacing, mobile quirks |
| Timeline sequencing on scroll | Multiple scroll listeners | Single ScrollTrigger.create() with timeline | Better performance, coordinated animations, scrub support |
| Full-viewport sections on mobile | 100vh only | 100svh with @supports fallback | Accounts for mobile browser chrome (address bar), prevents content cutoff |
| Image loading placeholders | Custom loading state | Native loading="lazy" + blur placeholder | Browser-optimized, automatic viewport detection |

**Key insight:** GSAP is now completely free (all plugins) as of fall 2024. No reason to avoid SplitText or DrawSVG — they're production-ready, optimized, and handle edge cases that custom solutions miss.

## Common Pitfalls

### Pitfall 1: ScrollTrigger Pin Offset Miscalculation
**What goes wrong:** Subsequent sections jump or overlap incorrectly after a pinned section
**Why it happens:** When a timeline's ScrollTrigger pins an element, it adds spacing to push content down. If you create the next ScrollTrigger before the timeline calls refresh(), it calculates positions without accounting for pin spacing.
**How to avoid:**
- Use `invalidateOnRefresh: true` on timelines with dynamic values
- Manually call `ScrollTrigger.refresh()` after creating all timelines in a section
- Use `pinSpacing: false` when you deliberately want sections to overlap
**Warning signs:** Sections don't stack correctly, animations trigger at wrong scroll positions

### Pitfall 2: Mobile 100vh Content Cutoff
**What goes wrong:** Full-viewport sections cut off content when mobile address bar is visible
**Why it happens:** 100vh measures the viewport height when address bar is hidden, but on initial load/scroll the address bar is visible, making viewport smaller
**How to avoid:** Use new viewport units with fallback:
```css
.slide {
  height: 100vh;        /* Fallback for older browsers */
  height: 100svh;       /* Small viewport (address bar visible) */
  min-height: 100svh;
}

@supports not (height: 100svh) {
  .slide { height: 100vh; }
}
```
**Warning signs:** Content below fold on mobile, layout jumps when scrolling

### Pitfall 3: Loading="lazy" + ScrollTrigger.refresh() Race Condition
**What goes wrong:** Images load after ScrollTrigger calculates positions, causing incorrect trigger points
**Why it happens:** ScrollTrigger measures element positions before lazy images load and expand layout
**How to avoid:**
- Call `ScrollTrigger.refresh()` after images load
- Use image placeholders with fixed aspect ratios
- For critical above-fold images, don't use loading="lazy"
**Warning signs:** Animations trigger too early or late, especially on slower connections

### Pitfall 4: Forgetting gsap.context() Cleanup
**What goes wrong:** Multiple ScrollTriggers stack up on hot reload or page transitions, causing animation jank
**Why it happens:** ScrollTriggers persist after component unmount unless explicitly cleaned up
**How to avoid:** Always wrap section animations in gsap.context() and return revert function:
```javascript
export function initSection() {
  const section = document.querySelector('.section');
  const ctx = gsap.context(() => {
    // All animations here
  }, section);
  return () => ctx.revert(); // Critical cleanup
}
```
**Warning signs:** Animations play multiple times, console warnings about duplicate triggers

### Pitfall 5: Scrub Easing Confusion
**What goes wrong:** Setting ease values on scrubbed animations has no effect
**Why it happens:** When `scrub: true` or `scrub: number`, ScrollTrigger controls playhead directly — animation easing is ignored
**How to avoid:**
- Use `ease: 'none'` for scrubbed animations (makes it explicit)
- Control feel with scrub value: `scrub: 1.5` = 1.5s catch-up delay (smoother)
- For eased effects, use trigger-based animations instead of scrub
**Warning signs:** Changing ease values doesn't affect animation feel

### Pitfall 6: Grid Zoom Overflow Issues
**What goes wrong:** Grid zooms out but doesn't spill beyond viewport edges as intended
**Why it happens:** Parent containers have `overflow: hidden` or grid isn't sized larger than viewport
**How to avoid:**
- Set grid container to 150-200% of viewport dimensions (width and height)
- Ensure no parent elements clip overflow
- Use `transform-origin: center` for zoom to expand in all directions
- Position grid absolutely within slide container
**Warning signs:** Grid reveals but stays within viewport bounds

## Code Examples

Verified patterns from official sources and existing codebase:

### Full-Viewport Slide Layout
```css
/* Source: Modern CSS viewport units spec + mobile best practices */
.about-slide {
  height: 100vh;
  height: 100svh;  /* Small viewport height (mobile address bar visible) */
  min-height: 100svh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2rem;
}

/* Fallback for browsers without svh support (~15% as of 2024) */
@supports not (height: 100svh) {
  .about-slide {
    height: 100vh;
    min-height: 100vh;
  }
}

/* Ensure smooth scrolling between slides */
.about-section {
  scroll-snap-type: y proximity; /* Optional: snap to slides */
}

.about-slide {
  scroll-snap-align: start;
}
```

### Zoom-Out Grid Reveal (Scrub-Linked)
```javascript
// Source: GSAP ScrollTrigger docs + Codrops layered zoom tutorial
export function initGridZoom() {
  const slide = document.querySelector('.slide-goes-big');
  const gridContainer = slide.querySelector('.grid-container');

  const ctx = gsap.context(() => {
    // Set initial state: grid at 3x size, zoomed in on single image
    gsap.set(gridContainer, {
      scale: 3,
      transformOrigin: 'center center',
    });

    const tl = gsap.timeline({ paused: true });

    // Zoom out to reveal full oversized grid
    tl.to(gridContainer, {
      scale: 1,          // Zoom out to natural size (still oversized)
      duration: 1,
      ease: 'none',      // Linear for scrub control
    });

    ScrollTrigger.create({
      trigger: slide,
      start: 'top top',
      end: '+=150%',     // Scroll distance = animation duration
      scrub: 1.5,        // 1.5s smooth catch-up
      pin: true,
      animation: tl,
      invalidateOnRefresh: true,
    });
  }, slide);

  return () => ctx.revert();
}
```

### Phone Mockup Staggered Rise
```javascript
// Source: GSAP stagger docs + existing gallery.js pattern
export function initPhoneMockups() {
  const slide = document.querySelector('.slide-in-your-hand');
  const phones = slide.querySelectorAll('.phone-mockup');

  const ctx = gsap.context(() => {
    gsap.from(phones, {
      y: 200,                    // Start 200px below
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      stagger: {
        amount: 0.8,             // 0.8s total across all phones
        from: 'start',           // Left to right (matches layout)
        ease: 'power1.inOut',
      },
      scrollTrigger: {
        trigger: slide,
        start: 'top 80%',        // Start when slide 80% into view
        toggleActions: 'play none none reverse',
      },
    });
  }, slide);

  return () => ctx.revert();
}
```

### Text Mask Rise (Existing Pattern)
```javascript
// Source: Existing src/animations/text-mask-rise.js
import { textMaskRiseWords } from '../animations/text-mask-rise.js';

export function initAboutText() {
  const slide = document.querySelector('.slide-goes-big');

  const ctx = gsap.context(() => {
    // Handwritten intro line (different animation - see next example)
    // Bold headline using existing pattern
    const cleanup = textMaskRiseWords('.about-headline', {
      duration: 1.5,
      stagger: 0.2,
      yOffset: 30,
      delay: 0.3,
    });

    // Store cleanup for later
    return cleanup;
  }, slide);

  return () => ctx.revert();
}
```

### SVG Handwritten Text Draw-On
```javascript
// Source: GSAP DrawSVGPlugin docs (now free)
import { gsap } from 'gsap';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

export function initHandwrittenText() {
  const textPath = document.querySelector('.handwritten-text-path');

  const ctx = gsap.context(() => {
    // Set initial state: path not drawn
    gsap.set(textPath, { drawSVG: '0%' });

    // Draw on scroll
    gsap.to(textPath, {
      drawSVG: '100%',
      duration: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: textPath.closest('.about-slide'),
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }, textPath.closest('.about-slide'));

  return () => ctx.revert();
}
```

### Overlapping Section Crossfade
```javascript
// Source: GSAP forums on overlapping pinned sections
export function initSlideCrossfade() {
  const slideA = document.querySelector('.slide-goes-big');
  const slideB = document.querySelector('.slide-in-your-hand');

  const ctx = gsap.context(() => {
    // Slide A: Pin and fade out
    const tlA = gsap.timeline({
      scrollTrigger: {
        trigger: slideA,
        start: 'top top',
        end: '+=200%',
        scrub: 1,
        pin: true,
        pinSpacing: false,  // Critical: allows overlap
      }
    });

    tlA.to(slideA, {
      opacity: 0,
      scale: 0.95,
      duration: 0.5,
      ease: 'power2.in',
    }, 0.5); // Start fade halfway through scroll

    // Slide B: Pin and fade in (overlapping)
    const tlB = gsap.timeline({
      scrollTrigger: {
        trigger: slideB,
        start: 'top top',
        end: '+=100%',
        scrub: 1,
        pin: true,
      }
    });

    tlB.from(slideB, {
      opacity: 0,
      scale: 1.05,
      duration: 0.5,
      ease: 'power2.out',
    });
  });

  return () => ctx.revert();
}
```

### Wyatt Earp Extraction Pattern
```html
<!-- Source: Existing index2.html structure -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wyatt Earp and The Cowboy War - Randy Counsman</title>

  <!-- Same fonts/styles as main site -->
  <link rel="stylesheet" href="https://use.typekit.net/bnp0hyp.css">
</head>
<body>
  <!-- Extract section #wyatt-earp from index2.html verbatim -->
  <section id="wyatt-earp" class="parallax-section">
    <!-- ... existing structure ... -->
  </section>

  <!-- Create new entry point -->
  <script type="module" src="/src/main-wyatt.js"></script>
</body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP Club membership for plugins | All plugins free (including SplitText, DrawSVG) | Fall 2024 (Webflow acquisition) | No licensing barriers, use premium plugins freely |
| 100vh only for full viewport | 100svh/100lvh/100dvh units | CSS spec 2022, 85% support 2024 | Better mobile UX, no content cutoff from address bars |
| Custom scroll listeners | ScrollTrigger plugin | GSAP 3.0 (2019), matured 2024 | Better performance, automatic resize handling |
| Manual text splitting | SplitText v3 (rewritten 2024) | 2024 rewrite | 50% smaller file size, 14 new features |
| stroke-dasharray hacks | DrawSVGPlugin (now free) | Free since fall 2024 | Simpler, more reliable SVG animations |

**Deprecated/outdated:**
- **100vh alone for mobile:** Use 100svh with 100vh fallback to handle mobile address bars
- **Manual scroll event handling:** Use ScrollTrigger instead — handles performance, resize, mobile
- **Avoiding "premium" GSAP plugins:** All plugins are now free, no reason to avoid SplitText/DrawSVG
- **ScrollTrigger.matchMedia() for simple responsive:** Modern approach uses invalidateOnRefresh for dynamic recalculation

## Open Questions

Things that couldn't be fully resolved:

1. **Exact grid size for "overwhelming" effect**
   - What we know: Grid should spill off all viewport edges (larger than 100vw/100vh)
   - What's unclear: Exact multiplier (150%? 200%?) depends on design intent
   - Recommendation: Start with 175% width/height, tune visually during implementation

2. **Phone mockup content sources**
   - What we know: Mix of static screenshots and video/image sequences, user will provide assets
   - What's unclear: Exact file formats, dimensions, naming conventions
   - Recommendation: Build structure to accept both `<img>` and `<video>` elements, swap content later

3. **Handwritten font path tracing**
   - What we know: DrawSVGPlugin animates SVG paths, handwritten font needs path representation
   - What's unclear: Whether to convert font to SVG paths or use pre-made SVG text
   - Recommendation: Use SVG text tool (like Illustrator) to convert handwritten text to paths initially, consider font-to-path automation if text changes frequently

4. **"This is me" portrait placeholder approach**
   - What we know: Eventual Gaussian splat / particle-to-photo effect, currently placeholder
   - What's unclear: Best placeholder structure to support future effect swap
   - Recommendation: Use simple div container with background image, structure allows canvas overlay later

5. **Exact crossfade timing between "goes BIG" and "in your hand"**
   - What we know: Should be special overlap moment emphasizing scale contrast
   - What's unclear: Optimal overlap percentage and fade duration
   - Recommendation: Start with 50% overlap (second slide starts fading in when first is 50% scrolled), adjust during polish phase

## Sources

### Primary (HIGH confidence)
- [GSAP is Now Completely Free](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/) — Webflow acquisition, all plugins free
- [GSAP ScrollTrigger Documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — Official API reference
- [GSAP DrawSVG Plugin](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/) — Official SVG animation plugin
- [From SplitText to MorphSVG: Free GSAP Plugins](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) — SplitText v3 features
- [Learn Viewport Units (svh, lvh, dvh)](https://webdesign.tutsplus.com/learn-these-viewport-relative-css-units-100vh-100dvh-100lvh-100svh--cms-108537t) — Modern mobile viewport handling
- [Vite Building for Production](https://vite.dev/guide/build) — Multi-page build configuration
- Existing codebase: vite.config.js, src/sections/landing.js, src/sections/gallery.js, src/animations/text-mask-rise.js

### Secondary (MEDIUM confidence)
- [Building a Layered Zoom Scroll Effect with GSAP](https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/) — Zoom-out grid technique
- [GSAP ScrollTrigger: Complete Guide with 20+ Examples](https://gsapify.com/gsap-scrolltrigger) — Best practices compilation
- [Fade in/out transition between overlapping pinned sections](https://gsap.com/community/forums/topic/35162-fade-in-and-out-transition-between-overlapping-pinned-sections-with-full-scroll/) — Crossfade pattern
- [Parallax Elements at Different Speed](https://gsap.com/community/forums/topic/25997-parallax-elements-at-different-speed/) — Multi-speed parallax approach
- [How to Build a Skeleton Loading Placeholder](https://www.letsbuildui.dev/articles/how-to-build-a-skeleton-loading-placeholder/) — Image placeholder patterns

### Tertiary (LOW confidence)
- [We spent six days on this GSAP resize bug](https://sdust.dev/posts/2024-06-24_we-spent-six-days-on-this-gsap-resize-bug) — Real-world pitfall example
- Various GSAP community forum discussions on invalidateOnRefresh, pinSpacing, refresh timing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — GSAP already in project, all plugins now free (verified via official sources)
- Architecture: HIGH — Patterns match existing codebase (landing.js, gallery.js) and GSAP official examples
- Pitfalls: MEDIUM-HIGH — Based on official docs + community forums, some context-specific

**Research date:** 2026-02-09
**Valid until:** ~30 days (GSAP is stable, mobile viewport units are stable spec)

**Key findings verified:**
- GSAP free licensing: Confirmed via CSS-Tricks, Webflow blog, GSAP pricing page
- Viewport units (svh): Confirmed via CSS spec, browser support data (85% as of 2024)
- Vite multi-page: Confirmed via existing vite.config.js and Vite official docs
- ScrollTrigger patterns: Confirmed via existing codebase and GSAP official docs
