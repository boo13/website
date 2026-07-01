# Live Tweakpane Sandbox for Social Icon Chromatic Aberration (+ Glitch Text)

## Context
Earlier in this session we discussed Storybook as a way to test UI in
isolation, and concluded it's a poor fit here (no component framework, and
animations depend on ScrollTrigger/ScrollSmoother's real page-scroll
context — see the earlier analysis this file replaced). You redirected:
rather than adopting a new tool, extend the sandbox approach you already
have to more of this site's design components, starting with the social
icon hover effect, whose chromatic-aberration (CA) look hasn't been dialed
in and currently can only be tuned by hand-editing hardcoded values in
`src/sections/hero-aperture-dual.js` and reloading.

Investigation found you already have the right pattern in the codebase,
just not applied to this component: `src/sections/portfolio-rows.js`
(`mountTweakpane`, lines 840-888) dynamically imports the already-installed
`tweakpane` package, binds it to a live-mutable `cfg` object, persists
changes to `localStorage`, and only activates behind a `?debug=1` query
param — checked with `#tweakpane-mount` (styled fixed bottom-right in
`src/styles/portfolio.css:432`) already present in the portfolio page HTML.
This is a better fit than the static `experiments/_tweak/` harness (plain
HTML range inputs, no persistence) because it tunes the effect live on the
real page, in its real ScrollSmoother/DOM context, instead of an isolated
mock.

Goal: generalize that pattern into a small shared helper, then wire it to
(1) the social icon CA hover effect — the explicit ask — and (2) the
glitch-text profiles, which are already numeric config objects read live
every animation frame and are the next-best fit for the same tool.

## What's tunable today vs. hardcoded

**Social icon CA** — `src/sections/hero-aperture-dual.js`:
- `animateSocialIcon(svg)` (lines 134-173): builds a 3-step GSAP timeline
  on every hover/focus. Each step's `filter` is a hardcoded string of 4
  stacked `drop-shadow()`s (simulating blue/red/cyan/yellow channel
  offsets), with hardcoded x/y offsets, blur radii, alphas, and per-phase
  durations/eases (`0.14` rise, `0.16` settle, `0.48` release).
- `playHeroChromeEntrance()` (lines 223-263): a separate `fromTo` on the
  icons' entrance (rise from `y: 28`, `stagger: 0.15`, `duration: 0.85`)
  with its own hardcoded 4-shadow CA filter.
- Because both build a fresh timeline/tween per call, feeding them a
  mutable config object instead of literals means live Tweakpane edits
  take effect on the very next hover — no rebuild/replumbing needed.

**Glitch text** — `src/components/glitch-text.js`:
- `PROFILES.default` / `PROFILES.detail` (lines 1-42) are already a clean
  numeric config object, read live inside `renderGlitch()`'s rAF loop
  (lines 76-156). Binding Tweakpane directly to `PROFILES.default` means
  edits apply on the next animation frame — genuinely zero extra plumbing.

## Plan

### 1. Shared debug/Tweakpane helper
Add `src/utils/debug-pane.js`:
- `isDebugMode()` — extract the `new URLSearchParams(location.search).get('debug') === '1'` check currently inlined in `portfolio-rows.js:1000`.
- `mountPane(title)` — the dynamic `import('tweakpane')` + `new Pane({ title, container: document.getElementById('tweakpane-mount') })` boilerplate from `mountTweakpane` (`portfolio-rows.js:842-847`), factored out so each section just adds its own bindings.

Refactor `portfolio-rows.js` to use both (drop its local duplicate). No behavior change there.

### 2. Homepage debug mount point
`index.html` doesn't have the `#tweakpane-mount` div/CSS that the portfolio pages already have (`portfolio/design/index.html:73`, `src/styles/portfolio.css:432`). Add the div near the closing `</body>` and move the `#tweakpane-mount` CSS rule out of `portfolio.css` into a shared stylesheet (`base.css` or `tokens.css`) so both the homepage and portfolio pages use one definition instead of duplicating it.

### 3. Social icon CA config + panel
In `hero-aperture-dual.js`:
- Introduce a `SOCIAL_CA_CONFIG` object with the compact set of real knobs (not all 24+ raw literals) — offset X/Y, blur, alpha, hover lift distance, per-phase durations, ease, entrance stagger/duration — matching the granularity `portfolio-rows.js` uses for `DEFAULT_CONFIG` (~5-8 fields, not one slider per literal).
- Rewrite `animateSocialIcon()` and the entrance `fromTo` to build their filter strings from `SOCIAL_CA_CONFIG` instead of inline literals, keeping the existing "outer halo ~1.5× the inner offset" relationship as a derived value rather than a separate knob.
- In `initHeroApertureDual()`, if `isDebugMode()`, call `mountPane('Social Icon CA')` and add bindings for each `SOCIAL_CA_CONFIG` field, persisting to `localStorage` the same way `portfolio-rows.js` does (own storage key, e.g. `social-ca-config`), and merging any saved value back into the config on load.
- Add a "Preview" button (Tweakpane `addButton`) that calls `animateSocialIcon()` on the first icon directly, so you can audition changes without repeatedly moving the mouse on/off.

### 4. Glitch text profile panel
In `glitch-text.js` / wherever it's initialized for the homepage hero: behind the same `isDebugMode()`, `mountPane('Glitch Text')` and bind directly to `PROFILES.default`'s fields (`tail`, `driftBase`, `opacityMax`, `shadow`, etc.). No config-plumbing needed since the profile object is already read live.

### Files touched
- `src/utils/debug-pane.js` (new)
- `src/sections/portfolio-rows.js` (use shared helper, remove duplicate)
- `index.html` (add `#tweakpane-mount`)
- `src/styles/portfolio.css` / shared stylesheet (move `#tweakpane-mount` rule)
- `src/sections/hero-aperture-dual.js` (config object + panel)
- `src/components/glitch-text.js` (panel)

## Verification
- `npm run dev`, visit `/?debug=1` — confirm the Tweakpane panel appears bottom-right, matching the existing portfolio debug panel's look.
- Adjust each social-icon-CA slider and hover a social icon (or use the Preview button) — confirm the CA look changes live, and reload to confirm the last settings persist via `localStorage`.
- Adjust glitch-text sliders and move the mouse over the glitch-text element — confirm live changes with no reload needed.
- Visit `/` without `?debug=1` — confirm no Tweakpane panel, no console errors, and hover/entrance animations look identical to current production behavior (no visual regression from the refactor to config-driven values).
- `npm run lint` before considering done.
