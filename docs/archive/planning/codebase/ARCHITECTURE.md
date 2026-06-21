# Architecture

**Analysis Date:** 2026-02-08

## Pattern Overview

**Overall:** Vite-Bundled Static Portfolio Site with Section-Based ES Module Architecture

**Key Characteristics:**
- Vite bundler with multi-page rollup input (no CDN dependencies)
- GSAP 3.14.2 installed via npm — scroll-driven animations are a primary feature
- Section-based architecture: each scroll section exports an `initSectionName()` function
- ES modules throughout (`"type": "module"` in package.json)
- CSS imported from JS entry points — Vite handles bundling/injection
- `gsap.context()` per section for clean setup/teardown
- `prefers-reduced-motion` respected in every animated section
- No framework, no jQuery, no window globals, no state management library

## Layers

**Build Layer (Vite):**
- Purpose: Bundling, dev server with HMR, multi-page static output
- Contains: `vite.config.js` with rollup `input` map for each HTML page
- Location: Root `vite.config.js`, `package.json`
- Depends on: Node.js, npm
- Used by: Dev workflow (`npm run dev`), CI/CD (`npm run build`)

**Presentation Layer (HTML + CSS):**
- Purpose: Page structure and visual styling
- Contains: HTML pages at repo root, per-page CSS in `src/styles/`
- Location: `index2.html`, `index.html`, `contact.html`, `resume.html`, `examples_mockup.html`, `sandbox.html`; `src/styles/*.css`
- Depends on: Vite (CSS is imported from JS entry points, not linked directly)
- Used by: Browser rendering engine

**Section Layer:**
- Purpose: Scroll-driven animation sequences for the primary page (index2.html)
- Contains: One file per visual section, each exporting an `initSectionName()` function
- Location: `src/sections/` — `landing.js`, `featured-work.js`, `gallery.js`, `credits.js`, `about.js`
- Depends on: Animation layer (`scroll-defaults.js`, `text-mask-rise.js`), `config.js`
- Used by: `src/main.js` orchestrator

**Component Layer:**
- Purpose: Reusable interactive widgets (not section-specific)
- Contains: ES module classes — `Slider`, `ResponsiveVideo`
- Location: `src/components/slider.js`, `src/components/responsive-video.js`
- Depends on: GSAP (Slider uses CustomEase), DOM elements
- Used by: `src/main-index.js` (legacy index.html page)

**Animation Layer:**
- Purpose: Shared GSAP plugin registration and reusable animation recipes
- Contains: `scroll-defaults.js` (registers GSAP + ScrollTrigger, re-exports them), `text-mask-rise.js` (SplitText word-mask reveal)
- Location: `src/animations/`
- Depends on: `gsap` npm package
- Used by: Section layer, component layer

**Orchestration Layer (Entry Points):**
- Purpose: Per-page initialization — imports CSS, wires up sections/components, manages loading screen
- Contains: One `main-*.js` file per HTML page
- Location: `src/main.js`, `src/main-index.js`, `src/main-contact.js`, `src/main-credits.js`, `src/main-resume.js`, `src/main-work.js`, `src/main-examples-mockup.js`
- Depends on: Section layer, component layer, animation layer
- Used by: HTML pages via `<script type="module" src="...">`

**Configuration Layer:**
- Purpose: Shared constants (breakpoints, scrub values)
- Contains: `MOBILE_BREAKPOINT`, `SCRUB` exports
- Location: `src/config.js`
- Depends on: Nothing
- Used by: Section layer

**Data Layer:**
- Purpose: Structured content metadata
- Contains: Project filmography JSON
- Location: `public/data/Projects.json`
- Depends on: Nothing
- Used by: Credits section (fetched at runtime), standalone credits page

## Data Flow

**Page Load Sequence (index2.html — primary page):**

1. Browser requests `index2.html`
2. Vite-bundled `<script type="module">` loads `src/main.js`
3. `main.js` imports `src/styles/index2.css` (Vite injects it)
4. `main.js` calls section init functions: `initCredits()`, `initFeaturedWork()`, `initGallery()`, `initAbout()`
5. Loading screen waits on `document.fonts.ready` Promise
6. On resolution: loading screen fades out, `loadingComplete` custom event dispatched
7. `initLanding()` fires on `loadingComplete` — hero animations begin
8. `pagehide` event triggers cleanup via `gsap.context().revert()`

**Loading Screen Flow:**
```
main.js init()
  ├── Init sections (credits, featured-work, gallery, about)
  ├── Listen for 'loadingComplete' event → initLanding()
  └── Promise.all([document.fonts.ready])
        └── requestAnimationFrame
              ├── .loading-screen.classList.add('hidden')
              ├── Dispatch 'loadingComplete' CustomEvent
              └── setTimeout → remove loading screen from DOM
```

**Credits Section Data Flow:**
```
initCredits() → fetch('data/Projects.json')
                    ↓
              Parse JSON → Build <tr> rows dynamically
                    ↓
              initCreditsPreview() — cursor-following image popup
              initCreditsRowReveal() — IntersectionObserver staggered reveal
```

**Legacy Page Load (index.html):**
```
main-index.js → import CSS + components
  ├── new ResponsiveVideo() — loading overlay + aspect-ratio source switching
  ├── new Slider() — GSAP-animated image carousel with CustomEase
  └── textMaskRiseWords() — title reveal animation
  └── document.fonts.ready → hide loading overlay
```

**State Management:**
- Per-section local variables inside `gsap.context()` closures
- Per-component instance properties (Slider, ResponsiveVideo)
- No centralized state, no data sharing between sections
- Custom events for cross-concern coordination (`loadingComplete`, `heroZoomProgress`, `parallaxProgress`)

## Key Abstractions

**Section Init Functions (`src/sections/*.js`):**
- Pattern: Named export `initSectionName()` that returns a cleanup function (or `gsap.context`)
- Responsibilities: Query DOM, create GSAP timelines/ScrollTriggers, set up IntersectionObservers
- Each section checks `prefers-reduced-motion` and falls back to static presentation

**`scroll-defaults.js` (`src/animations/`):**
- Purpose: Single point of GSAP + ScrollTrigger plugin registration
- Pattern: Import `gsap` and `ScrollTrigger` from npm, register, re-export
- All section files import from here instead of directly from `gsap`

**`textMaskRiseWords` (`src/animations/text-mask-rise.js`):**
- Purpose: Reusable text reveal animation using GSAP SplitText with word masking
- Pattern: Function that accepts targets + config overrides, returns cleanup function
- Respects `prefers-reduced-motion`

**Slider (`src/components/slider.js`):**
- Purpose: Portfolio image carousel with GSAP CustomEase animations
- Pattern: ES module class with internal state, click-based navigation
- Responsibilities: Slide animation, counter sync, preview thumbnails, DOM cleanup

**ResponsiveVideo (`src/components/responsive-video.js`):**
- Purpose: Video loading overlay and responsive source switching by aspect ratio
- Pattern: ES module class with internal state
- Responsibilities: Loading overlay with 5s fallback, 9:16 vs 16:9 source detection, playback position preservation

**CreditsTable (`src/main-credits.js`):**
- Purpose: Standalone sortable filmography table for the credits page
- Pattern: Class that fetches JSON, renders rows, handles sort + image popup
- Separate from the section-based `initCredits()` in `src/sections/credits.js`

## Entry Points

**Primary Page:**
- `index2.html` → `src/main.js` — Section-based scroll experience (landing, featured-work, gallery, credits, about)

**Secondary Pages:**
- `index.html` → `src/main-index.js` — Legacy landing with Slider + ResponsiveVideo
- `contact.html` → `src/main-contact.js` — Form submit handler (Formspree)
- `resume.html` → `src/main-resume.js` — Hover preview on credits list
- `examples_mockup.html` → `src/main-examples-mockup.js` — Canvas-based scroll-driven image sequence player
- `sandbox.html` — Development sandbox (in Vite input but no dedicated entry JS)

**Standalone Pages (not in Vite input):**
- `credits.html` → `src/main-credits.js` — Standalone sortable credits table

**CI/CD:**
- `.github/workflows/deploy.yml` — GitHub Actions: checkout → npm ci → npm run build → deploy `dist/` to GitHub Pages

## Error Handling

**Strategy:** Defensive early returns + graceful degradation

**Patterns:**
- Null/empty checks before proceeding: `if (!section || !bg || !fg) return;`
- Section init functions return no-op cleanup when elements are missing: `return () => {}`
- `prefers-reduced-motion` check at section top — sets static state and returns early
- Mobile breakpoint check — falls back to vertical layout (gallery) or skips animation
- 5-second fallback timeout for video loading overlay
- `try-catch` on data fetches (credits JSON) with console error logging
- `video.play().catch(() => {})` to suppress autoplay rejection errors

## Cross-Cutting Concerns

**Accessibility:**
- `prefers-reduced-motion` respected in every animated section and animation utility
- Content shown immediately (no animation) when reduced motion is preferred
- Mobile fallbacks for scroll-heavy interactions (gallery → vertical stack)

**Performance:**
- `gsap.context()` per section for proper teardown — prevents memory leaks on navigation
- `will-change` / `translate3d(0,0,0)` GPU compositing hints in animation-heavy sections
- Lazy frame loading in examples mockup (`requestIdleCallback` chunked preload)
- DOM cleanup: Slider removes excess slide elements, loading screens removed after transition
- `{ passive: true }` on scroll listeners
- `requestAnimationFrame` gating to prevent redundant repaints

**Loading Strategy:**
- `document.fonts.ready` Promise gates initial animations
- `loadingComplete` custom event coordinates section startup
- Loading screen CSS transition (600ms) with DOM removal after completion

**Cleanup:**
- `gsap.context().revert()` on `pagehide` event
- Section init functions return cleanup functions (event listener removal, observer disconnect, animation kill)
- SplitText reverted via returned cleanup closures

**Deployment:**
- GitHub Actions on push to `gh-pages` branch
- Vite builds to `dist/`, uploaded as GitHub Pages artifact
- `public/CNAME` for custom domain

---

*Architecture analysis: 2026-02-08*
*Update when major patterns change*
