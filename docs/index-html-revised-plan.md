# Homepage Content/IA Fixes — Revised from Corrected Critique

## Context

An earlier Claude critique of `index.html` (referenced as `.impeccable/critique/2026-06-10T00-31-33Z__index-html.md` — **not present on disk**) was re-reviewed by a second LLM, which validated the core findings but corrected several stale facts and reframed the P1s. This plan supersedes the original critique's action list.

**Facts verified against current code (2026-06-12):**

| Original critique claim | Corrected / verified |
|---|---|
| Gallery "1/5" | **4** featured cards (`Projects.json` `featured:true`). Gallery progress total auto-counts `.gallery-card` (`gallery.js:43,58`), so promoting more cards updates it automatically. |
| "25-row wall" | **38** total project entries → 38 credit rows. |
| "Zero section headings" | Too broad. Hero/About headline and CTA heading ("Stay in the loop") exist. Only **Featured** (`#featured`) and **Work** (`#work`) lack visible headings — the `<h2>Work</h2>` is commented out at `index.html:315`. |
| "No standalone About beat" | An About beat exists, but **embedded inside the pinned hero aperture timeline** (`.portal-scene__about`, `index.html:209-226`), revealed mid-scroll — no durable standalone presence, no nav entry. |
| Hero "black void" overstated | Preloader waits for first video frame (`loadeddata`/readyState≥2) and force-completes at 15s (`preloader.js:3`). But both hero `<video>` elements have **no `poster`** (`index.html:191`, `:232`) → underdesigned fallback if a frame never arrives or the source fails. |
| DESIGN.md drift noted but not actionable | DESIGN.md states hero pin `150%` (`DESIGN.md:534`, `:603`); actual code pins `end: '+=230%'` (`hero-aperture-dual.js:383`). |

**Decisions (from user):** cover all 3 reframed P1s + the DESIGN.md fix; for Featured/Work do **both** (curate more cards *and* add headings + expandable archive); for the About beat, **elevate the existing embedded one and add a nav button** to it.

---

## P1 #1 — Designed hero fallback states

Both hero videos render nothing designed before the first frame paints or if the source fails (R2 down, codec, offline).

- Add a `poster` attribute to `.aperture-back-video` (`index.html:191`) and `.hero-video` (`index.html:232`) pointing at a static still (a frame export of each montage; store in `public/images/portfolio/` and reference via the same host pattern, or a local poster). The poster shows until `loadeddata`, covering the pre-frame window the preloader doesn't.
- Confirm `poster` interaction with the preloader's `waitForVideoFrame` (`preloader.js:22-34`) — poster paints immediately, preloader still gates on the real frame; no conflict, but verify the force-complete path (`preloader.js:336-342`) still reveals a designed still rather than black if the video never loads.
- Keep `crossorigin` on both videos (CLAUDE.md gotcha) — poster is same-origin so unaffected.

**Files:** `index.html:189-248`, new poster image(s) in `public/images/portfolio/`, sanity-check `src/components/preloader.js`.

## P1 #2 — Rebalance Featured vs Work (both: curate + expandable archive)

Too little curated proof up front (4 cards), then a flat 38-row archive.

**a. Curate more featured cards (data-only).** In `public/data/Projects.json`, promote ~2–4 more strong projects to `featured:true` with `galleryOrder` set (target ~6–8 cards). Each needs the gallery fields (`hoverVideo`/`hoverVideoFallback`, `networkLogo`, optional `lightboxVideo`) per CLAUDE.md "Adding a project to the gallery". Gallery progress total updates automatically. Run `npm run dev` (build-time inject via `build/inject-gallery.js`).

**b. Add visible section headings.** Uncomment/add a styled heading for `#work` (`index.html:315`) and add a matching one for `#featured` (`index.html:301-307`). Use the existing `.section-title` class; confirm it's styled in `index.css` (add if missing) and matches DESIGN.md typography/`text-align: left`.

**c. Collapse the 38-row archive behind an expand.** In `src/sections/credits.js` (rows built in the `fetch().then` loop at `:583-604`), render a curated top slice (first N, e.g. 8 — by existing order or a new `creditsOrder` sort) visible, hide the remainder behind an "View full archive" toggle button appended after the list. Toggle adds/removes a class; respect the existing entrance animation (`credits.js:498-514`) and `prefers-reduced-motion`. Reuse the GSAP/expo vocabulary already in the section rather than a CSS keyframe.

**Files:** `public/data/Projects.json`, `index.html:301-320`, `src/sections/credits.js`, `src/styles/index.css` (`.section-title`, archive toggle styles).

## P1 #3 — Elevate the embedded About beat + add nav button

The About copy is buried in the pinned hero aperture reveal.

- **Elevate:** give `.portal-scene__about` (`index.html:209-226`) stronger standalone presence so it doesn't depend on hitting an exact scroll point — e.g. ensure the revealed state persists/holds within the pin rather than only at a single progress value (tune in `hero-aperture-dual.js`). Keep it in the hero per the decision; do not add a separate section.
- **Add nav button:** add an `About` item to `.pill-nav` (`index.html:175-181`, currently Featured / Work / Contact) and to the footer nav (`index.html:389-392`, currently Home / Featured / Work). Give the About beat an `id` anchor.
  - ⚠️ The About lives **inside the pinned hero** (`+=230%`), so the anchor can't scroll to a static element top. The nav click must scroll (via the ScrollSmoother pattern already used for `#featured`/`#work`) to the scroll position where the aperture reveals the about copy. Verify against how `nav.js` / existing anchors drive ScrollSmoother.
  - ⚠️ `.pill-nav` is `display:none` ≤768px (`index.css:408-410`) with no mobile replacement — the new About button (and existing items) are unavailable on mobile. Out of this plan's scope, but flag: the footer nav is the only mobile path, so ensure About is added there too.

**Files:** `index.html` (pill-nav, footer nav, About `id`), `src/sections/hero-aperture-dual.js`, possibly `src/sections/nav.js`.

## DESIGN.md drift fix (actionable)

Update DESIGN.md hero pin distance from `150%` to `+=230%` to match `hero-aperture-dual.js:383`. Check both `DESIGN.md:534` and `:603`, and reconcile any other stale homepage-structure descriptions touched by the heading/About changes above (per CLAUDE.md: code and DESIGN.md must not conflict; update doc alongside the change).

**Files:** `DESIGN.md`.

---

## Verification

Per CLAUDE.md: `playwright-cli` only (not MCP/npx playwright); wait for `fonts.ready` + ~1s before verification screenshots; delete temp shots.

1. **Fallback** — load with network throttled/offline for the video host; confirm the poster still shows a designed frame, not black. Confirm normal load still plays video after preloader.
2. **Featured** — `npm run dev`; confirm new cards render in `#featured`, gallery progress total reflects the new count, hover video + lightbox still work on added cards.
3. **Headings** — confirm `Featured` and `Work` headings render left-aligned, styled per DESIGN.md.
4. **Archive expand** — confirm only the curated slice shows initially; "View full archive" reveals the rest; collapse works; entrance animation + `prefers-reduced-motion` intact.
5. **About elevate + nav** — confirm About beat reads as a durable beat during the hero scroll; click the new pill-nav and footer `About` items and confirm they scroll to the about reveal (ScrollSmoother). Re-test `#featured`/`#work` anchors for regression.
6. **Mobile** — ≤768px: confirm footer `About` link works (pill-nav hidden by design).
7. **Reduced motion** — enable Reduce Motion; confirm hero/marquee static, archive toggle still functional.
8. `npm run lint` clean before any commit. Run on `dev` branch only.
