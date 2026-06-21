# Performance Redesign Plan

## Context

The portfolio site is unusable across devices: slow initial load (preloader blocks on video), scroll jank from 31 simultaneous videos in about-slides, and oversized images. Safari users are completely broken (hero has no MP4 fallback, hitting 15s timeout). The goal is to cut page weight drastically, define strict performance rules, and replace the heaviest section with a lighter alternative.

---

## Performance Rules (Enforced Going Forward)

These rules apply to all current and future changes. Rules 1-3 require adding `web-vitals` or Lighthouse CI to measure — currently unmeasurable.

1. **LCP < 2.5s** on 4G throttled connection — *requires measurement infrastructure first*
2. **INP < 200ms** — FID is deprecated by Google (March 2024); INP is the replacement metric
3. **CLS < 0.1** — *at risk from Typekit FOIT and missing video dimensions; set explicit `width`/`height` or `aspect-ratio` on all `<video>` and hero elements*
4. **Videos outside viewport must be paused with sources unloaded** (`video.removeAttribute('src'); video.load()`) — reclaims decoder memory without costly DOM create/destroy churn. Gallery and about-showcase videos created lazily on approach, destroyed on leave.
5. **All images served as WebP** with JPEG/PNG fallback via `<picture>` — *zero `<picture>` elements exist today; requires build tooling (Vite plugin) or CDN-side transforms (Cloudflare Image Resizing)*
6. **Responsive images use `srcset` + `sizes`** for any image > 50KB — *none exist today; requires generating multiple sizes via sharp/Vite plugin*
7. **Total initial transfer size < 2MB** (before scroll-triggered lazy loads) — *"initial" = all resources fetched before first user scroll, including hero video poster but not the video stream itself. Measure via DevTools Network panel with cache disabled.*
8. **No video preloads in `<head>`** — hero uses poster-first strategy. *Current preload also points to wrong origin (`r2.dev` vs `media.randycounsman.com`), so it's wasted bandwidth regardless.*
9. **Every `<video>` must have both WebM and MP4 sources** (Safari compatibility) — *mostly followed; audit phone mockup videos and project hero pages which may be missing MP4 fallback*
10. **Fonts must not block render** — Typekit kits loaded via async JS embed or `media="print" onload="this.media='all'"` pattern; ensure `font-display: swap` is set in Typekit kit settings (controlled in Typekit dashboard, not CSS)

---

## Changes

### 1. Remove About-Slides Section (7x7 Grid + Phones)

**What:** Delete the entire `.about-slides-section` — both Slide 2 (7x7 video grid) and Slide 3 (phone mockups).

**Impact:** Removes 25 grid videos, 6 phone videos, 24 grid poster images, 6 phone frame images = **31 videos + 30 images eliminated**.

**Files to modify:**
- `index.html` — remove `.about-slides-section` HTML block (lines ~269–565)
- `src/sections/about-slides.js` — delete file entirely
- `src/styles/about-slides.css` — delete file entirely
- `src/main.js` — remove `import { initAboutSlides }` and its call/cleanup
- `build/inject-gallery.js` — check for any about-slides references (unlikely)

### 2. New Section: About Showcase (Replaces About-Slides)

**Concept:** The about-intro section's dot-bg and text stay. Below it, a pinned horizontal scroll of show cards (poster stills) "fly by" from right to left as the user scrolls — similar to the phone mockup treatment but with flat image cards instead of phone frames.

**Specs:**
- 6-8 show poster images (reuse existing portfolio images, compressed to WebP)
- At most 2 optional short video clips (created lazily via JS, destroyed when section leaves)
- Cards scroll horizontally via GSAP ScrollTrigger pin + scrub (same pattern as the gallery section)
- No phone frames — just clean cards with subtle parallax offset per card
- Mobile: vertical stack with scroll-snap, no horizontal scroll

**New files:**
- `src/sections/about-showcase.js` — init function, card horizontal scroll
- `src/styles/about-showcase.css` — card layout, responsive behavior

**Modified files:**
- `index.html` — new HTML block replacing about-slides
- `src/main.js` — import + init new section

### 3. Hero Video: Poster-First + MP4 Fallback

**What:**
- Remove `<link rel="preload">` for the hero video from `<head>`
- Add a proper poster frame image (screenshot from the montage, compressed WebP, ~100KB)
- Add MP4 `<source>` fallback inside the `<video>` element
- Add `<link rel="preconnect" href="https://pub-722bb50dc4774406afca73534059fdd8.r2.dev" crossorigin>` to `<head>`

**Files:**
- `index.html` — modify `<head>` and hero `<video>` element
- `public/images/` — add hero poster image (need to extract a frame)

### 4. Preloader: Non-Blocking

**What:**
- Remove video from preloader tracking — preloader only waits for fonts + above-fold images
- Reduce `FORCE_COMPLETE_AFTER_MS` from 15000 to 5000
- Reduce `VIDEO_TASK_WEIGHT` to 0 or remove video tracking entirely

**Files:**
- `src/components/preloader.js` — stop tracking videos, reduce timeout

### 5. Image Optimization

**What:**
- Convert all portfolio images to WebP (keep JPEG as fallback)
- Resize oversized images: `MakingOfTheMob.jpg` (1.3MB), `MWBA.jpg` (1.0MB), `SonsOfLiberty.jpg` (304KB) — target max 200KB per image at 1200px width
- Add `srcset` and `sizes` to portfolio images used in credits accordion

**Files:**
- `public/images/portfolio/` — replace/add WebP versions
- `src/sections/credits.js` — update image creation to use `<picture>` with WebP + JPEG fallback
- `build/inject-gallery.js` — update gallery card image rendering if applicable

### 6. Font Loading

**What:**
- Check if the two Typekit kits (`bnp0hyp` and `gya6int`) can be consolidated into one
- If not, load the second kit asynchronously (non-render-blocking)
- Ensure `font-display: swap` is in effect (Typekit controls this via kit settings)

**Files:**
- `index.html` — modify Typekit `<link>` tags

### 7. Remove Three.js Dependency

**What:** `three` is listed in `dependencies` but imported nowhere in `src/`. Remove it.

**Files:**
- `package.json` — remove `"three"` from dependencies
- Run `npm install` to update lockfile

### 8. Gallery Video Lifecycle

**What:** Gallery card hover videos should be created/destroyed dynamically rather than existing in DOM from page load. The `build/inject-gallery.js` Vite plugin creates the card HTML — modify it to only include `data-*` attributes for video URLs, and have `gallery.js` create `<video>` elements on hover/scroll-enter and remove them on leave.

**Files:**
- `build/inject-gallery.js` — emit `data-hover-video` / `data-hover-fallback` attributes instead of `<video>` elements
- `src/sections/gallery.js` — create/destroy video elements dynamically in hover and ScrollTrigger handlers

---

## Execution Order

1. **Remove about-slides** (biggest impact, simplest change)
2. **Hero poster-first + MP4 fallback** (fixes Safari)
3. **Preloader non-blocking** (unblocks initial load)
4. **Font loading** (reduce render-blocking)
5. **Image optimization** (reduce page weight)
6. **Remove Three.js** (cleanup)
7. **Gallery video lifecycle** (reduces DOM weight)
8. **New about-showcase section** (replaces removed content — do last since it's new feature work)

---

## Verification

After each step, measure:
- `npm run build` — check bundle sizes haven't regressed
- Lighthouse (Chrome DevTools) on `npm run preview` — target scores: Performance > 90, LCP < 2.5s
- Count `<video>` elements in DOM via DevTools: `document.querySelectorAll('video').length` should be <= 6
- Test in Safari — hero video must play, no 15s blank screen
- Test on mobile (throttled 4G in DevTools) — page should be interactive within 3s
- Scroll through all sections — no frame drops visible in Performance panel
- `playwright-cli` screenshots at key scroll positions for visual regression
