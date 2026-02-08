# Coding Conventions

**Analysis Date:** 2026-02-08

## Module System

- **ES modules throughout** — `import`/`export`, `"type": "module"` in package.json
- **No `window` globals** — everything imported/exported explicitly
- **Vite** handles bundling, dev server, HMR, and CSS injection
- **CSS imported from JS entry points** — e.g., `import './styles/index2.css'`

## Naming Patterns

**Files:**
- kebab-case for most files: `scroll-defaults.js`, `featured-work.js`, `responsive-video.js`
- UPPERCASE for docs: `README.md`, `CLAUDE.md`, `DECISIONS.md`

**Functions:**
- camelCase: `initLanding`, `initFeaturedWork`, `textMaskRiseWords`
- Handler naming: `handleX` pattern (e.g., `handleSubmit`)

**Variables:**
- camelCase: `currentImg`, `totalSlides`, `isMobile`
- DOM references: descriptive names (`loadingOverlay`, `sliderImages`)

**CSS Classes:**
- kebab-case: `.loading-overlay`, `.slider-images`
- BEM-like for complex components: `.z-layer-media`, `.hero-overlay`
- Data attributes: `data-layer="hero"`

**CSS Variables:**
- Double dash prefix: `--ff-ivy`, `--ff-bebas`, `--clr-offwhite`
- Semantic naming by type: `--ff-` (font family), `--clr-` (color)

## Code Style

**JavaScript:**
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Arrow functions for callbacks
- No comments unless complex — code is self-documenting

**CSS:**
- 2-space indentation
- One property per line
- Hex colors: `#f7f8f4f4`, `#232323`

**HTML:**
- 2-space indentation
- Double quotes for attributes

**Linting & Formatting:**
- **ESLint** — flat config in `eslint.config.js`: `no-unused-vars: warn`, `no-undef: warn`, `no-console: off`
- **Prettier** — `.prettierrc`: semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 80
- Commands: `npm run lint`, `npm run format`

## Section Pattern

Each section file exports an `initSectionName()` function, called from `main.js`:

```javascript
export function initFeaturedWork() {
  const ctx = gsap.context(() => {
    // section animations
  });

  window.addEventListener('pagehide', () => ctx.revert());
}
```

## GSAP Conventions

**Imports:**
```javascript
import { gsap } from 'gsap';
// or re-export from scroll-defaults.js
```

**Plugin Registration:**
- Centralized in `scroll-defaults.js` — registers ScrollTrigger, CustomEase, Observer
- `ScrollTrigger.defaults()` set in one place to avoid pin conflicts

**Context:**
- `gsap.context()` per section for clean setup/teardown
- Lazy-init heavy timelines when section approaches viewport
- Magic numbers in animation code are fine when tuned visually

## Import Organization

**JS Entry Points** (e.g., `main.js`, `main-index.js`):
1. CSS imports
2. Section/component imports
3. Initialization calls

**Section Files:**
1. GSAP imports (from `gsap` or `scroll-defaults.js`)
2. Config imports (from `src/config.js`)
3. Local helpers
4. Exported init function

## Error Handling

- Early returns for missing DOM elements: `if (!el) return;`
- `try-catch` for async fetches (e.g., credits data)
- Silent failures — no error modals or user-facing error states

## Loading Pattern

```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## Cleanup

- `pagehide` event listener calls `gsap.context().revert()` per section

## Configuration

- Shared constants in `src/config.js`: `MOBILE_BREAKPOINT`, `SCRUB`
- Breakpoints and timing values centralized, not scattered

## Responsive Patterns

**Breakpoint from config:**
```javascript
import { MOBILE_BREAKPOINT } from '../config.js';
```

**Media Queries in JS:**
```javascript
window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
```

---

*Convention analysis: 2026-02-08*
*Update when patterns change*
