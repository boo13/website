# Architecture

**Analysis Date:** 2026-01-12

## Pattern Overview

**Overall:** Static Portfolio Site with Modular Class-Based JavaScript

**Key Characteristics:**
- Traditional client-side static website (no backend)
- Class-based OOP pattern for JavaScript components
- Progressive enhancement (core HTML works without JS)
- GSAP-powered scroll and transition animations
- Conditional component instantiation based on DOM presence

## Layers

**Presentation Layer (HTML + CSS):**
- Purpose: Page structure and visual styling
- Contains: HTML pages, CSS stylesheets, design tokens
- Location: Root HTML files, `css/` directory
- Depends on: Nothing (self-contained)
- Used by: Browser rendering engine

**Component Layer (JavaScript Classes):**
- Purpose: Interactive functionality and animations
- Contains: ES6 classes exposed on `window` object
- Location: `js/` directory, `v4/` directory
- Depends on: GSAP (CDN), DOM elements
- Used by: Orchestration layer (`js/script.js`)

**Orchestration Layer:**
- Purpose: Conditional initialization of components
- Contains: DOMContentLoaded handler
- Location: `js/script.js`
- Depends on: Component layer classes
- Used by: HTML pages via `<script defer>`

**Data Layer:**
- Purpose: Structured content metadata
- Contains: Project filmography, configuration
- Location: `data/Projects.json`, `package.json`
- Depends on: Nothing
- Used by: Future dynamic rendering (not yet implemented)

## Data Flow

**Page Load Sequence:**

1. Browser requests HTML page (e.g., `index.html`)
2. HTML parser loads linked stylesheets (`css/styles.css`)
3. Deferred scripts loaded in order:
   - GSAP library (CDN)
   - CustomEase plugin (CDN)
   - `js/Slider.js` (class definition)
   - `js/Video.js` (class definition)
   - `js/script.js` (initialization)
4. DOMContentLoaded fires
5. `script.js` checks for classes and DOM elements
6. Components instantiated conditionally
7. Classes manage their own state and interactions

**Responsive Video Flow:**
```
Constructor → init() → handleLoadingOverlay() + updateVideoSource()
                         ↓                       ↓
                    5s timeout hide        Check aspect ratio
                                                 ↓
                                     Load vertical (9:16) or standard (16:9)
                                                 ↓
                                     Preserve playback position
```

**Slider Navigation Flow:**
```
User click → Event listener → Determine direction
                                    ↓
                            Update currentImg index
                                    ↓
                            animateSlide(direction)
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
            GSAP animate      Update counter     Update preview
            current/new       and title          thumbnails
```

**State Management:**
- Per-instance class properties (no centralized state)
- No Redux, Vuex, or similar state managers
- Each component manages its own internal state
- No data sharing between components

## Key Abstractions

**ResponsiveVideo (`js/Video.js`):**
- Purpose: Video loading overlay and responsive source switching
- Pattern: Class instance with internal state
- Examples: Single video element per page
- Responsibilities: Loading spinner, aspect ratio detection, source switching

**Slider (`js/Slider.js`):**
- Purpose: Portfolio image carousel with GSAP animations
- Pattern: Class instance with internal state and GSAP timelines
- Examples: Slider on `index.html`
- Responsibilities: Navigation, animation, counter sync, preview thumbnails

**CinematicZoom (`v4/CinematicZoom.js`):**
- Purpose: Z-axis scroll-driven animations
- Pattern: Complex class with multiple sub-systems
- Examples: `v4/index.html` prototype
- Responsibilities: Layer stacking, parallax, rack focus effect

## Entry Points

**Main Pages:**
- `index.html` - Production landing page with video and slider
- `work.html` - Portfolio grid with jQuery (legacy)
- `contact.html` - Contact form with Formspree
- `credits.html` - Full filmography table

**JavaScript Initialization:**
- `js/script.js` - DOMContentLoaded orchestrator
- Conditional instantiation pattern

**Experimental:**
- `v4/index.html` - Cinematic zoom prototype (active development)

## Error Handling

**Strategy:** Defensive programming with early returns

**Patterns:**
- Null checks before proceeding: `if (!this.sliderImages) return;`
- Early exit when required elements missing
- 5-second fallback timeout for video loading
- No try-catch blocks (not necessary for DOM operations)

## Cross-Cutting Concerns

**Logging:**
- Console.log for development debugging
- Debug statements in v4 code (should be removed for production)

**Validation:**
- DOM element existence checks in constructors
- No form validation (Formspree handles server-side)

**Accessibility:**
- `prefers-reduced-motion` support in v4 code
- ARIA labels on interactive icons
- Alt attributes on images (some empty but present)

**Performance:**
- `will-change: transform` CSS hints
- Slide cleanup to prevent DOM accumulation
- 5-second timeout fallback for video loading

---

*Architecture analysis: 2026-01-12*
*Update when major patterns change*
