# Design Rulebook

**Scope:** Homepage (`index.html`) and project detail pages (`projects/*/index.html`). Does not govern utility pages (contact, resume).

**Governed files:** `src/styles/index2.css`, `src/styles/about-intro.css`, `src/styles/project.css`, `src/styles/video-lightbox.css`, `src/main.js`, `src/main-project.js`, and all section/component modules they import.

**Purpose:** Prescriptive rules for design decisions. Every rule here can be applied to new work. Where something is not specified, it is not constrained.

---

## 1. Creative Direction

The site is a cinematic portfolio — a title sequence and reel, not a SaaS landing page or brochure. Design constraints:

- **Dark.** Both page types live on near-black backgrounds. Light surfaces are the exception, not the default.
- **Editorial.** Typography leads. Space is not filled.
- **Cinematic.** Motion is part of the design, not decoration. Sequences feel directed.
- **Motion-first.** GSAP drives major transitions. CSS handles hover states and always-running loops.
- **Typography-led.** Large serif statements, restrained sans utility text. No decorative illustration.

**Homepage structure:** Hero → About Intro → Featured Work → Credits → CTA → Footer

**Project page variants:**
- *Video Hero:* Project video → Credits → Footer
- *Case Study Editorial:* Key image → Intro → Image sections → Credits → Footer

Project pages are intentionally darker and more focused than the homepage. They have no preloader, no custom cursor, and no ScrollSmoother.

---

## 2. Color System

All colors use the OKLCH color space. Do not introduce hex or HSL values.

### 2a. Homepage Tokens

Defined on `:root` in `src/styles/index2.css`:

| Token | Value | Role |
|-------|-------|------|
| `--color-offwhite` | `oklch(0.968 0.006 75)` | Primary text — warm |
| `--color-cream` | `oklch(0.918 0.011 77)` | Reserved, not currently in use |
| `--color-nearblack` | `oklch(0.14 0 0)` | Primary background |
| `--color-charcoal` | `oklch(0.2 0 0)` | Secondary dark background |
| `--color-gray` | `oklch(0.51 0 0)` | Defined but unused on homepage |

### 2b. Project Page Tokens

Defined on `:root` in `src/styles/project.css`:

| Token | Value | Role |
|-------|-------|------|
| `--project-text` | `oklch(0.959 0.003 165)` | Primary text — cool |
| `--project-bg` | `oklch(0.08 0 0)` | Body background — darker than homepage |
| `--project-bg-credits` | `oklch(0.134 0 0)` | Credits section background |

The divergence is intentional: homepage text is warm (hue 75), project text is cool (hue 165). Project backgrounds are significantly darker than homepage backgrounds.

### 2c. Opacity Ramp — Text Hierarchy

Text hierarchy on dark backgrounds is built from a single base color at varying alpha. Never introduce a new hue for text.

**Homepage** (`--color-offwhite` at alpha):

| Alpha | Role |
|-------|------|
| 1.0 | Headings, primary text |
| 0.7 | Subtitles, secondary labels |
| 0.6 | Gallery progress, tertiary text |
| 0.5 | Card year, credits muted text |
| 0.4 | Marquee items (index2.css) |
| 0.35 | Marquee items (about-intro.css), form placeholders |
| 0.3 | Copyright |
| 0.2 | Borders, dividers |
| 0.15 | Dot grid color (before layer opacity reduces further) |
| 0.08 | Input backgrounds, subtle fills |
| 0.05 | Hover washes |

**Project pages** (`--project-text` at alpha):

| Alpha | Role |
|-------|------|
| 1.0 | Headings, primary text |
| 0.7 | Secondary labels |
| 0.6 | Muted text |
| 0.4 | Timeline rail, interactive links at rest |
| 0.25 | Timeline rail background |
| 0.15 | Footer border |

### 2d. Credits Color Inversion (Homepage Only)

The credits section is the only homepage section that inverts to a light background. It uses scoped custom properties on `.credits-section`:

**Light state (default):**

| Property | Value |
|----------|-------|
| `--credits-bg` | `oklch(0.968 0.006 75)` |
| `--credits-text` | `oklch(0.14 0 0)` |
| `--credits-border` | `oklch(0.14 0 0 / 0.1)` |
| `--credits-hover-bg` | `oklch(0.14 0 0 / 0.04)` |
| `--credits-muted` | `oklch(0.14 0 0 / 0.5)` |

**Dark state (when a row is open):**

| Property | Value |
|----------|-------|
| `--credits-bg` | `oklch(0.14 0 0)` |
| `--credits-text` | `oklch(0.968 0.006 75)` |
| `--credits-border` | `oklch(0.968 0.006 75 / 0.1)` |
| `--credits-hover-bg` | `oklch(1 0 0 / 0.06)` |
| `--credits-muted` | `oklch(0.968 0.006 75 / 0.6)` |

Transition: 0.9s `power2.inOut` on the CSS custom properties via GSAP. The fixed hero name and top gradient also adapt when the credits section scrolls into view.

### 2e. Chromatic Accents

Two chromatic colors exist in the system. Both are homepage-only and used exclusively for the patterns listed below. Do not use them for text, backgrounds, or any other purpose.

| Color | Value | Uses |
|-------|-------|------|
| Blue | `oklch(0.804 0.146 220)` | Hero name color trail (screen blend), credits CA flash (text-shadow) |
| Red | `oklch(0.656 0.235 13)` | Hero name color trail (screen blend), credits CA flash (text-shadow) |

---

## 3. Typography

### 3a. Font Stack

Two fonts. Shared across all page types.

| Role | Family | Homepage var | Project var |
|------|--------|-------------|-------------|
| Display serif | `ivypresto-display, Georgia, serif` | `--ff-display` | `--project-font-display` |
| Body sans | `aktiv-grotesk, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | `--ff-body` | `--project-font-body` |

Both loaded via Typekit (`bnp0hyp.css`). There is no third font.

### 3b. Homepage Type Scale

All fluid via `clamp()`:

| Element | Class | Family | Size | Weight | Style | Line-height | Letter-spacing |
|---------|-------|--------|------|--------|-------|-------------|----------------|
| Hero name | `.hero-name` | display | `clamp(3rem, 8vw, 6rem)` | 300 | — | 1 | — |
| Hero name (header) | `.hero-name-fixed` | display | `clamp(1.25rem, 3.2vw, 2.25rem)` | 300 | — | 1 | — |
| Hero subtitle | `.hero-subtitle` | body | `clamp(0.875rem, 2vw, 1.125rem)` | 400 | — | — | 0.15em |
| About intro text | `.about-intro__text` | display | `clamp(1.5rem, 3.5vw, 3rem)` | 300 | italic | 1.4 | 0.01em |
| Section heading | `.section-title` | display | `clamp(2rem, 4vw, 3rem)` | 400 | — | — | — |
| Card title | `.card-title` | display | `clamp(1.5rem, 3vw, 2.5rem)` | 400 | — | 1.2 | — |
| Card role | `.card-role` | body | 0.875rem | — | — | — | — |
| Card year | `.card-year` | body | 0.75rem | — | — | — | — |
| CTA heading | `.cta-heading` | display | `clamp(1.75rem, 3vw, 2.5rem)` | 400 | — | — | — |
| Footer tagline | `.footer-tagline` | display | `clamp(1.25rem, 2.5vw, 1.75rem)` | 600 | — | 1.4 | — |
| Footer nav | `.footer-nav-link` | body | 1rem | 500 | — | — | — |
| Footer labels | `.footer-col-label` | body | 0.75rem | — | uppercase | — | 0.1em |
| Marquee items | `.about-intro__marquee-item` | body | `clamp(0.7rem, 1.2vw, 0.9rem)` | 400 | uppercase | — | 0.15em |

### 3c. Project Page Type Scale

Fixed px values with breakpoint tiers. The one exception is the case study hero title.

| Element | Class | Desktop | Tablet (≤1024px) | Mobile (≤768px) |
|---------|-------|---------|-----------------|-----------------|
| Credits title | `.project-credits__title` | 91px, weight 400 | 64px | 40px |
| Credits year | `.project-credits__year` | 60px, weight 300 | 42px | 28px |
| Credits about | `.project-credits__about` | 40px / lh 48px | 30px / lh 38px | 22px / lh 30px |
| Role items | `.project-credits__role-item` | 16px | — | — |
| Hero label | `.project-hero__label` | 14px, uppercase, 0.05em | — | — |
| Hero subtitle | `.project-hero__subtitle` | 14px, uppercase, 0.08em | — | — |
| Case study hero | `.case-study__title` | `clamp(40px, 6vw, 96px)` | — | — |
| Case study intro | `.case-study__intro-text` | `clamp(24px, 3vw, 40px)`, display serif | — | — |

### 3d. Rules

1. **Display font weight:** 300 or 400 only. Never 500 or higher on the display font. `.footer-tagline` at 600 is the sole exception.
2. **Italic:** Only `.about-intro__text`. Never italic on headings or UI text.
3. **Uppercase:** Always body font with `letter-spacing` between 0.05em and 0.15em. Never uppercase on display font.
4. **Fluid sizing:** Homepage requires `clamp()` for all type above 1rem. Fixed rem only for utility text ≤1rem.
5. **Project pages:** Fixed px with media-query tiers at 1024px and 768px. Case study hero title is the one exception that uses `clamp()`.
6. **Credits font swap:** Credits accordion row titles swap body→display font on expand. Driven by JS (`src/sections/credits.js`): inline `font-family` + GSAP `fontSize` tween to `2.25rem` at `expo.out`.

---

## 4. Layout

### 4a. Homepage Grid

| Token | Value |
|-------|-------|
| `--grid-columns` | 6 |
| `--grid-gutter` | 20px |
| `--grid-max-width` | 1400px |
| `--container-padding` | `clamp(1.5rem, 5vw, 4rem)` |
| `--section-padding` | `clamp(4rem, 10vh, 8rem)` |

`.container` class: `max-width: var(--grid-max-width)`, `margin: 0 auto`, `padding: 0 var(--container-padding)`.

Credits and footer use CSS subgrid on desktop (≥1025px) for deep column alignment. The subgrid chain: `.credits-section .container` → `.credits-list` → `.credit-row` → `.credit-row__header`.

Debug grid overlay: `.bg-columns` (6 column divs), toggled via `Ctrl/Cmd+G` (adds `body.show-grid`).

### 4b. Project Pages

No CSS grid system. Flex-based layouts throughout. Max-width 1600px.

Spacing is hardcoded px:
- Credits padding: 263px top / 20px sides / 150px bottom (desktop), reduces through breakpoints
- Image grids: 8px gaps (tight, magazine-style)
- Case study side padding: 40px (desktop) → 24px (≤1024px) → 16px (≤768px)

### 4c. Spacing Note

Neither page type uses a strict mathematical spacing scale. Use `--section-padding` and `--container-padding` as anchors on the homepage. On project pages, match the existing px rhythm.

---

## 5. Motion Design System

### 5a. Stack

GSAP 3.14.2 via npm. Plugins registered in `src/animations/scroll-defaults.js`:

- `ScrollTrigger` — all pages
- `ScrollSmoother` — homepage only (`smooth: 1, effects: true, smoothTouch: 0.1`)
- `ScrollToPlugin` — homepage nav
- `Flip` — hero name transition (homepage)
- `SplitText` — text-mask-rise (both page types)

CSS `@keyframes` only for always-running loops (marquees, ticker). Everything else uses GSAP.

### 5b. Easing Palette

Shared across both page types:

| GSAP Name | Role | Examples |
|-----------|------|---------|
| `expo.out` | Primary entrance | text-mask-rise, credits row expand, case study reveals, corner brackets |
| `expo.inOut` | Symmetric transitions | accordion collapse, title shrink |
| `power2.out` | Spring-back, smoothing | cursor quickTo, color trail spring-back, scroll-to nav |
| `power2.in` | Exit/dismissal | hero content exit, color trail clone fade |
| `power2.inOut` | Color system transitions | credits inversion, preloader overlay fade |
| `power3.out` | Cinematic entrance | case study images, hero overlay children |
| `power3.inOut` | Wipe/clip reveals | case study triptych |
| `power1.out` | Subtle exit | preloader element exits |
| `power1.inOut` | Physical motion | rack-focus blur/scale transitions |
| `'none'` | All scrub-linked | hero zoom, about-intro char fill, gallery horizontal scroll |

**Rule:** Scrub-driven animations always use `ease: 'none'`. Easing on top of scrub creates jitter.

### 5c. Timing Vocabulary

| Band | Duration | Examples |
|------|----------|---------|
| Instant | 0.2s | Hover states, opacity micro-transitions, icon scale |
| Quick | 0.3–0.5s | Cursor quickTo (dot 0.3s, ring 0.7s), accordion collapse (0.4s), corner expand (0.5s), CA flash (0.5s) |
| Medium | 0.5–0.9s | Credits inversion (0.9s), scroll-to nav (0.9s), row expand (0.5s), preloader corners (1.05s) |
| Slow | 1.0–1.5s | Text-mask-rise (1.5s default), subtitle entrance (1.2s), case study reveals (1.0–1.4s) |
| Very Slow | 2.0+ | Hero name rise (2.2s), client marquee (30s CSS), project footer ticker (12s CSS) |

### 5d. Scroll-Driven Patterns

Scrub constants from `src/config.js`:

```js
SCRUB.default = 1     // standard responsiveness
SCRUB.smooth  = 1.5   // cinematic, used by hero zoom and case study parallax
```

**Homepage pins:**
- Hero: `150%` of viewport (`config.scrollDistance`). ScrollTrigger `start: 'top top'`, `end: '+=150%'`.
- About-intro: `200%`. ScrollTrigger id `'about-intro-pin'`, referenced by hero trail suppression.
- Gallery: `trackWidth - viewportWidth + 200px`.

**About-intro char fill:** SplitText chars animated from `opacity: 0.15` to `1`. Duration `3/N` per char, stagger `1/N each`, producing a ~3-char transition window at any scroll position. Linear ease throughout.

**Case study parallax:** Hero image `scale: 1.15→1` scrubbed. Statement images `yPercent: -10→10`, `start: 'top bottom'` to `end: 'bottom top'`, ease none.

### 5e. Reusable Animation Patterns

**Text Mask Rise** (`src/animations/text-mask-rise.js`):
- SplitText `type: 'words'` with mask wrappers (`overflow: clip`)
- `fromTo` each word: `{ opacity: 0, y: yOffset }` → `{ opacity: 1, y: 0 }`
- Default: `duration: 1.5`, `stagger: 0.2`, `ease: 'expo.out'`, `yOffset: 30px`
- Hero override: `duration: 2.2`, `stagger: 0.12`, `delay: 0.3`
- Case study trigger: `start: 'top 75%'`, `once: true`

**Color Trail** (`src/animations/color-trail.js` + scroll-velocity in `hero.js`):
- Two screen-blended clones per word: blue + red OKLCH
- `mix-blend-mode: screen`, `filter: blur(0.4px)`, `pointer-events: none`
- Static (entrance): each color layer delayed by `staggerOffset` (0.15s per layer), fades out at 75% of main duration via `power2.in`
- Velocity-driven: reads `ScrollSmoother.getVelocity()` per GSAP tick
  - Activates above `TRAIL_THRESH` (30 px/s)
  - Y offset: `velocity * -TRAIL_K` (0.03), clamped ±`TRAIL_MAX_PX` (5px)
  - Max opacity: `TRAIL_OPACITY` (0.85)
  - Spring-back: 0.5s `power2.out` when velocity drops below threshold
  - Suppressed during about-intro pin and gallery `.active` state

**Corner Brackets:**
- Four `::before`/`::after` L-shaped pseudo-elements, 1px offwhite lines, 22×22px
- Hover: translate outward 12px, `0.5s var(--ease-out-expo)`
- Preloader exit: 28–44px outward, `1.05s power1.out`

**Gradient Bridge** (project pages only):
- `.project-credits__gradient`: 270px tall, `position: absolute`, `top: -270px`
- Gradient from `transparent` to `--project-bg-credits`
- Creates a cinematic dissolve between hero and credits

**Clip-Path Wipe** (case study triptych):
- `clip-path: inset(100% 0 0 0)` → `inset(0%)`
- `duration: 1.2s`, `ease: 'power3.inOut'`, `stagger: 0.15s`
- Trigger: `start: 'top 70%'`, `once: true`

### 5f. Homepage-Only Patterns

**Preloader** (`src/components/preloader.js`):
- Markup: `.loading-overlay` > `.preloader-wrapper` > `.preloader-edges` (+ `.preloader-time` + four `.preloader-corner` variants)
- Timecode format: `MM:SS:FF` at 24fps, counting down from `00:06:00`
- Progress visualization: 16:9 aspect ratio rectangle, 96→520px wide (desktop), 64→360px (mobile)
- Progress smoothed: `gsap.to`, `duration: 0.65`, `ease: 'power2.out'`
- Force-complete after 15,000ms
- Exit sequence: time fades (0.55s `power1.out`), corners expand+fade (1.05s `power1.out`), edges scale 1.04× (`power1.out`), overlay fades (1.25s `power2.inOut`)
- After exit: `.loading-overlay` removed from DOM, `'loadingComplete'` event dispatched → hero init begins

**Custom Cursor** (`src/components/custom-cursor.js`):
- `.custom-cursor-dot` (10px filled) + `.custom-cursor-ring` (30px outline), both `position: fixed`, z-index 10000
- `gsap.quickTo`: dot x/y `0.3s power2.out`, ring x/y `0.7s power2.out` (trailing effect)
- Hero section only. Skip on touch devices and `prefers-reduced-motion`.
- Link/button hover: dot `scale→0`, ring `scale→2` (0.3s); mouseleave: both `scale→1`
- Scroll: ring nudged `delta * 1.2` clamped ±5px, returns after 80ms

**Hero Z-Depth** (`src/sections/hero.js`):
- ScrollTrigger: `start: 'top top'`, `end: '+=150%'`, `scrub: 1.5`
- Parallel tweens (all ease `'none'`): `scale→1.15`, `filter: blur(8px)` (over 80% of progress), content `opacity 0, y -50` (`power2.in`, over 50%), gradient darkens (over 70%), top-gradient `autoAlpha→1` (over 65%)

**Hero Name Flip** (`src/sections/hero.js`):
- GSAP `Flip.fit()` between `.hero-name` (in-flow) and `#hero-name-fixed` (fixed header)
- ScrollTrigger: `start: 'top top'`, `end: '+=45%'`, `scrub: true`
- `scale: true` (CSS scaleX/Y, not width/height)
- `#hero-subtitle-fixed` and `#hero-social-fixed` track title's bottom edge via Flip progress
- Subtitle entrance: `autoAlpha: 0→1`, `1.2s expo.out`, `delay: 2.8s` after `loadingComplete`
- Social entrance: `autoAlpha: 0→1`, `1.2s expo.out`, `delay: 3.1s` after `loadingComplete`

**Footer Reveal** (`src/sections/footer-reveal.js`):
- `#site-footer`: `position: fixed`, `z-index: 0` (behind `#smooth-wrapper`)
- `.footer-spacer` inside `#smooth-content` matches footer height
- ScrollTrigger on spacer: `start: 'top bottom'`, `end: 'bottom bottom'`, updates `clip-path: inset(0 0 Npx 0)` on `#smooth-wrapper`
- `pointer-events: auto` on footer when `progress ≥ 0.99`

### 5g. Reduced Motion Contract

Every animation module checks `window.matchMedia('(prefers-reduced-motion: reduce)')`.

| System | Behavior |
|--------|----------|
| `ScrollSmoother` | Not created; `#smooth-wrapper` becomes `position: static` |
| All GSAP timelines | Skip or `gsap.set()` to final state immediately |
| CSS marquees / ticker | `animation-play-state: paused` |
| Custom cursor | Not initialized |
| CSS global | `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important` |
| Credits accordion | Instant class toggle, no tween |
| Footer reveal | Skipped; footer static |
| Hero | `opacity: 1` immediately, no zoom/blur/trail/Flip |
| Case study | Module exits immediately, all images visible at full opacity |

---

## 6. Interaction Patterns

### Homepage

**Gallery card hover** (desktop, `hover: hover` media query only):
- 200ms hover-intent delay before video plays
- `.card-video` fades in (opacity 0→1), `.card-thumbnail` fades out simultaneously — both 0.5s
- Corner brackets translate outward 12px
- On mouseleave: video pauses, `currentTime` resets to 0

**Gallery video autoplay:**
- Desktop: nested ScrollTrigger via `containerAnimation`, `start: 'left 80%'`, `end: 'right 20%'`
- Mobile: vertical ScrollTrigger, `start: 'top 80%'`, `end: 'bottom 20%'`
- Cards get `.is-playing` class while video is active

**Credits accordion:**
- Single row open at a time
- On expand: font swaps to display serif, `fontSize` tweens to `2.25rem` (`0.5s expo.out`), height `0→auto` (`0.5s expo.out`), children stagger `opacity 0, y 16` → visible
- Hover: CA flash — `credits-ca-flash` keyframe, blue/red text-shadow offsets, `0.5s var(--ease-out-expo)`
- Plus icon rotates 45° on `.is-active`

**Lightbox:**
- GLightbox targeting `.glightbox-video`, `videosWidth: '90vw'`
- Dark overlay: `oklch(0.14 0 0 / 0.95)`
- On open: all `.card-video` pause and reset to frame 0
- On close: dispatches `'gallery:lightbox-close'`

**Scroll-to navigation:** `gsap.to(window, { scrollTo: target, duration: 0.9, ease: 'power2.out' })`

### Project Pages

**Video hero controls:** Custom UI — play/pause, sound toggle, timeline scrub, smooth scroll to credits. DOM-imperative; no GSAP tweens currently in `src/sections/project-video.js`.

**Case study:** All scroll-triggered, no user interaction required. Entrance fades, parallax, and clip-path wipes are automatic.

**Footer ticker:** CSS-only `@keyframes project-ticker-scroll`, 12s linear infinite horizontal scroll.

---

## 7. Responsive Breakpoints

### Homepage

| Breakpoint | Grid | Gallery | Credits | Footer |
|-----------|------|---------|---------|--------|
| ≥1025px | 6-col, subgrid | Horizontal scroll, pinned, progress visible | Subgrid, role column visible | Subgrid, 3-col |
| ≤1024px | 6-col | Vertical stack, `aspect-ratio: 4/3`, progress hidden | — | — |
| ≤768px | 4-col | — | Role column hidden, 1-col details | Block layout, 2-col info grid |
| ≤480px | 2-col | min-height 280px, fixed card title 1.25rem | — | 1-col info |
| `hover: none` | — | Corner brackets hidden entirely | — | — |

`GALLERY_BREAKPOINT = 1024` and `MOBILE_BREAKPOINT = 768` in `src/config.js`. Gallery JS does a full page reload when the user crosses 1024px.

`--container-padding` overridden to `1.25rem` at ≤480px.

### Project Pages

| Breakpoint | Credits | Case Study | Video Hero | Footer |
|-----------|---------|------------|------------|--------|
| >1024px | 2-col (text left, 460px/460px poster right) | 40px side padding, full image grids | 100vh | Row layout |
| 768–1024px | Poster 340px wide, 460px tall | 24px side padding | 100vh | — |
| <768px | 1-col stack, poster full-width 3:4 aspect | 16px side padding, grids collapse to 1-col | 80vh | Centered stack |

---

## 8. Fixed Chrome & Page Shell

### Homepage Layers

| Layer | Selector | z-index | Notes |
|-------|----------|---------|-------|
| Preloader | `.loading-overlay` | 10000 | Removed from DOM after exit |
| Cursor dot | `.custom-cursor-dot` | 10000 | `gsap.quickTo` positioned |
| Cursor ring | `.custom-cursor-ring` | 10000 | `gsap.quickTo` positioned, trails dot |
| Hero name (header) | `.hero-fixed-name-container > #hero-name-fixed` | 40 | Flip-animated between hero and fixed positions |
| Hero subtitle (fixed) | `#hero-subtitle-fixed` | 40 | Tracks title bottom edge, fades on scroll |
| Hero social (fixed) | `#hero-social-fixed` | 40 | Tracks title bottom edge, fades on scroll |
| Top gradient | `.hero-top-transition-gradient` | 35 | Backdrop-blur, transitions dark↔light for credits |
| Gallery progress | `.gallery-progress` | 100 | Visible only when `.featured-work-section.active` |
| Debug grid | `.bg-columns` | 2 | Toggled by `body.show-grid` |
| Footer | `#site-footer` | 0 | Fixed behind scroll wrapper, clip-path revealed |
| Scroll wrapper | `#smooth-wrapper > #smooth-content` | 1 | ScrollSmoother target |

### Project Pages

No fixed layers. Native scroll. Video controls are inline in the hero section.

---

## 9. Section Quick-Reference

### Homepage

**Hero** — `section.hero-section` | `src/sections/hero.js`
- Pin: 150% | Scrub: 1.5 | BG: full-bleed video + multi-stop gradient overlay
- Key classes: `.hero-video-container`, `.hero-video`, `.hero-gradient`, `.hero-content`, `.hero-name`, `.hero-subtitle`, `.hero-social`
- Scroll behavior: zoom (scale→1.15), blur (→8px), content exits, gradient darkens. Name Flips to fixed header over first 45%.

**About Intro** — `section.about-intro-section` | `src/sections/about-intro.js`
- Pin: 200% | Scrub: 1 | BG: `--color-nearblack` + radial dot-grid texture at ~7.5% effective opacity
- Key classes: `.about-intro__dot-bg`, `.about-intro__content`, `.about-intro__text`, `.about-intro__marquee`, `.about-intro__marquee-track`
- Scroll behavior: char-level opacity fill (0.15→1) across pinned section. Marquee loops via CSS.

**Featured Work** — `section#work.featured-work-section` | `src/sections/gallery.js`
- Pin: trackWidth (desktop) or none (≤1024px) | Scrub: 1 | BG: `--color-nearblack`
- Key classes: `.gallery-container`, `.gallery-track`, `.gallery-card`, `.card-media`, `.card-thumbnail`, `.card-video`, `.card-content`, `.card-title`, `.gallery-progress`
- Desktop: horizontal scroll. Mobile: vertical stack. Section gains `.active` while pinned.

**Credits** — `section#credits.credits-section` | `src/sections/credits.js`
- No pin | BG: light (`--color-offwhite`) inverting to dark when rows open
- Key classes: `.credits-list`, `.credit-row`, `.credit-row__header`, `.credit-row__details-inner`
- Dynamically built from `public/data/Projects.json`. Images lazy-load on first expand.

**CTA** — `section#cta.cta-section` | no JS module
- No pin | BG: `--color-nearblack`
- Key classes: `.cta-heading`, `.cta-subtext`, `.newsletter-form`, `.newsletter-input-group`, `.newsletter-submit`, `.cta-contact-btn`

**Footer** — `footer.site-footer#site-footer` | `src/sections/footer-reveal.js`
- Fixed, z-index 0, revealed via `clip-path: inset()` scrub on `#smooth-wrapper`
- Key classes: `.footer-inner`, `.footer-top`, `.footer-tagline`, `.footer-nav`, `.footer-columns`, `.footer-col`, `.footer-copyright`

### Project Pages — Video Hero Variant

**Video Hero** — `section.project-hero--video` | `src/sections/project-video.js`
- 100vh | BG: `oklch(0 0 0)` (pure black)
- Key classes: `.project-hero__video`, `.project-hero__controls`, `.project-hero__timeline`, `.project-hero__label`
- Custom video player UI. Smooth scroll to credits on button click.

**Project Credits** — `.project-credits` | `src/sections/project-credits.js` (stub, animations pending)
- BG: `--project-bg-credits`
- Key classes: `.project-credits__gradient`, `.project-credits__title`, `.project-credits__year`, `.project-credits__about`, `.project-credits__roles`, `.project-credits__poster`
- Static, hand-authored HTML per project. Gradient bridge dissolves from hero.

**Project Footer** — `footer.project-footer` | `src/sections/project-footer.js` (stub)
- Key classes: `.project-footer__ticker`, `.project-footer__back`, `.project-footer__socials`
- CSS-animated ticker, back-to-video button, abbreviated socials.

### Project Pages — Case Study Variant

**Case Study Hero** — `section.case-study__hero` | `src/sections/project-case-study.js`
- 100vh | Parallax zoom-out (scale 1.15→1, scrub 1.5) | BG: dark image
- Key classes: `.case-study__hero-image`, `.case-study__hero-overlay`, `.case-study__title`, `.case-study__meta`

**Case Study Intro** — `section.case-study__intro`
- Text-mask-rise triggered at `top 75%`, once
- Key class: `.case-study__intro-text`

**Image Sections** — `.case-study__pair`, `.case-study__statement`, `.case-study__triptych`, `.case-study__asymmetric`, `.case-study__closing`
- Pair: staggered `y: 60` entrance fade, trigger `top 75%`
- Statement: entrance fade + `yPercent: -10→10` parallax scrub, start `top bottom` to `bottom top`
- Triptych: clip-path wipe (`inset(100% 0 0 0)` → `inset(0%)`), staggered, trigger `top 70%`
- Asymmetric: dominant y:50, accent y:80 + continuous `yPercent: -5→5` drift
- Closing: entrance fade + scrub-linked fade-to-black transitioning into credits

**Project Credits + Footer:** Same components as video hero variant.

---

## 10. Working With This Document

DESIGN.md is a living rulebook, not a frozen spec. It evolves through collaboration.

### When to consult
- Before any visual or motion change to governed pages (`index.html`, project pages)
- When building a new section, component, or page that should be consistent with existing design
- When reviewing code for design adherence
- When asked "does this match our design?" or "what does the design say about X?"

### When to propose updates
- A new pattern emerges that isn't captured (new easing, new color usage, new component)
- A design decision is made in conversation that changes or extends an existing rule
- An existing rule is found to conflict with a new requirement

### How to propose updates
- State the current rule, the proposed change, and why
- Wait for confirmation before editing DESIGN.md
- Keep the same style: prescriptive, specific values, no hedging

### Checking code against the document
- **Color:** verify CSS custom properties and inline values match the token tables (sections 2a–2e)
- **Typography:** verify font-family, size, weight, line-height match the type scales (sections 3b–3c)
- **Animation:** verify easing, duration, and stagger match the timing vocabulary and pattern specs (sections 5b–5e)
- **Layout:** verify grid tokens, container padding, breakpoint behavior match sections 4 and 7
- When a mismatch is found: report it — don't assume the code or the doc is correct, ask

### Conflicts between code and document
- Neither automatically wins. Flag the conflict: state what the code does vs what the doc says, then ask.
- If code is intentionally different (evolved past the doc), update DESIGN.md.
- If code drifted unintentionally, fix the code.
