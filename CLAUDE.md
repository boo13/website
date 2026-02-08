# CLAUDE.md

## What This Is
GSAP-focused portfolio site for Randy Counsman (nonfiction video producer). Animations are a primary feature, not just decoration.

## Stack
- **Vite** for bundling, dev server, hot reload
- **JavaScript**
- **GSAP** with ScrollTrigger, CustomEase, Observer (local vendor builds in `js/vendor/gsap-3.12.4/`)
- **Deployed** to gh-pages as static files

## Project Structure
Organized by **section**, not file type:
```
src/
  sections/       # one file per scroll section (landing, featured-work, trusted-by, contact)
  animations/     # shared animation utilities (scroll defaults, text effects)
  components/     # reusable DOM components (slider, responsive-video)
  config.js       # shared easings, breakpoints, reusable timing values
  main.js         # entry point — wires sections together
```
Each section exports an `init()` function called from `main.js`.

## GSAP Conventions
- Use `gsap.context()` per section for clean setup/teardown — no custom lifecycle wrappers
- Centralize `ScrollTrigger.defaults()` in one place to avoid pin conflicts
- Lazy-init heavy timelines (image sequences) when section approaches viewport
- Keep animation code direct — don't abstract into config-driven timeline factories
- Magic numbers in animation code are fine when tuned visually

## Code Style
- `npm run lint` (eslint), `npm run format` (prettier)
- Keep it simple — no state management, no framework, no premature abstractions
- See DECISIONS.md for full design rationale and content plans
