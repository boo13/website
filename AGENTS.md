# Project Overview
This project is a video portfolio website using GSAP.

- **Tech Stack** - Vite 7.3.1, JavaScript, GSAP 3.14.2 (via npm with ScrollTrigger, CustomEase, Flip, ScrollSmoother)
- **Deployed** to gh-pages as static files

## Key Commands
- `npm run dev` — Vite server with HMR
- `npm run lint` — ESLint on `src/` (run before commit; fix all errors before proceeding)
- `npm run format` — Prettier on `src/`

## Boundaries
- ❌ DO NOT edit index.html or main-index.js

## Project Structure
- `index2.html` is the main portfolio page; `index.html` is a legacy/alternate version (do not edit).
- Organized by **section**, not file type.
- Each section exports an `initSectionName()` function called from `main.js`.
- Static assets live in `public/` (data, images, favicon, CNAME) — Vite copies them as-is to the build output. HTML files stay at the repo root.
- **Video assets** hosted on Cloudflare R2 (not in git). Base URL: `CDN_BASE` in `src/config.js`. Local copies in `public/video/` are gitignored.

```
Root HTML pages and entry files:
- index2.html -> src/main.js
- index.html -> src/main-index.js
- contact.html -> src/main-contact.js
- resume.html -> src/main-resume.js
- case_study_wyatt.html -> src/main-wyatt.js
- sandbox.html -> no page-specific JS entry

projects/                           # project detail pages (auto-discovered by Vite)
  wyatt-earp/index.html             # → /projects/wyatt-earp/
  [project-name]/index.html         # add new projects by creating a folder

src/
  sections/             # one file per scroll section (hero, gallery, credits, about, about-slides, footer-reveal, featured-work)
    project-video.js    # video hero for project pages (.project-hero--video)
    project-credits.js  # credits section for project pages (.project-credits)
    project-footer.js   # footer for project pages (.project-footer)
  animations/           # shared animation utilities (scroll-defaults.js registers GSAP plugins)
  components/           # reusable DOM components (slider, responsive-video, video-lightbox, custom-cursor, preloader)
  styles/               # CSS per page, imported from JS entry points
    project.css         # shared styles for all project pages (BEM: .project-hero--video, .project-credits, .project-footer)
  config.js             # shared breakpoints, timing values, CDN_BASE for R2 video URLs
  main.js               # entry for index2.html — imports sections + calls init()
  main-project.js       # entry for ALL project pages — imports project sections
  main-index.js         # entry for index.html (Slider + ResponsiveVideo)
  main-contact.js       # entry for contact.html (form handler)
  main-resume.js        # entry for resume.html (page-specific layout tweaks)
  main-wyatt.js         # entry for case_study_wyatt.html (featured-work effects)
```

## GSAP Conventions
- Use `gsap.context()` per section for clean setup/teardown — no custom lifecycle wrappers
- Centralize `ScrollTrigger.defaults()` in one place to avoid pin conflicts
- Lazy-init heavy timelines (image sequences) when section approaches viewport
- Keep animation code direct — don't abstract into config-driven timeline factories
- GSAP is now free to use, do not warn of paid-only features
- **Prefer GSAP over CSS animations** for anything that's part of a sequence or coordinates with other animations. Reserve CSS for hover/focus states and `prefers-reduced-motion` fallbacks.
- **Stagger vs individual `fromTo` in timelines** — `tl.fromTo(array, from, to, pos)` with `stagger` applies from-values to ALL elements at `pos`. Individual `tl.fromTo(el, from, to, pos)` calls only apply from-values when each tween's position is reached. When synchronizing clones/duplicates with originals, use the same stagger approach so from-values are applied identically.
- **SplitText mask wrapper sizing** — Mask wrappers can be taller than word elements (line-height, font metrics). Absolutely-positioned overlays inside wrappers need `word.offsetTop` positioning, not `top: 0`, or they'll extend beyond the visible text area.

## Website Sections
1. **Hero** - Preloader then a looping montage video with text (hero-name and hero-subtitle)
2. **About** - Multiple slides
3. **Featured Work** - Scrolling gallery of video thumbnails; click opens lightbox
4. **Credits**
5. **Clients**
6. **Footer** - Contact and location info; nav and social links

## Verification
- **Use playwright-cli rather than playwright plugin or mcp** If playwright is used to take screenshots, delete them after use (unless the user asked for them or they are needed later.)
- **Screenshot timing matters:** Animations on this site can be deferred by `fonts.ready`, `requestAnimationFrame`, or `ctx.add()` — they may not start until 1-2s after page load. Before taking verification screenshots, first determine WHEN the animation actually runs (e.g. query for DOM elements the animation creates, check opacity/transform values at multiple timepoints). A screenshot taken outside the animation window is a false positive, not proof the fix works.

## Gotchas
- All `<video>` elements loading from R2 must have the `crossorigin` attribute (cross-origin fetch). If a `<link rel="preload">` also has `crossorigin`, the video element must match or the preloaded response is discarded.

## Further Documentation
- **Video**: Read `docs/Video.md` when adding, uploading, or converting videos
