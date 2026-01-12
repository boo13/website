# Coding Conventions

**Analysis Date:** 2026-01-12

## Naming Patterns

**Files:**
- kebab-case for most files: `styles_contact.css`, `portfolio-1.jpg`
- PascalCase for class files: `Slider.js`, `Video.js`, `CinematicZoom.js`
- UPPERCASE for docs: `README.md`, `CLAUDE.md`
- Version suffixes: `styles3-v2.css`, `LandingPageMontagev04.2.webm`

**Functions:**
- camelCase for all functions: `updateVideoSource()`, `animateSlide()`, `handleLoadingOverlay()`
- No special prefix for async functions
- Handler naming: `handleX` pattern (e.g., `handleSubmit`)

**Variables:**
- camelCase for properties: `currentImg`, `totalSlides`, `isMobile`
- DOM references: descriptive names (`loadingOverlay`, `sliderImages`)
- No underscore prefix for private members

**Types:**
- Not applicable (vanilla JavaScript, no TypeScript)

**CSS Classes:**
- kebab-case: `.loading-overlay`, `.slider-images`, `.z-zoom-container`
- BEM-like for complex components: `.z-layer-media`, `.hero-overlay`
- Data attributes: `data-layer="hero"`, `data-barba="wrapper"`

**CSS Variables:**
- Double dash prefix: `--ff-ivy`, `--ff-bebas`, `--clr-offwhite`
- Semantic naming by type: `--ff-` (font family), `--clr-` (color)

## Code Style

**JavaScript:**
- 2-space indentation
- Single quotes for strings: `'hop'`, `'./video/...'`
- Semicolons required (always)
- Arrow functions for callbacks: `() => this.updateVideoSource()`
- No trailing commas in parameter lists

**CSS:**
- 2-space indentation
- One property per line
- Hex colors: `#f7f8f4f4`, `#232323`
- Properties grouped logically (positioning, then visual)

**HTML:**
- 2-space indentation
- Double quotes for attributes: `<meta charset="utf-8">`
- Self-closing tags with space: `<img ... />`

**Linting:**
- ESLint installed but unconfigured (`package.json`)
- Prettier installed but unconfigured
- No active enforcement

## Import Organization

**Script Loading Order (HTML):**
1. External CDN (GSAP)
2. GSAP plugins (CustomEase, ScrollTrigger)
3. Application classes (Slider.js, Video.js)
4. Initialization script (script.js)

**All scripts use `defer` attribute:**
```html
<script src="..." defer></script>
```

## Error Handling

**Patterns:**
- Early return when DOM elements missing: `if (!this.sliderImages) return;`
- Null checks before assignment in constructors
- Fallback timeouts for loading states (5-second video overlay)

**Error Types:**
- No explicit try-catch blocks (DOM operations don't require them)
- Silent failures logged to console (debug mode)
- Defensive programming over exception handling

## Logging

**Framework:**
- Browser console only (console.log, console.error)
- No logging library

**Patterns:**
- Debug statements in development (v4 has verbose logging)
- Should be wrapped in DEBUG flag for production
- Example: `console.log('Cinematic zoom initialized')` in v4

## Comments

**When to Comment:**
- Class-level JSDoc for class purpose
- Complex animation configurations (parallax config objects)
- Non-obvious calculations (magic numbers should be documented)

**JSDoc:**
```javascript
/**
 * Handles video loading, responsive source switching, and loading overlay.
 */
class ResponsiveVideo { ... }
```

**Inline Comments:**
- Minimal (code is self-documenting)
- Used for non-obvious logic: `// Only run if slider exists`

**TODO Comments:**
- Not consistently used
- No standardized format

## Function Design

**Size:**
- Generally under 30 lines
- Larger functions in CinematicZoom should be refactored

**Parameters:**
- Configuration objects for complex initialization
- Example: `new CinematicZoom({ zDepthPerLayer: 1000, blurMax: 18 })`

**Return Values:**
- Implicit returns common (void methods)
- No Result<T, E> pattern (vanilla JS)

## Module Design

**Exports:**
- Classes attached to `window` object: `window.Slider = Slider;`
- No ES modules (browser globals pattern)

**Instantiation:**
- Conditional based on DOM: `if (window.Slider) new Slider();`
- Single instance per component per page

## GSAP Patterns

**Plugin Registration:**
```javascript
gsap.registerPlugin(CustomEase);
gsap.registerPlugin(ScrollTrigger);
```

**Custom Easing:**
```javascript
CustomEase.create('hop', 'M0,0 C0.071,0.505 ...');
```

**Animation Objects:**
```javascript
gsap.to(element, {
    x: 0,
    duration: 1.5,
    ease: 'hop',
});
```

## Event Handling

**Arrow Functions for Context:**
```javascript
window.addEventListener('resize', () => this.updateVideoSource());
```

**Named Functions for Removal:**
```javascript
function restorePlayback() { ... }
video.addEventListener('loadedmetadata', restorePlayback);
```

**Event Delegation:**
```javascript
document.addEventListener('click', (event) => {
    if (this.slidePreview.contains(event.target)) { ... }
});
```

## Responsive Patterns

**Media Queries in JS:**
```javascript
if (window.matchMedia('(max-aspect-ratio: 9/16)').matches) {
    // Load vertical video
}
```

**Mobile Detection:**
```javascript
this.isMobile = window.matchMedia('(max-width: 768px)').matches;
```

---

*Convention analysis: 2026-01-12*
*Update when patterns change*
