# Micro-Interaction Audit & Improvement Plan

## Review Outcome (post-implementation)

All 6 phases were implemented and reviewed against the plan. Faithful and well-executed: reduced-motion extraction into `reduced-motion.css` (imported by base/project/resume/medialog), the social-icon fight fix (four-shadow rest state + RM-gated CSS hover, GSAP primary), medialog filter rebuild → build-once/toggle-in-place with focus preserved and a render-generation guard, gate + modal exit choreography, `swapHidden` helper for `[hidden]` swaps, coverflow caption crossfade, resume dual-img crossfade + rAF-lerp Y-tracking, focus-visible coverage (project/aiplaylists/newsletter/wyatt), play/pause icon crossfade with `aria-label`, config `DUR`/`EASE`, DESIGN.md updates. `npx eslint src/` passes clean (exit 0). wyatt.css correctly gets its tokens via its own `@import './tokens.css'`.

### Must fix before go-live

1. **Project footer copyright dimming regression** — `src/styles/project.css:470`. The old `.project-footer__links { opacity: 0.6 }` dimmed the whole container, including the `<span>&copy; 2026</span>` sibling of the `Li`/`Vi` links (present in every project page + scaffold). That container opacity was removed and the 0.6 tone moved onto `a` only, so the copyright now renders at full `--project-text` (1.0) — brighter than the links at rest. Fix: add `color: oklch(0.959 0.003 165 / 0.6)` to `.project-footer__links` so the `<span>` inherits the muted tone; the `a` rule already sets its own 0.6 rest color and full-on-hover, so links are unaffected. Verify on `/projects/wyatt-earp/` that copyright and rest-state links match tone and links still brighten on hover.

### Minor / judgment call (optional)

2. **`.contact-status` now reserves permanent space** — `src/styles/contact.css:437`. Changed from collapsed-when-empty (`min-height: 0; margin: 0`, growing via `:not(:empty)`) to always `min-height: 1.2em; margin: 1rem 0 0` at `opacity: 0`. This is defensible (prevents layout shift when the aria-live status appears) but adds a small permanent gap below the form. Keep if intentional; otherwise gate the reserved space behind `.is-visible`.
3. **Redundant line** — `src/main-aiplaylists.js` `loadFeed()` sets `playlistList.hidden = false` immediately before `swapHidden(feedState, playlistList)` re-sets it. Harmless; drop the earlier line for clarity.

Plan: apply fix #1 (and optionally #2/#3), re-run `npx eslint src/`, then commit all micro-interaction changes as sequenced below.

## Context

Deep-dive motion audit of the whole site (homepage, project pages, contact, resume, aiplaylists, medialog, portfolio gate) asking: how can transitions, animations, and hover states be improved? The macro layer (hero sequences, gallery, case-study reveals) is mature and documented in DESIGN.md; the gaps are in the micro layer — state swaps with no transition, exit animations missing where entrances are rich, inconsistent easing/duration values, focus states, and two reduced-motion coverage holes.

Audit weighting (user-confirmed): **Jakub Krehel primary** (production polish — subtle enters/exits, hover transitions), **Jhey secondary** (selective delight), **Emil selective** (speed/restraint on high-frequency controls).

Verified findings: 4 critical, ~9 important motion gaps, ~6 consistency issues, 2 delight opportunities. Six phases = six commits, ordered foundation → critical → gaps → polish.

---

## Phase 1 — Foundation: tokens, reduced-motion coverage, easing normalization

**New file `src/styles/reduced-motion.css`** — extract the universal kill switch from `base.css:39-48` verbatim (0.01ms durations + `scroll-behavior: auto`). Import it from:
- `base.css` (replacing its inline block; `@import` must precede all rules)
- `project.css` (after line 5 — currently only ticker/scroll-behavior are RM-guarded; do NOT import base.css itself: its `body { line-height: 1.6; background: nearblack }` would double-reset project pages)
- `resume.css` (currently has ZERO reduced-motion handling — `.hover-preview` transforms run unconditionally) + add `@import './tokens.css'`
- `medialog.css` (replace its duplicate block at :481-493)

**`src/styles/tokens.css`** — one new easing token: `--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)` (the un-tokenized curve hard-coded in portfolio.css:195,405 and index.css:650-651).

**`src/config.js`** — make its "Shared easings" header true:
```js
export const DUR = Object.freeze({ instant: 0.2, quick: 0.4, medium: 0.7 }); // mirrors tokens.css
export const EASE = Object.freeze({ enter: 'expo.out', exit: 'power2.in', soft: 'power2.out', color: 'power2.inOut' });
```
Adopted by new/edited code only — no sweep of existing GSAP literals (AGENTS.md: keep animation code direct).

**Easing/duration normalization (CSS only):**
- `portfolio.css:195,405` and `index.css:651` → `var(--ease-out-quint)` (keep deliberate 1000/1500ms durations)
- `resume.css:278-280` Material curve `cubic-bezier(0.4,0,0.2,1)` → `var(--ease-out-quint)`, `0.3s` → `var(--dur-quick)`
- Bare `transition: opacity 0.3s` (default ease) in `project.css:95,136,149,201,366,402,420` + `case-study.css:64` → `var(--dur-instant) var(--ease-out-expo)` (DESIGN.md Instant band for hovers; deliberate feel change 0.3s→0.2s)
- `medialog.css:222-228` `160ms ease` × 3 → `var(--dur-instant) var(--ease-out-expo)`

Gotcha: wyatt.css imports base.css and will duplicate the RM rules — identical, harmless.

## Phase 2 — Critical: social-icon fight, medialog rebuild, focus-visible

**2a. Hero social icon double-hover bug** — `index.css:358-377` CSS transition + `:hover` transform fights the GSAP timeline (`hero-aperture-dual.js:135-173`); `clearProps` while still hovered snaps the icon up 5px.
- Delete the 3-property `transition` from the rest block; extend rest `filter` from two to **four** zero drop-shadows (GSAP only interpolates matching filter structures — aligns first-hover interpolation and the clearProps landing state)
- Move the `:is(:hover, :focus-visible)` block inside `@media (prefers-reduced-motion: reduce)` and drop its `translateY(-5px)` (keep filter/opacity) — under RM, `hero-aperture-dual.js` early-returns before wiring hover handlers, so this CSS is the only feedback RM users get. No JS changes.

**2b. Medialog filter rebuild** (`src/main-medialog.js`) — `renderItems` (:225,239) rebuilds filter buttons via innerHTML every click: active transition never plays, keyboard focus destroyed.
- `buildFilters(items)` once from `loadFeed()`; new `updateFilterButtons()` toggles `is-active`/`aria-pressed` in place
- List swap: RM → hard swap; else outgoing `gsap.to(children, { autoAlpha: 0, y: -10, duration: DUR.instant, stagger: 0.015, ease: EASE.exit, onComplete: swap })` (exit subtler than the 0.56s entrance), swap = innerHTML replace + existing `animateItems()`. Same entrance for the empty state (:231-236). Guard with a render-generation counter against rapid clicks.

**2c. Focus-visible** — reuse the homepage ring (`index.css:218-225`: `outline: 1px solid currentColor; outline-offset: 4px`):
- `project.css`: grouped rule for `.project-hero__close/__play-btn/__credits-btn/__sound-btn, .project-footer__back-btn, .project-footer__links a` (currently zero focus styles)
- `aiplaylists.css`: `.coverflow__nav, .coverflow-card__button, .playlist-modal__close, .playlist-modal__action` (keep `outline:none` on the dialog itself — programmatic focus only)
- `index.css:996` newsletter input: keep border cue, add `:focus-visible { outline: 1px solid oklch(0.968 0.006 75 / 0.6); outline-offset: 2px; }`

## Phase 3 — Exit choreography (Jakub: exits subtler than enters)

**3a. Portfolio gate unlock** (`portfolio-gate.js:206-208`) — currently `mount.remove()` hard cut at the most client-facing moment. Replace with exit timeline (RM → instant path):
panel `{ autoAlpha: 0, y: -12, filter: 'blur(6px)', 0.35s, EASE.exit }`, overlay fade `0.45s power2.inOut` at `-=0.15`, then `mount.remove(); onUnlock(data)`. Tween ONLY panel/overlay — never `.portfolio-gate__reveal` elements (their CSS `animation … both` fill beats GSAP inline styles). Also:
- Error entrance (:191): `fromTo(errorEl, { autoAlpha: 0, y: -4 } → 0.3s expo.out)` behind RM guard
- `.portfolio-gate__submit` transition (portfolio.css:656-663): add `opacity` so `:disabled { opacity: 0.4 }` fades instead of snapping

**3b. AI playlists modal close** (`main-aiplaylists.js:294-307`) — instant `root.hidden = true` vs rich 0.42s entrance. Split `close()` → exit tweens → `finish()`: dialog `{ autoAlpha: 0, y: 24, scale: 0.97, 0.28s power2.in }`, backdrop `0.26s`; `finish()` = current body + `clearProps`. Remove keydown listener at close() start (no Escape double-fire); `isClosing` guard; `resetAudio()` at start; `REDUCED_MOTION` (:6) short-circuits.

**3c. `[hidden]` hard cuts** — new helper `src/utils/motion.js` → `swapHidden(hideEl, showEl, { y = 12, duration = 0.4 })` (sets hidden flags, `fromTo(showEl, { autoAlpha: 0, y } → power2.out, clearProps)`). Call sites: medialog `revealExperience` (:277-278) + `renderState` (:90-91); aiplaylists `renderState` (:961-962) + feed→showcase (:999-1000).

**3d. Coverflow caption swap** (`main-aiplaylists.js:599-600`) — crossfade on index change, mirroring the gallery counter (`gallery.js:92-96`): `fromTo([title, counter], { autoAlpha: 0, y: -8 } → 0.2s expo.out, overwrite: true)`, RM-gated.

## Phase 4 — Form feedback

- **Newsletter** (`index.html:378`, native POST to Buttondown, no JS handler): keep native POST (`target="_blank"`; fetch adds CORS complexity for no gain). New ~15-line `src/sections/newsletter.js` init: on submit → disable button, `aria-busy`, label → "Opening…", 2.5s revert. CSS: `.newsletter-submit:disabled { opacity: 0.6 }` (existing transition covers it). Don't preventDefault.
- **Contact** (`main-contact.js:26-34`): write to the dormant `#fs-frm-status` (`contact.html:179`, already `role="status" aria-live="polite"`) — "Sending your message…" + `.is-visible`; style in contact.css with `opacity` transition + `min-height: 1.2em` (no layout shift).

## Phase 5 — Hover/press consistency + Wyatt

- **Resume hover-preview** (`main-resume.js`, `resume.css`): second stacked `img` for crossfade on `load` (opacity flip, `var(--dur-instant) var(--ease-out-quint)`); smooth Y-tracking via rAF lerp `y += (target - y) * 0.18` (seed on enter, cancel after leave, skip under RM; keep page GSAP-free)
- **`.cta-link`** (`index.css:1205-1213`): stop animating `gap` (layout thrash) — drop it from transition + `:hover`; the svg `translate(3px,-3px)` carries the motion (optionally bump to 4px)
- **Press states** (`project.css`): `:active { transform: scale(0.97) }` on hero close/play/credits/sound + footer back-btn; add `transform` to their (Phase-1-edited) transition lists. Skip newsletter/cta (already have it at index.css:231-235); leave coverflow nav's 0.94 (compound transform with translateY(-50%) centering)
- **Cursor corner asymmetry** (`custom-cursor.js:143` vs `:176,210`): 0.5s enter / 0.45s leave already matches exits-subtler — hoist to named constants `CORNER_ENTER/CORNER_LEAVE` with a one-line comment; no feel change
- **Wyatt back link** (`case-study-wyatt.html:26-32`): move inline styles to wyatt.css classes; add color transition (`var(--dur-instant) var(--ease-out-expo)`), hover → offwhite + svg `translate(-2px, 2px)`, focus-visible ring. Don't forget the svg's inline `rotate(180deg)` must move into CSS or the arrow flips.

## Phase 6 — Delight (optional, small)

- **Play/pause icon crossfade** (`project-video.js:57-59` + `project.css`): stacked glyphs in a single-cell grid, `.is-playing` toggles opacity + `scale 0.85→1` crossfade (`--dur-instant` expo). Must set `aria-label` Play/Pause — accessible name was previously the glyph textContent.
- **Project footer links** (`project.css:419-425`): upgrade plain opacity fade to the contact.css underline pattern (:171-197) — `::after` `scaleX(0.4)→1` + opacity, `var(--dur-instant) var(--ease-out-expo)`.

---

## Declared intentional (no change)

Portfolio banding `expo.out`/`expo.inOut` asymmetry; marquee 0.4s/0.6s hover ramp; custom cursor architecture (overwrite handling is correct); credits accordion; nav pill indicator; gallery hover-intent system.

## DESIGN.md updates (propose alongside, flag before editing per repo rules)

- Add `--ease-out-quint` to the easing palette table
- Document the social-icon RM fallback (CSS hover = reduced-motion path, GSAP = primary)
- Document exit-choreography rule: exits subtler/faster than enters (~60-65% duration), gate/modal patterns
- Note `DUR`/`EASE` exports in config.js as the GSAP-side timing tokens

## Verification (per phase; playwright-cli only — never MCP playwright / npx playwright)

- `npm run dev` + `npm run lint` before each commit
- **Phase 1**: eval `getComputedStyle(...).transition` on `.project-hero__close` (expect `opacity 0.2s cubic-bezier(0.19, 1, 0.22, 1)`); `emulateMedia({ reducedMotion: 'reduce' })` + reload → transition-duration `0.01ms` on project + resume pages
- **Phase 2**: hover a social icon, hold 1.2s, eval transform → `none` (no lingering -5px). Medialog: tag a filter button with a probe property, click a year, probe survives (no rebuild) and `document.activeElement` is still the filter. Tab-walk project + aiplaylists pages, eval `outlineStyle` per stop
- **Phase 3**: gate unlock — screenshots at ~0/200/450ms (probe animation state before trusting frames, per AGENTS.md); modal Escape → frames during close + focus restored to originating button; repeat under reduced-motion → instant paths
- **Phase 4**: `playwright-cli route` mock for Buttondown/Formspree; eval button label + `#fs-frm-status` text
- **Phase 5**: resume crossfade frames; `.cta-link` text-node `getBoundingClientRect()` identical before/during hover (no reflow); Wyatt Tab + hover checks
- **Phase 6**: play/pause `aria-label` toggles with `video.paused`; RM pass flattens both
- Finish: `just visual-audit`; delete temp screenshots

**Cross-phase invariants**: never leave a CSS transition on a property GSAP animates on the same element; `clearProps` lands on CSS rest state, so rest CSS must equal timeline end values; CSS animations with `fill: both` beat GSAP inline styles.
