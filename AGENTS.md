# Project Overview
This project is a video portfolio website using GSAP.

- **Tech Stack** - Vite 7.3.1, JavaScript, GSAP 3.14.2 (via npm with ScrollTrigger, CustomEase, Flip, ScrollSmoother)
- **Hosting topology** — `www.randycounsman.com` is proxied by Cloudflare, but the current origin still appears to be GitHub Pages. This repo still deploys by merging `dev` into `gh-pages`.

## Key Commands
- `npm run dev` — Vite server with HMR
- `npm run lint` — ESLint on `src/` (run before commit; fix all errors before proceeding)
- `npm run format` — Prettier on `src/`
- `just video-publish FILE [--suffix S] [--out-dir DIR] ...` — Optimize video to WebM + MP4 and upload both to R2
- `just visual-audit` — Capture timestamped visual audit across desktop, tablet, and phone sizes

## Git Workflow
- **`dev`** — working branch. All LLM and day-to-day work happens here.
- **`gh-pages`** — current production origin branch. It is still the backing host behind the Cloudflare-proxied domain and is updated by merging `dev` into it.
- ❌ DO NOT commit directly to `gh-pages`.
- For risky/experimental work, branch off `dev` and merge back if it works.
- Do not commit unless asked or the task is fully complete and verified.
- One logical change per commit — don't bundle unrelated edits.

## Deployment Reality
- `www.randycounsman.com` currently resolves to Cloudflare IPs, so browsers hit Cloudflare first.
- The live response still exposes GitHub Pages / Fastly headers (`x-github-request-id`, `x-served-by`, `x-fastly-request-id`, `via: 1.1 varnish`), which indicates the origin has not been fully moved off GitHub Pages.
- Do not describe the site as "on Cloudflare Pages" unless the origin and deploy workflow have actually been migrated.

## Boundaries
- ❌ DO NOT edit `index-legacy.html` or `src/main-index.js` unless explicitly asked (legacy archive)

## Design System
- **`DESIGN.md`** is the source of truth for all visual and motion design decisions on `index.html` and project pages (`projects/*/index.html`).
- Consult DESIGN.md before making any design decision: colors, typography, spacing, animation timing, easing, layout, breakpoints, z-index.
- If new work introduces a pattern not covered by DESIGN.md, propose an update to the document before (or alongside) implementing it.
- If code and DESIGN.md conflict, flag it — don't silently follow either one.

## Project Structure
- `index.html` is the main portfolio page. `index-legacy.html` is an archived/alternate version.
- Primary UI code is organized by **section**, not file type. Shared utilities are grouped by type (`animations/`, `components/`, `styles/`).
- Each section exports an `initSectionName()` function called from `main.js`.
- Static assets live in `public/` (data, images, favicon, CNAME) — Vite copies them as-is to the build output. HTML files stay at the repo root.
- **Video assets** hosted on Cloudflare R2 (not in git). Base URL: `CDN_BASE` in `src/config.js`. Local copies in `public/video/` are gitignored.
- CLAUDE.md and GEMINI.md are sym-linked to AGENTS.md

```
Root HTML pages and entry files:
- index.html -> src/main.js
- index-legacy.html -> src/main-index.js
- contact.html -> src/main-contact.js
- resume.html -> src/main-resume.js
- case_study_wyatt.html -> src/main-wyatt.js
- sandbox.html -> no page-specific JS entry

projects/                           # project detail pages (auto-discovered by Vite)
  wyatt-earp/index.html             # → /projects/wyatt-earp/
  [project-name]/index.html         # add new projects by creating a folder

src/
  sections/             # one file per scroll section (hero, gallery, credits, about, about-intro, about-slides, footer-reveal, featured-work)
    project-video.js    # video hero for project pages (.project-hero--video)
    project-credits.js  # credits section for project pages (.project-credits)
    project-footer.js   # footer for project pages (.project-footer)
  animations/           # shared animation utilities (scroll-defaults.js registers GSAP plugins)
  components/           # reusable DOM components (slider, responsive-video, video-lightbox, custom-cursor, preloader)
  styles/               # CSS per page, imported from JS entry points
    project.css         # shared styles for all project pages (BEM: .project-hero--video, .project-credits, .project-footer)
    index.css           # main portfolio page styles (used by index.html)
    about-intro.css     # about section (index.html)
    about-slides.css    # about slides section (index.html)
    video-lightbox.css  # lightbox overlay (index.html)
    contact.css         # contact.html
    resume.css          # resume.html
    wyatt.css           # case_study_wyatt.html
    index-legacy.css    # legacy index-legacy.html
  config.js             # shared breakpoints, timing values, CDN_BASE for R2 video URLs
  main.js               # entry for index.html — imports sections + calls init()
  main-project.js       # entry for ALL project pages — imports project sections
  main-index.js         # entry for index-legacy.html (Slider + ResponsiveVideo)
  main-contact.js       # entry for contact.html (form handler)
  main-resume.js        # entry for resume.html (page-specific layout tweaks)
  main-wyatt.js         # entry for case_study_wyatt.html (featured-work effects)
```

## GSAP Conventions
- Full motion design rules (easing palette, timing, scroll patterns, reusable animations) are in **DESIGN.md sections 5–6**.
- Use `gsap.context()` per section for clean setup/teardown — no custom lifecycle wrappers
- Centralize `ScrollTrigger.defaults()` in one place to avoid pin conflicts
- Lazy-init heavy timelines when section approaches viewport
- Keep animation code direct — don't abstract into config-driven timeline factories
- GSAP is now free to use, do not warn of paid-only features

## Website Sections
See **DESIGN.md section 9** for detailed per-section specs (selectors, key classes, scroll behavior, pin distances, backgrounds) for both homepage and project page variants.

## Verification
- ✅ Use `playwright-cli` terminal commands for browser verification in this repo. (Tell user to install if not available.)
- ❌ Do not use MCP Playwright tools (`mcp__playwright__*`).
- ❌ Do not substitute with `npx playwright` / `@playwright/test` commands.

### Verification rules

- **Screenshot timing matters:** Before taking verification screenshots, first determine WHEN the animation actually runs (e.g. query for DOM elements the animation creates, check opacity/transform values at multiple timepoints).
  - Animations on this site can be deferred by `fonts.ready`, `requestAnimationFrame`, or `ctx.add()` — they may not start until 1-2s after page load. 
  - ⚠️ BEWARE - A screenshot taken outside the animation window is a false positive, not proof the fix works.
- **Cleanup screenshots:** delete temp screenshots unless user asked to keep them.

## Gotchas
- All `<video>` elements loading from R2 must have the `crossorigin` attribute (cross-origin fetch). If a `<link rel="preload">` also has `crossorigin`, the video element must match or the preloaded response is discarded.
- **Stagger vs individual `fromTo` in timelines** — `tl.fromTo(array, from, to, pos)` with `stagger` applies from-values to ALL elements at `pos`. Individual `tl.fromTo(el, from, to, pos)` calls only apply from-values when each tween's position is reached. When synchronizing clones/duplicates with originals, use the same stagger approach so from-values are applied identically.
- **SplitText mask wrapper sizing** — Mask wrappers can be taller than word elements (line-height, font metrics). Absolutely-positioned overlays inside wrappers need `word.offsetTop` positioning, not `top: 0`, or they'll extend beyond the visible text area.
- **Flex + overflow:hidden blocks column child width** — A flex container with `overflow: hidden` prevents children from calculating their width when the track switches to `flex-direction: column` (circular dependency resolves to 0). Override the container to `display: block; overflow: visible` in the media query, or the children render at 0×0.
- **Use ScrollTrigger, not IntersectionObserver, when ScrollSmoother is active** — ScrollSmoother uses transform-based scrolling, so IntersectionObserver sees real DOM positions instead of the smoothed visual positions. This causes timing mismatches for enter/leave detection. Always use ScrollTrigger for viewport-based behavior on this site.
- **SVG viewBox + width:100% in positioned containers** — SVG elements with `width: 100%` inside `position: absolute` or `position: fixed` containers that lack an explicit `width` create circular sizing dependencies (parent shrink-wraps to child, child sizes to parent). Always set explicit width on the positioned container. This also breaks GSAP Flip.fit since both targets collapse to the same intrinsic size.

# Communication Style
- Be direct, concise, and critical. Do not use excessive positive affirmations like "That's a great idea," "Absolutely," or "Great question."
- If an idea has flaws, say so immediately. Challenge assumptions, point out potential issues, and ask hard questions about implementation, scalability, and real-world viability.
- Do not confirm results simply because they were suggested. Verify them independently.
- If you are unsure, do not go with the flow—admit it or ask for clarification.

## Further Documentation
- **Video**: Read `docs/Video.md` when adding, uploading, or converting videos

## Agent Content Management

The portfolio's content is data-driven via `public/data/Projects.json`. A Vite plugin (`build/inject-gallery.js`) reads this file and injects gallery card HTML into `index.html` at build time. Agents can manage content by editing the JSON file — no HTML editing needed for gallery changes.

### Adding a project to the gallery

1. Add or update the project entry in `public/data/Projects.json` with gallery fields:
   - `"featured": true` — includes the project in the gallery
   - `"galleryOrder": N` — controls card position (lower = earlier)
   - `"gallerySlug": "short-slug"` — overrides `data-project` attribute if different from `id` (optional)
   - `"networkLogo": "images/logos/Logo.png"` — network logo shown on card (optional)
   - `"networkLogoAlt": "Network Name"` — alt text for network logo (optional)
   - `"hoverVideo": "video/filename.webm"` — R2 path for hover preview (optional)
   - `"hoverVideoFallback": "video/filename.mp4"` — R2 path for mp4 fallback source (optional, for Safari)
   - `"lightboxVideo": "video/filename.mp4"` — R2 path for click-to-play lightbox (optional)
2. Gallery cards are injected at build time — run `npm run dev` to see changes, `npm run build` for production.

### Adding a project detail page

Run: `just project-scaffold <project-id>`

This generates `projects/<id>/index.html` from the project's JSON entry. Edit the generated page to add full credits and customize.

### Removing a project from the gallery

Set `"featured": false` or remove the `featured` field. The project remains in the credits table.

### Reordering gallery cards

Change the `galleryOrder` values. Lower numbers appear first.

### Adding a new project entirely

1. Add the project entry to `public/data/Projects.json`
2. Upload video/images: `just video-publish <file>` for videos, copy images to `public/images/portfolio/`
3. Optionally feature it: set `featured: true` and `galleryOrder`
4. Optionally create a detail page: `just project-scaffold <project-id>`
