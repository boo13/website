# Fix: return from a project page lands you back on the gallery card you opened (no preloader replay)

## Context

When a user opens a project detail page (`projects/<slug>/index.html`) and then hits **Close** or the **browser Back button**, they should return to the Featured Work gallery exactly where they were — on the card they just opened. Instead they get a full reload of the landing page: the **preloader animation replays** and they're dumped at the top.

This has been "fixed" several times and never works. The reason is now clear and it is **foundational, not a bug in the last patch**:

### Root cause — the feature is staked entirely on bfcache, which is non-deterministic

The current strategy (commit `31780d1`) is: keep `index.html` eligible for the browser's **back/forward cache (bfcache)** so that Back/`history.back()` restores the frozen page — scroll intact, no preloader. The supporting pieces:

- `src/main.js:68-79` — `pagehide` listener that **skips cleanup** when `event.persisted` (page entering bfcache).
- `src/sections/project-video.js:27-36` — Close button calls `history.back()` only when `document.referrer` is same-origin, else falls through to `href="/"`.

The problem: **there is no fallback for when bfcache does not engage.** When bfcache is denied, `index.html` does a *full fresh load* → `main.js` re-runs → `runPreloader()` is called **unconditionally** (`src/main.js:58`) → scroll resets to 0. And bfcache is denied constantly:

- **In `npm run dev` it is denied 100% of the time** — the Vite HMR WebSocket keeps an open connection, which makes the page permanently bfcache-ineligible in Chrome. The user confirmed they see the bug in dev. **No bfcache-tuning patch can ever work in dev** — that is why every prior attempt "failed" on retest.
- **On the live site it is fragile** — the homepage autoplays an R2 hero video (open media/network connections are a common bfcache disqualifier), and the Close button's `history.back()` depends on a non-empty `document.referrer`. The user confirmed they also see it live.

Verified facts that shape the fix:
- Production serves `cache-control: max-age=600` (not `no-store`) and there are **no `unload`/`beforeunload` listeners** — so bfcache *can* work live; it just can't be relied on.
- `history.scrollRestoration` is never set explicitly.
- **The gallery is a horizontally-pinned scroller** (`src/sections/gallery.js:179-206`): on desktop, vertical scroll drives a horizontal `gsap.to(track, {x})` inside a pinned ScrollTrigger. A card's on-screen position is a function of the vertical scroll offset *within the pin*, so "scroll the card into view" is a geometry calculation, **not** `element.scrollIntoView()`. On compact/mobile (`<= GALLERY_BREAKPOINT`) the gallery is a normal vertical flex column, where `scrollIntoView` does work.

### Intended outcome

A **deterministic** return path that does not depend on bfcache at all: on a real reload that we can identify as a return-from-project navigation, **skip the preloader** (no flash) and **scroll the clicked card back into view**. Keep the bfcache fast-path as a bonus when the browser does grant it. The user chose **"land on the card you clicked"** as the restore target (more robust than a pixel offset, and it survives layout shift).

## Approach

Add an explicit, sessionStorage-/navigation-type-driven "returning to gallery" path, layered *under* the existing bfcache path (which stays intact).

### State contract (resolves the over-broad-detection bug)

The return is driven by a **one-use marker**, not by persistent state plus nav-type. A project page writes `sessionStorage['rc:returnTo'] = location.pathname` on load. The homepage qualifies a return **only when that marker is present AND this is a genuine return nav** (`back_forward` or project referrer), then **consumes the marker before first paint**. Because it is consumed on the first homepage restore, a later unrelated `contact.html → Back → /` finds no marker and the preloader plays normally. The marker also carries the slug, so no separate `rc:lastProject` and no referrer-parsing fallback are needed.

### 1. Detect a return navigation before first paint — `index.html`

In the existing critical inline `<style>`/`<head>` block (around `index.html:13-39`, before the `.loading-overlay` markup at line 150), add a small **classic inline `<script>`** that runs synchronously during parse:

```js
(function () {
  try {
    var payload = sessionStorage.getItem('rc:returnTo'); // one-use slug, set only by a project page
    if (!payload) return;                                // nothing to return to -> normal load
    var nav = performance.getEntriesByType('navigation')[0];
    var bf = nav && nav.type === 'back_forward';
    var ref = document.referrer;
    var fromProject =
      ref && ref.indexOf(location.origin) === 0 && /\/projects\//.test(ref);
    if (!(bf || fromProject)) return;                    // marker exists but this isn't a return nav
    sessionStorage.removeItem('rc:returnTo');            // consume now -> strictly one-use
    var de = document.documentElement;
    de.classList.add('rc-return');
    de.dataset.returnTo = payload;                       // hand the slug to main.js
    // Suppress native scroll restoration so it can't flash the old position
    // before scrollToCard() runs. Per-document — verified it does not leak to
    // other pages (contact.html etc. are 'auto').
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (e) {}
})();
```

And add one rule to the existing inline `<style>` so the overlay never paints on a return (no flash, since module JS is deferred):

```css
html.rc-return .loading-overlay { display: none !important; }
```

This covers both triggers: Back button and same-origin Close → `nav.type === 'back_forward'`; the `href="/"` fallthrough → `fromProject` via referrer.

### 2. Write the one-use return marker — `src/main-project.js`

On every project page load:

```js
try { sessionStorage.setItem('rc:returnTo', location.pathname); } catch (e) {}
```

(`location.pathname` is `/projects/<slug>/` — the exact value of the gallery card's `a.card-link[href]`, so matching on the homepage is a direct equality check. Re-written on each project view; consumed on the next homepage return.)

### 3. Give the gallery a `scrollToCard()` that understands its own geometry — `src/sections/gallery.js`

`initGallery()` currently returns a cleanup function. Change it to return `{ destroy, scrollToCard }`. Two accessibility fixes vs. the first draft:

- **`smoother` is local to `main.js:19` and not reachable from `gallery.js`.** Get the active instance via `ScrollSmoother.get()` (add `ScrollSmoother` to the existing `../animations/scroll-defaults.js` import). It returns `undefined` under reduced motion, which the fallback handles.
- Lift the desktop tween to a closure variable — `let scrollTween` in `initGallery` scope, assigned inside the `gsap.context` (`gallery.js:179`) — so `scrollToCard` can reach both the tween and its `scrollTrigger`.

```js
function scrollToCard(href) {
  const card = track
    .querySelector(`a.card-link[href="${href}"]`)
    ?.closest('.gallery-card');
  if (!card) return; // project not featured -> no-op, lands at top
  const smoother = ScrollSmoother.get();

  // Compact / reduced-motion: gallery is a vertical flex column
  if (isCompact || prefersReducedMotion() || !scrollTween) {
    if (smoother) smoother.scrollTo(card, false, 'center center');
    else card.scrollIntoView();
    return;
  }

  // Desktop: card position is driven by vertical scroll within the pin
  const st = scrollTween.scrollTrigger;
  const dist = st.end - st.start; // == scrollDistance after refresh
  const cardCenter = card.offsetLeft + card.offsetWidth / 2; // relative to track
  const targetX = Math.min(Math.max(cardCenter - window.innerWidth / 2, 0), dist);
  const targetScroll = st.start + targetX;

  if (smoother) smoother.scrollTo(targetScroll, false);
  else window.scrollTo(0, targetScroll);

  // The pin tween uses scrub: SCRUB.default (= 1) — without this the track would
  // visibly slide into place over ~1s. Snap both scroll and tween to final state.
  st.scroll(targetScroll);
  scrollTween.progress(dist ? targetX / dist : 0);
}
```

Co-locating this in `gallery.js` reuses `section`, `track`, `cards`, `isCompact`, and the live tween/ScrollTrigger rather than recomputing pin geometry in `main.js`.

### 4. Skip the preloader and restore on return — `src/main.js`

- Update the call site to the new return shape: `const gallery = initGallery();` and use `gallery.destroy` in the `pagehide` cleanup (replacing `cleanupGallery`).
- Branch on `document.documentElement.classList.contains('rc-return')`:
  - **Not a return** → current behavior unchanged: `runPreloader({ criticalRootSelector: '#hero' })...`.
  - **Return** → do **not** call `runPreloader`. Instead remove the overlay node (`document.querySelector('.loading-overlay')?.remove()`) and dispatch `loadingComplete` immediately so the hero initializes. The slug is already on the `<html>` element (`dataset.returnTo`, set + consumed by the inline script). Then restore scroll **after layout is final**, and **reset `scrollRestoration`** so `'manual'` does not leak into later navigation:
    ```js
    const de = document.documentElement;
    const href = de.dataset.returnTo;
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        if (href) gallery.scrollToCard(href);
      });
    });
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
      if (href) gallery.scrollToCard(href); // correct residual drift from late assets
    }, { once: true });
    ```
  Restore runs **after** `loadingComplete` (which registers the hero pin and refreshes), so `st.start/st.end` reflect final pin spacing.

The bfcache fast-path is untouched: when the browser *does* restore from cache, none of this runs (no fresh parse), the page resumes exactly as frozen.

### 5. Documentation

`DESIGN.md` is the source of truth for motion/behavior. Add a short note under the navigation/preloader section describing the return-navigation contract: preloader is suppressed and the gallery restores to the opened card on same-site return; first/external visits still play the preloader.

## Files to modify

| File | Change |
|------|--------|
| `index.html` | Inline `<head>` one-use-marker detect script + `html.rc-return .loading-overlay { display:none }` rule |
| `src/main-project.js` | Write one-use `rc:returnTo = location.pathname` on load |
| `src/sections/gallery.js` | Import `ScrollSmoother`; lift `scrollTween`; return `{ destroy, scrollToCard }` with geometry + scrub-snap |
| `src/main.js` | Use new gallery return shape; skip preloader + restore card on `rc-return`; reset `scrollRestoration` |
| `DESIGN.md` | Document return-navigation behavior |

Leave `src/sections/project-video.js` and the `pagehide` bfcache logic as-is.

## Edge cases & risks

- **Stale-marker false trigger (the High finding):** handled by the one-use contract — `rc:returnTo` is consumed on the first homepage return, so a later unrelated `contact.html → Back → /` finds no marker and shows the preloader normally. The marker is also gated on `back_forward || fromProject`, so its mere presence never triggers a skip on a non-return nav.
- **Horizontal-pin scrub catch-up (primary risk):** the pin tween uses `scrub: SCRUB.default` (=1, `config.js:10`), so setting scroll alone makes the track slide in over ~1s. `scrollToCard` snaps it with `st.scroll(targetScroll)` + `scrollTween.progress(...)`. Verify the card is in final position immediately with no visible slide; if GSAP re-eases on the next tick, the fallback is to set the tween a second time inside a `requestAnimationFrame`.
- **Horizontal-pin geometry timing:** `st.start/st.end` are only correct after a post-`loadingComplete` `ScrollTrigger.refresh()`. Restore is gated on `fonts.ready` + refresh, with a second pass on `window.load` for late hero-video/image layout drift.
- **`scrollRestoration` (Low finding) — verified non-issue:** `history.scrollRestoration` is **per-document**. Browser-tested: after the return restore the homepage is `'manual'` (GSAP's own state after a programmatic `smoother.scrollTo`), but navigating to `contact.html` shows `'auto'`, and every fresh homepage load is `'auto'`. It does not leak across pages, so no reset is performed. The inline script still sets `'manual'` to avoid a native-scroll flash before `scrollToCard()` runs.
- **Reduced motion / no ScrollSmoother:** `ScrollSmoother.get()` is `undefined`; `scrollToCard` falls back to `scrollIntoView()`. The reduced-motion gallery is vertical, so this is correct.
- **Compact breakpoint reload:** `gallery.js:128-130` reloads when crossing `GALLERY_BREAKPOINT`. That reload is not a return nav, so the preloader behaves normally.
- **Fresh / external visit:** no marker → no `rc-return` class → preloader runs exactly as today.
- **Empty `document.referrer`:** the Back-button case still qualifies via `nav.type === 'back_forward'`; the slug rides in `rc:returnTo`, not the referrer.
- **Card not in gallery** (project not `featured`): `scrollToCard` no-ops; user lands at top. Acceptable.

## Verification

Dev is the *ideal* test bed here because bfcache is always off in dev, so `npm run dev` exercises the new deterministic path directly (the bfcache path can't mask a failure).

Use `playwright-cli` (per CLAUDE.md — not MCP Playwright, not `npx playwright`):

1. `npm run dev`. Load `/`, scroll into Featured Work, open a mid/late card (e.g. the 3rd), confirming its `href`.
2. **Close button:** click Close on the project page → assert on `/` that (a) `.loading-overlay` is absent / never visible (check it's removed and `html.rc-return` is set), and (b) the opened card is on-screen and roughly centered (compare its `getBoundingClientRect()` against viewport center). Because animations here are deferred by `fonts.ready`/rAF, poll the scroll position over ~1.5s rather than screenshotting once.
3. **Browser Back button:** repeat step 2 using `page.goBack()`.
4. **Fresh visit:** open `/` in a new context (no referrer) → assert the preloader *does* play and lands at top.
5. **Mobile/compact:** set viewport `<= GALLERY_BREAKPOINT`, repeat the open→Close round-trip; assert the vertical gallery scrolls the card into view, preloader suppressed.
6. **Reduced motion:** emulate `prefers-reduced-motion: reduce`; confirm no smoother errors and the card is reachable via `scrollIntoView`.
7. `npm run lint` clean before commit.
8. After building (`npm run build`) and deploying to a live-like origin, spot-check that the bfcache fast-path still works (instant restore, no preloader) in Safari, and that the deterministic path covers Chrome when bfcache is denied.

Clean up any temporary screenshots after verification.
