# CLAUDE.md

## What This Is
GSAP-focused portfolio site for Randy Counsman (nonfiction video producer). Animations are a primary feature, not just decoration.

## Stack
- **Vite** for bundling, dev server, hot reload
- **JavaScript**
- **GSAP 3.14.2** via npm with ScrollTrigger, CustomEase, Observer
- **Deployed** to gh-pages as static files

## Project Structure
Organized by **section**, not file type:
```
src/
  sections/       # one file per scroll section (landing, featured-work, gallery, credits, about)
  animations/     # shared animation utilities (scroll-defaults.js registers GSAP plugins)
  components/     # reusable DOM components (slider, responsive-video)
  styles/         # CSS per page, imported from JS entry points
  config.js       # shared breakpoints, timing values
  main.js         # entry for index2.html — imports sections + calls init()
  main-index.js   # entry for index.html (Slider + ResponsiveVideo)
  main-work.js    # entry for work.html (CSS only)
  main-contact.js # entry for contact.html (form handler)
  main-credits.js # entry for credits.html (standalone CreditsTable)
```
Each section exports an `initSectionName()` function called from `main.js`.

Static assets live in `public/` (data, video, images, favicon, CNAME) — Vite copies them as-is to the build output. HTML files stay at the repo root.

## GSAP Conventions
- Use `gsap.context()` per section for clean setup/teardown — no custom lifecycle wrappers
- Centralize `ScrollTrigger.defaults()` in one place to avoid pin conflicts
- Lazy-init heavy timelines (image sequences) when section approaches viewport
- Keep animation code direct — don't abstract into config-driven timeline factories
- Magic numbers in animation code are fine when tuned visually

## Dev Commands
- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
- `npm run lint` — ESLint on `src/`
- `npm run format` — Prettier on `src/`

## Code Style
- ES modules throughout (`"type": "module"` in package.json)
- CSS imported from JS entry points — Vite handles bundling/injection
- Keep it simple — no state management, no framework, no premature abstractions
- See DECISIONS.md for full design rationale and content plans
