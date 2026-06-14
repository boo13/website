# Agent-Native Data Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio's content agent-manageable by driving the gallery and project pages from `Projects.json`, so an agent can add/update/reorder projects by editing a single JSON file.

**Architecture:** Enrich the existing `public/data/Projects.json` with gallery-specific fields. Build a Vite plugin that injects gallery card HTML into `index.html` at build time — zero runtime cost, no fetch waterfall, no layout shift. The gallery cards exist in the DOM at parse time, identical to today. Extract CDN_BASE to a shared `cdn-base.json` so it's defined in one place for all consumers (Vite modules, build plugin, Node scripts). Add a Node script to scaffold new project detail pages from JSON data. Credits section already consumes this JSON at runtime — no changes needed there (it's below the fold and lightweight).

**Tech Stack:** Vanilla JS (existing stack), Vite plugin (build-time HTML transform), Node.js for scaffold script

---

## Current State

**What's already agent-native:**
- Credits table renders from `Projects.json` at runtime (`src/sections/credits.js:273`)
- `Projects.json` has 23 projects with metadata (title, platform, year, role, description, preview image, video URLs, IMDB links)

**What's not:**
- Gallery cards (5 cards) are hardcoded in `index.html:577-745` — duplicating data from `Projects.json` plus gallery-specific fields (network logo path, lightbox video URL, hover video URL)
- Project detail pages (e.g. `projects/wyatt-earp/index.html`) are fully handcrafted HTML
- No way for an agent to "add a project to the gallery" without editing HTML

**What stays hardcoded (intentionally):**
- Hero section (one-off creative element)
- About section (personal narrative)
- Contact/footer sections
- All GSAP animation code — animations attach to DOM elements regardless of how those elements got there

**What does NOT change:**
- `src/sections/gallery.js` — no modifications needed; it queries the DOM for `.gallery-card` elements exactly as today
- `src/main.js` — no modifications needed; initialization order stays synchronous
- `src/components/video-lightbox.js` — no modifications needed; GLightbox finds `.glightbox-video` elements in the DOM at init time, as today

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `public/data/Projects.json` | Modify | Add gallery fields: `featured`, `galleryOrder`, `gallerySlug`, `networkLogo`, `networkLogoAlt`, `hoverVideo`, `hoverVideoFallback`, `lightboxVideo` |
| `cdn-base.json` | Create | Single source of truth for CDN_BASE URL — importable by Vite modules, build plugin, and Node scripts |
| `src/config.js` | Modify | Import CDN_BASE from `cdn-base.json` instead of hardcoding |
| `build/inject-gallery.js` | Create | Vite plugin: reads Projects.json, generates gallery card HTML, injects into index.html at build time |
| `vite.config.js` | Modify | Import and register the gallery injection plugin |
| `index.html` | Modify | Replace hardcoded gallery cards with `<!-- GALLERY_CARDS -->` placeholder comment |
| `scripts/scaffold-project.mjs` | Create | Node script: reads Projects.json entry, generates `projects/<slug>/index.html` |
| `justfile` | Modify | Add `project-scaffold` task |

---

## Chunk 1: Enrich Projects.json with Gallery Fields

### Task 1: Add gallery fields to Projects.json

**Files:**
- Modify: `public/data/Projects.json`

The five current gallery cards map to these projects and fields. Values are extracted from the existing hardcoded HTML in `index.html`:

| Card | Project ID | gallerySlug | networkLogo | networkLogoAlt | hoverVideo (R2 path) | hoverVideoFallback (R2 path) | lightboxVideo (R2 path) |
|------|-----------|------------|-------------|---------------|---------------------|----------------------------|------------------------|
| 1 | `wyatt-earp-and-the-cowboy-war` | `wyatt-earp` | `images/logos/Netflix_white2.png` | `Netflix` | `video/Cowboy.War.10secReel.v01_1920x1080.webm` | _(none)_ | `video/Cowboy.War.10secReel.v01_1920x1080.webm` |
| 2 | `upnext-news` | _(none)_ | _(none)_ | _(none)_ | `video/upnext_cover_11.20_explained.mp4` | _(none)_ | _(none)_ |
| 3 | `sitting-bull` | _(none)_ | `images/logos/History.png` | `History Channel` | `video/SittingBull_10sClip01.webm` | `video/SittingBull_10sClip01.mp4` | `video/SittingBull_Teaser_Trailer.mp4` |
| 4 | `the-men-who-built-america` | `mwba` | `images/logos/History.png` | `History Channel` | `video/MWBA_Protest_CraneShot.webm` | `video/MWBA_Protest_CraneShot.mp4` | `video/MWBA_Trailer_%28360p%29.mp4` |
| 5 | `pope-the-most-powerful-man-in-history` | `pope` | `images/logos/CNN_logo_red.svg` | `CNN` | _(none)_ | _(none)_ | _(none)_ |

**Important data notes:**
- `gallerySlug` overrides the `data-project` attribute on the gallery card HTML. The current HTML uses short slugs (e.g. `wyatt-earp`, `mwba`, `pope`) that differ from the full `id` in Projects.json. When `gallerySlug` is absent, the renderer falls back to `id`. Only add `gallerySlug` when the existing HTML uses a different value than `id`.
- `networkLogoAlt` is separate from `platform` because they can differ (e.g. Wyatt Earp's `platform` is `"History Channel"` but its gallery card shows the Netflix logo with alt text `"Netflix"`)
- `hoverVideoFallback` provides an mp4 fallback `<source>` for Safari WebM support (cards 3 & 4 have this in the current HTML)
- `lightboxVideo` for MWBA is `MWBA_Trailer_%28360p%29.mp4` (the trailer), NOT the hover video — these are different files in the existing HTML
- upNEXT has `"preview": null` in the current JSON but the gallery card uses `images/upNEXT_Examples_Mockup_01_web/upNEXT_Examples_Mockup_01_web_00001.jpg` as its thumbnail — update the `preview` field
- upNEXT has a hover video but no lightbox — clicking it does NOT open a lightbox (no `glightbox-video` class). Pope has neither hover video nor lightbox.

- [ ] **Step 1: Update upNEXT preview field and add gallery fields to all 5 featured projects**

For `upnext-news`, set:
```json
"preview": "images/upNEXT_Examples_Mockup_01_web/upNEXT_Examples_Mockup_01_web_00001.jpg"
```

For each of the 5 featured projects, add:
```json
"featured": true,
"galleryOrder": N,
"gallerySlug": "short-slug",
"networkLogo": "...",
"networkLogoAlt": "...",
"hoverVideo": "...",
"hoverVideoFallback": "...",
"lightboxVideo": "..."
```

Use the values from the table above. Omit fields that are `_(none)_` (don't add them as `null`). Only add `gallerySlug` for the 3 projects where the existing HTML uses a shorter slug than the JSON `id` (wyatt-earp, mwba, pope).

- [ ] **Step 2: Validate JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/data/Projects.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Verify credits section still works**

Run: `npm run dev` and check credits table loads correctly (it reads from the same JSON — new fields are ignored).

- [ ] **Step 4: Commit**

```bash
git add public/data/Projects.json
git commit -m "feat: add gallery fields to Projects.json for data-driven rendering"
```

---

## Chunk 2: Extract CDN_BASE to Shared Config

### Task 2: Create cdn-base.json and update src/config.js

**Files:**
- Create: `cdn-base.json`
- Modify: `src/config.js`

CDN_BASE is currently hardcoded in `src/config.js`. After this plan, it would also appear in `build/inject-gallery.js` and `scripts/scaffold-project.mjs`. Extract it to a single JSON file that all three can import/read.

- [ ] **Step 1: Create cdn-base.json at the repo root**

```json
{
  "cdnBase": "https://pub-722bb50dc4774406afca73534059fdd8.r2.dev"
}
```

- [ ] **Step 2: Update src/config.js to import from cdn-base.json**

Current line 3:
```javascript
export const CDN_BASE = 'https://pub-722bb50dc4774406afca73534059fdd8.r2.dev';
```

Change to:
```javascript
import cdn from '../cdn-base.json';

export const CDN_BASE = cdn.cdnBase;
```

Vite natively supports JSON imports — no additional config needed.

- [ ] **Step 3: Verify nothing breaks**

Run: `npm run dev`
Expected: Site loads, gallery videos and images from R2 still work (CDN_BASE is the same value, just sourced differently).

- [ ] **Step 4: Commit**

```bash
git add cdn-base.json src/config.js
git commit -m "refactor: extract CDN_BASE to cdn-base.json — single source of truth"
```

---

## Chunk 3: Build-Time Gallery Injection via Vite Plugin

### Task 3: Create the Vite gallery injection plugin

**Files:**
- Create: `build/inject-gallery.js`

This Vite plugin uses the `transformIndexHtml` hook to replace a `<!-- GALLERY_CARDS -->` placeholder in `index.html` with gallery card HTML generated from `Projects.json`. The transform runs in both dev mode (`npm run dev`) and production build (`npm run build`), so the gallery cards are always in the DOM at parse time — identical to today's hardcoded cards.

**Why build-time, not runtime:**
- No fetch waterfall (HTML → JS → fetch JSON → render)
- No layout shift (cards exist in DOM at parse time)
- Browser discovers `<img>` and `<video>` elements immediately for prefetch
- `gallery.js`, `main.js`, and `video-lightbox.js` require zero changes — they query the DOM synchronously and find cards exactly as before
- ScrollTrigger measurements are correct on first pass

- [ ] **Step 1: Create build directory**

Run: `mkdir -p build` (in the website repo root)

- [ ] **Step 2: Write build/inject-gallery.js**

```javascript
/**
 * Vite plugin: injects gallery cards into index.html from Projects.json.
 *
 * Replaces <!-- GALLERY_CARDS --> in index.html with rendered card HTML
 * at build time (and during dev serve). Zero runtime cost.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { cdnBase: CDN_BASE } = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'cdn-base.json'), 'utf8')
);

export default function injectGallery() {
  let root;

  return {
    name: 'inject-gallery',

    configResolved(config) {
      root = config.root;
    },

    transformIndexHtml(html) {
      if (!html.includes('<!-- GALLERY_CARDS -->')) return html;

      const jsonPath = resolve(root, 'public/data/Projects.json');
      const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
      const cards = renderGalleryCards(data.projects);

      return html.replace('<!-- GALLERY_CARDS -->', cards);
    },

    // Hot-reload index.html when Projects.json changes during dev
    configureServer(server) {
      const jsonPath = resolve(root, 'public/data/Projects.json');
      server.watcher.add(jsonPath);
      server.watcher.on('change', (file) => {
        if (file === jsonPath) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

function renderGalleryCards(projects) {
  const featured = projects
    .filter((p) => p.featured)
    .sort(
      (a, b) =>
        (a.galleryOrder ?? 99) - (b.galleryOrder ?? 99) ||
        a.id.localeCompare(b.id)
    );

  return featured
    .map((p) => {
      const hasHoverVideo = Boolean(p.hoverVideo);
      const hasLightbox = Boolean(p.lightboxVideo);
      const hasNetworkLogo = Boolean(p.networkLogo);
      const slug = p.gallerySlug || p.id;

      const classes = hasLightbox
        ? 'gallery-card glightbox-video'
        : 'gallery-card';

      const glightboxAttrs = hasLightbox
        ? ` data-glightbox="type: video"` +
          ` data-title="${escAttr(p.title)}"` +
          ` data-description="${escAttr(p.role)}, ${escAttr(p.year)}"` +
          ` data-href="${CDN_BASE}/${p.lightboxVideo}"`
        : '';

      const noVideoAttr = hasHoverVideo ? '' : ' data-no-video';

      let videoHtml = '';
      if (hasHoverVideo) {
        const fallbackSource = p.hoverVideoFallback
          ? `\n                            <source src="${CDN_BASE}/${p.hoverVideoFallback}" type="video/${ext(p.hoverVideoFallback)}">`
          : '';
        videoHtml = `
                        <video
                            class="card-video"
                            muted
                            loop
                            playsinline
                            crossorigin
                            preload="none"
                        >
                            <source src="${CDN_BASE}/${p.hoverVideo}" type="video/${ext(p.hoverVideo)}">${fallbackSource}
                        </video>`;
      }

      const networkLogoHtml = hasNetworkLogo
        ? `
                        <img
                            class="card-network"
                            src="${p.networkLogo}"
                            alt="${escAttr(p.networkLogoAlt || '')}"
                        >`
        : '';

      return `                <article class="${classes}" data-project="${escAttr(slug)}"${glightboxAttrs}${noVideoAttr}>
                    <div class="card-media">
                        <img
                            class="card-thumbnail"
                            src="${p.preview || p.poster || ''}"
                            alt="${escAttr(p.title)}"
                            loading="lazy"
                        >${videoHtml}
                    </div>
                    <div class="card-content">${networkLogoHtml}
                        <h3 class="card-title">${escHtml(p.title)}</h3>
                        <p class="card-role">${escHtml(p.role)}</p>
                        <span class="card-year">${escHtml(p.year)}</span>
                    </div>
                </article>`;
    })
    .join('\n\n');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ext(path) {
  return path.split('.').pop() || 'webm';
}
```

- [ ] **Step 3: Commit**

```bash
git add build/inject-gallery.js
git commit -m "feat: add Vite plugin to inject gallery cards from Projects.json at build time"
```

---

### Task 4: Wire the plugin into Vite and replace hardcoded cards

**Files:**
- Modify: `vite.config.js`
- Modify: `index.html`

- [ ] **Step 1: Register the plugin in vite.config.js**

Add the import at the top of `vite.config.js`:

```javascript
import injectGallery from './build/inject-gallery.js';
```

Add the `plugins` array to the config:

```javascript
export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [injectGallery()],
  build: {
    // ... existing build config unchanged
  },
});
```

- [ ] **Step 2: Replace hardcoded gallery cards in index.html with placeholder**

Replace the entire contents of `<div class="gallery-track">` (the 5 `<article>` elements, roughly lines 577-745) with the placeholder comment:

```html
            <div class="gallery-track">
                <!-- GALLERY_CARDS -->
            </div>
```

Keep everything outside the `gallery-track` div unchanged (the `gallery-container`, `gallery-progress`, section wrapper, etc.).

- [ ] **Step 3: Run dev server and visually verify**

Run: `npm run dev`

Verify all of these (behavior must be identical to before):
1. Gallery cards appear (5 cards, correct order matching current site)
2. Hover video preview works on cards with video
3. Lightbox opens on click (Wyatt Earp, Sitting Bull, MWBA)
4. Cards without lightbox (upNEXT, Pope) do NOT open lightbox
5. Horizontal scroll animation works on desktop
6. Progress indicator updates (1/5, 2/5, etc.)
7. Credits table still loads from same JSON
8. Network logos appear on correct cards (Netflix on Wyatt Earp, History on Sitting Bull & MWBA, CNN on Pope)
9. Mobile layout works (resize to ≤1024px width — vertical card stack)
10. No console errors

- [ ] **Step 4: Verify hot reload works**

With `npm run dev` running, edit `Projects.json` — change the `galleryOrder` of two cards. The browser should full-reload and show the cards in the new order.

- [ ] **Step 5: Verify production build**

Run: `npm run build`

Inspect `dist/index.html` — the `<!-- GALLERY_CARDS -->` comment should be replaced with the actual gallery card HTML. The output should look identical to the current hardcoded version.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add vite.config.js index.html
git commit -m "feat: gallery cards now generated from Projects.json at build time

Replaced hardcoded gallery cards with a Vite plugin that reads
Projects.json and injects card HTML at build time. Zero runtime
cost — cards exist in the DOM at parse time, identical to before.
gallery.js, main.js, and video-lightbox.js are unchanged."
```

---

## Chunk 4: Project Page Scaffold Script

### Task 5: Create scaffold-project.mjs

**Files:**
- Create: `scripts/scaffold-project.mjs`
- Modify: `justfile`

This script reads a project from `Projects.json` by ID and generates a project detail page at `projects/<slug>/index.html`, following the pattern established by `projects/wyatt-earp/index.html`.

**Note:** The wyatt-earp page has `Email@gmail.com` as the footer mailto — this appears to be a placeholder. The scaffold uses `RandyCounsman@gmail.com` (the real email from the contact page and resume).

- [ ] **Step 1: Write scaffold-project.mjs**

```javascript
#!/usr/bin/env node
/**
 * Scaffold a project detail page from Projects.json data.
 *
 * Usage: node scripts/scaffold-project.mjs <project-id>
 * Example: node scripts/scaffold-project.mjs sitting-bull
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const { cdnBase: CDN_BASE } = JSON.parse(
  readFileSync('cdn-base.json', 'utf8')
);

const projectId = process.argv[2];
if (!projectId) {
  console.error('Usage: node scripts/scaffold-project.mjs <project-id>');
  process.exit(1);
}

const data = JSON.parse(readFileSync('public/data/Projects.json', 'utf8'));
const project = data.projects.find((p) => p.id === projectId);

if (!project) {
  console.error(`Project "${projectId}" not found in Projects.json`);
  console.error(
    'Available IDs:',
    data.projects.map((p) => p.id).join(', ')
  );
  process.exit(1);
}

const slug = projectId;
const dir = join('projects', slug);

if (existsSync(join(dir, 'index.html'))) {
  console.error(`${dir}/index.html already exists. Aborting.`);
  process.exit(1);
}

const videoSrc = project.lightboxVideo
  ? `${CDN_BASE}/${project.lightboxVideo}`
  : project.videoStandard
    ? project.videoStandard
    : '';

const posterSrc = project.preview || project.poster || '';

// Preserve unicode en-dashes in year display
const yearDisplay = project.year || '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(project.title)} - Randy Counsman</title>
    <meta name="description" content="${escAttr(project.description || project.title)}">

    <!-- Open Graph -->
    <meta property="og:title" content="${escAttr(project.title)} - Randy Counsman">
    <meta property="og:description" content="${escAttr(project.description || project.title)}">
    <meta property="og:image" content="/${posterSrc}">
    <meta property="og:type" content="website">

    <!-- Critical inline styles to prevent white flash -->
    <style>
      html, body {
        background: #020202;
        margin: 0;
        padding: 0;
      }
    </style>

    <!-- Typekit Fonts -->
    <link rel="stylesheet" href="https://use.typekit.net/bnp0hyp.css">
</head>
<body data-project-id="${escAttr(project.id)}">

    <!-- SECTION 1: VIDEO HERO -->
    <section class="project-hero--video">
        <div class="project-hero__player">
            <a class="project-hero__close" href="/">Close</a>
            <div class="project-hero__scroll-text">scroll to view credits</div>

            <div class="project-hero__video-container">
                <video
                    autoplay
                    muted
                    playsinline
                    crossorigin
                    poster="/${posterSrc}"
                >${videoSrc ? `
                    <source src="${videoSrc}" type="video/${videoSrc.endsWith('.mp4') ? 'mp4' : 'webm'}">` : '\n                    <!-- TODO: add video source -->'}
                </video>

                <div class="project-hero__bottom">
                    <div class="project-hero__info">
                        <div class="project-hero__info-left">
                            <span>${esc(project.title)}</span>
                            <button class="project-hero__play-btn" aria-label="Play/Pause">&#9654;</button>
                        </div>
                        <div class="project-hero__info-right">
                            <button class="project-hero__credits-btn">credits</button>
                        </div>
                    </div>
                    <div class="project-hero__timeline">
                        <div class="project-hero__timeline-progress"></div>
                    </div>
                    <div class="project-hero__time">
                        <span class="project-hero__time-current">00:00</span>
                        <span class="project-hero__time-total">00:00</span>
                    </div>
                </div>

                <button class="project-hero__sound-btn" aria-label="Toggle sound">sound off</button>
            </div>
        </div>
    </section>

    <!-- SECTION 2: CREDITS -->
    <section class="project-credits">
        <div class="project-credits__gradient"></div>
        <div class="project-credits__wrapper">
            <div class="project-credits__text">

                <div class="project-credits__header">
                    <div class="project-credits__title">${esc(project.title)}</div>
                    <div class="project-credits__year">(${esc(yearDisplay)})</div>
                </div>

                <div class="project-credits__line"></div>

                <div class="project-credits__about-section">
                    <div class="project-credits__subtitle">About</div>
                    <div class="project-credits__about">
                        ${esc(project.description || 'TODO: add description')}
                    </div>
                </div>

                <div class="project-credits__line"></div>

                <!-- TODO: Add full credits list -->
                <div class="project-credits__detail-section">
                    <div class="project-credits__subtitle">Credits</div>
                    <div class="project-credits__list">
                        <div class="project-credits__item">
                            <div class="project-credits__item-title">${esc(project.role)}</div>
                            <div class="project-credits__item-text">Randy Counsman</div>
                        </div>
                        <div class="project-credits__item">
                            <div class="project-credits__item-title">Network</div>
                            <div class="project-credits__item-text">${esc(project.platform)}</div>
                        </div>
                    </div>
                </div>

                <div class="project-credits__line"></div>
            </div>

            <div class="project-credits__image">
                <img src="/${posterSrc}" alt="${escAttr(project.title)} poster">
            </div>
        </div>

        <footer class="project-footer">
            <a class="project-footer__ticker" href="mailto:RandyCounsman@gmail.com">
                <span class="project-footer__ticker-inner">get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp;</span>
            </a>
            <button class="project-footer__back-btn">back to video</button>
            <div class="project-footer__links">
                <a href="https://www.linkedin.com/in/randycounsman/" target="_blank" rel="noopener">Li</a>
                <a href="https://vimeo.com/randycounsman" target="_blank" rel="noopener">Vi</a>
                <span>&copy; 2026</span>
            </div>
        </footer>
    </section>

    <script type="module" src="/src/main-project.js"></script>
</body>
</html>`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'index.html'), html);
console.log(`Created ${dir}/index.html`);
console.log('  → Edit the credits section to add full crew list');
if (!videoSrc) {
  console.log('  ⚠ No video source found — add a <source> tag manually');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

- [ ] **Step 2: Add justfile task**

Add to `justfile`:

```just
# Scaffold a new project detail page from Projects.json
project-scaffold id:
    node scripts/scaffold-project.mjs {{ id }}
```

- [ ] **Step 3: Test the script**

Run: `node scripts/scaffold-project.mjs sitting-bull`
Expected: Creates `projects/sitting-bull/index.html`

Verify the generated HTML matches the Wyatt Earp page structure (same sections, same CSS classes, same script tag).

- [ ] **Step 4: Test with dev server**

Run: `npm run dev` and navigate to `http://localhost:5173/projects/sitting-bull/`
Expected: Page loads with video hero, credits section, footer. Animations work (same `main-project.js` entry point). Vite auto-discovers project pages via `projects/*/index.html` pattern in `vite.config.js`.

- [ ] **Step 5: Lint**

Run: `npm run lint`

- [ ] **Step 6: Commit**

```bash
git add scripts/scaffold-project.mjs justfile projects/sitting-bull/index.html
git commit -m "feat: add project page scaffold script — generates detail pages from Projects.json"
```

---

## Chunk 5: Agent Workflow Documentation

### Task 6: Document agent-native capabilities in AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add agent workflow section to AGENTS.md**

Add after the "Further Documentation" section:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add agent content management workflow to AGENTS.md"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

- [ ] `npm run dev` — site loads, no console errors
- [ ] Gallery shows 5 cards in correct order with correct content
- [ ] Hover video preview works on gallery cards
- [ ] Lightbox opens for cards with `lightboxVideo` (Wyatt Earp, Sitting Bull, MWBA)
- [ ] Cards without lightbox don't open lightbox (upNEXT, Pope)
- [ ] Cards without video show `data-no-video` (Pope)
- [ ] Network logos appear on correct cards with correct alt text
- [ ] Credits table loads from same `Projects.json`
- [ ] Horizontal scroll animation works on desktop
- [ ] Mobile layout works (vertical stack at ≤1024px)
- [ ] Editing `Projects.json` during dev triggers page reload with updated cards
- [ ] `npm run build` succeeds; `dist/index.html` contains injected gallery cards (not the placeholder comment)
- [ ] `just project-scaffold sitting-bull` generates a working page
- [ ] `npm run lint` passes
- [ ] Adding `"featured": true` to a new project in JSON makes it appear in gallery after rebuild/reload

---

## Future Work (not in this plan)

These are natural follow-ups but intentionally deferred:

- **Data-driven resume page** — extract resume content to `public/data/resume.json`, render via Vite plugin
- **Gallery card click → project page** — link gallery cards to their `projects/<slug>/` page when it exists
- **Project credits in JSON** — add a `credits` array to each project in `Projects.json` so the scaffold script and project pages can render full credit lists from data
- **Network logo mapping** — derive network logos from `platform` field instead of separate `networkLogo`/`networkLogoAlt` fields (e.g. `"Netflix"` → `"images/logos/Netflix_white2.png"`)
