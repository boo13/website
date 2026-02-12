# Project Overview
You are an expert web developer helping the user (Randy Counsman) build a video portfolio site that relies heavily on GSAP animations. 

You are working on v2 of the project (index2.html) DO NOT TOUCH index.html

Web performance and code modularity/maintainability are key concerns.

- **Tech Stack** - Vite, JavsScript, GSAP 3.14.2 (via npm with ScrollTrigger, CustomEase, Observer, Flip, ScrollSmoother)
- **Deployed** to gh-pages as static files

## Key Commands
- `npm run dev` — Vite dev server with HMR
- `npm run lint` — ESLint on `src/` (run before commit)
- `npm run format` — Prettier on `src/`

## Project Structure
Organized by **section**, not file type:
```
src/
  sections/             # one file per scroll section (landing, featured-work, gallery, credits, about)
  animations/           # shared animation utilities (scroll-defaults.js registers GSAP plugins)
  components/           # reusable DOM components (slider, responsive-video)
  styles/               # CSS per page, imported from JS entry points
  config.js             # shared breakpoints, timing values, CDN_BASE for R2 video URLs
  main.js               # entry for index2.html — imports sections + calls init()
  main-index.js         # entry for index.html (Slider + ResponsiveVideo)
  main-contact.js       # entry for contact.html (form handler)
  main-resume.js        # entry for resume.html (page-specific layout tweaks)
  main-examples-mockup.js # entry for examples_mockup.html (static mock styling)
```
Each section exports an `initSectionName()` function called from `main.js`.

Static assets live in `public/` (data, images, favicon, CNAME) — Vite copies them as-is to the build output. HTML files stay at the repo root.

**Video assets** are hosted on **Cloudflare R2**, not in the git repo. The R2 CDN base URL is defined in `src/config.js` as `CDN_BASE`. Video references in HTML use full R2 URLs; JS files import `CDN_BASE` from config. Local copies in `public/video/` are gitignored but may exist for dev/optimization work.

Use the playwright-cli skill over the playwright MCP to check visual changes. If playwright is used to take screenshots, those screenshots should be removed after they are used (unless the user asked for them or they are needed later.)

**Screenshot timing matters:** Animations on this site can be deferred by `fonts.ready`, `requestAnimationFrame`, or `ctx.add()` — they may not start until 1-2s after page load. Before taking verification screenshots, first determine WHEN the animation actually runs (e.g. query for DOM elements the animation creates, check opacity/transform values at multiple timepoints). A screenshot taken outside the animation window is a false positive, not proof the fix works.

## Code Style
- ES modules throughout (`"type": "module"` in package.json)
- CSS imported from JS entry points — Vite handles bundling/injection

## GSAP Conventions
- Use `gsap.context()` per section for clean setup/teardown — no custom lifecycle wrappers
- Centralize `ScrollTrigger.defaults()` in one place to avoid pin conflicts
- Lazy-init heavy timelines (image sequences) when section approaches viewport
- Keep animation code direct — don't abstract into config-driven timeline factories
- Magic numbers in animation code are fine when tuned visually
- GSAP is now free to use, do not warn of paid-only features
- **Prefer GSAP over CSS animations** for anything that's part of a sequence or coordinates with other animations. Reserve CSS for hover/focus states and `prefers-reduced-motion` fallbacks.
- **Stagger vs individual `fromTo` in timelines** — `tl.fromTo(array, from, to, pos)` with `stagger` applies from-values to ALL elements at `pos`. Individual `tl.fromTo(el, from, to, pos)` calls only apply from-values when each tween's position is reached. When synchronizing clones/duplicates with originals, use the same stagger approach so from-values are applied identically.
- **SplitText mask wrapper sizing** — Mask wrappers can be taller than word elements (line-height, font metrics). Absolutely-positioned overlays inside wrappers need `word.offsetTop` positioning, not `top: 0`, or they'll extend beyond the visible text area.

## Further Documentation
- **Video**: Read `@docs/Video.md` when adding, uploading, or converting videos