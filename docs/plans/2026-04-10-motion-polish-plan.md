# Motion Polish Plan

## Context

Audit of site motion design against Jakub Krehel (primary), Jhey Tompkins (secondary), and Emil Kowalski (selective) perspectives. The architecture is strong — `gsap.context()` per section, velocity-driven marquee, FLIP name morph, CSS custom property animation for credits theme inversion. The gaps are surface-level: enter animations missing their blur component, one layout property in a timeline, no press feedback on interactive elements, and the highest-stakes interaction (video lightbox open) delegated to GLightbox defaults.

Severity: 1 Critical, 4 Important, 4 Opportunities.

---

## Changes

### 1. Customize GLightbox open/close animation [DONE]

**File:** `src/components/video-lightbox.js`

**Problem:** The video lightbox open is the site's highest-stakes interaction — a viewer clicking a gallery card to watch a reel. GLightbox's generic slide-fade overlay doesn't match the site's cinematic easing vocabulary and can't be controlled.

**Fix (minimum viable):** Set GLightbox `openEffect`/`closeEffect`/`openAnimationSpeed`/`closeAnimationSpeed` options to match site easing.

**Fix (ideal):** Replace GLightbox open animation entirely using a GSAP FLIP expansion from the clicked card's bounds to fullscreen. FLIP is already imported in `hero.js` — the infrastructure exists. Steps:
1. On card click, capture card state with `Flip.getState(card)`
2. Show the overlay (opacity 0)
3. Use `Flip.from(state, { duration: 0.55, ease: 'expo.out' })` to expand from card position
4. Fade overlay backdrop separately over 0.3s
5. Reverse on close

**Why:** Every other cinematic moment on the site is GSAP-controlled. The lightbox open should not be the exception.

---

### 2. Add blur to enter animations [DONE]

**Files:** `src/sections/credits.js`, `src/sections/about-intro.js`

**Problem:** Enter animations throughout use `opacity + translateY` but are missing blur — the third ingredient in Jakub's materializing recipe. Elements appear rather than materialize.

**Affected animations:**

- **Credits row entrance** — `credits.js:245`
  ```js
  // Current
  gsap.from('.credit-row', {
    opacity: 0, y: 15, duration: 0.6, ease: 'expo.out', stagger: 0.04, ...
  });

  // Fix
  gsap.from('.credit-row', {
    opacity: 0, y: 15, filter: 'blur(4px)', duration: 0.6, ease: 'expo.out', stagger: 0.04, ...
  });
  ```

- **Credits detail inner children** — `credits.js:272`
  ```js
  // Current
  gsap.from(inner.children, {
    opacity: 0, y: 16, duration: 0.5, ease: 'expo.out', stagger: 0.07,
  });

  // Fix — add filter
  gsap.from(inner.children, {
    opacity: 0, y: 16, filter: 'blur(4px)', duration: 0.5, ease: 'expo.out', stagger: 0.07,
  });
  ```

- **Phone mockups** — `about-intro.js:80`
  ```js
  // Current
  gsap.set(phoneEls, { yPercent: 120, opacity: 0, transformPerspective: 800 });
  // ...tl.to(phoneEls, { yPercent: 0, opacity: 1, ... })

  // Fix — set initial blur, animate to 0
  gsap.set(phoneEls, { yPercent: 120, opacity: 0, filter: 'blur(8px)', transformPerspective: 800 });
  // ...tl.to(phoneEls, { yPercent: 0, opacity: 1, filter: 'blur(0px)', ... })
  ```

**Note:** Do not add blur to scroll-scrubbed timelines (hero zoom, about-intro char reveal) — blur on scrub creates visual noise during slow scroll. Enter animations only.

---

### 3. Fix social icon hover background snap [DONE]

**File:** `src/styles/index2.css:379`

**Problem:** `.social-icon` has `transition: transform 0.3s ease` but `background: oklch(1 0 0 / 0.2)` on `:hover` has no transition. The icon scales smoothly while the background fill appears instantly.

**Fix:**
```css
/* Current */
.social-icon {
  transition: transform 0.3s ease;
}

/* Fix */
.social-icon {
  transition:
    transform 0.3s ease,
    background 0.2s ease;
}
```

---

### 4. Fade in lazy-loaded image in credits detail panel [DONE]

**File:** `src/sections/credits.js:244-248`

**Problem:** `img.src = img.dataset.src` causes the image to pop in instantly when loaded. No entrance transition.

**Fix:**
```js
// Current
const img = details.querySelector('img[data-src]');
if (img) {
  img.src = img.dataset.src;
  delete img.dataset.src;
}

// Fix
const img = details.querySelector('img[data-src]');
if (img) {
  gsap.set(img, { opacity: 0 });
  img.onload = () => gsap.to(img, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  img.src = img.dataset.src;
  delete img.dataset.src;
}
```

**Edge case:** If the image is already cached, `onload` fires synchronously in some browsers before `gsap.set` takes effect. Set opacity via `gsap.set` first, then assign `src`.

---

### 5. Add `:active` press feedback to interactive buttons [DONE]

**File:** `src/styles/index2.css`

**Problem:** `credit-row__header`, gallery cards, and CTA links have no visual response to press. The delay before the accordion animation starts reads as lag without feedback.

**Fix — add to existing button selectors:**
```css
.credit-row__header:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

.gallery-card:active {
  transform: scale(0.99);
  transition: transform 0.1s ease;
}

.cta-link:active {
  opacity: 0.7;
  transition: opacity 0.1s ease;
}
```

**Note:** These are `:active` states, not `:hover` — they only fire on actual press and are instant-reset on release. They do not conflict with GSAP animations on click.

---

### 6. Convert `@property` for chromatic aberration text-shadow [DONE]

**File:** `src/styles/index2.css:752-761`

**Problem:** `credits-ca-flash` uses `@keyframes` over `text-shadow`. Keyframes can't be interrupted or reversed mid-flight — a fast hover-in/hover-out cuts the animation rather than winding it down.

**Fix:**
```css
@property --ca-spread {
  syntax: '<length>';
  initial-value: 0px;
  inherits: false;
}

.credit-row__title {
  transition: --ca-spread 0.5s var(--ease-out-expo);
  text-shadow:
    calc(var(--ca-spread) * -1) 0 oklch(0.804 0.146 220 / 0.9),
    var(--ca-spread) 0 oklch(0.656 0.235 13 / 0.9);
}

.credit-row__header:hover .credit-row__title {
  --ca-spread: 5px;
}

/* Remove the @keyframes credits-ca-flash and the animation: rule */
```

**Browser support:** `@property` is supported in all evergreen browsers. No fallback needed for this use case (hover enhancement).

---

### 7. Gallery progress counter number transition [DONE]

**File:** `src/sections/gallery.js:40-46`

**Problem:** `progressCurrent.textContent = newIndex` updates the number as a raw DOM write — it just swaps. With the gallery as the primary portfolio showcase, the counter should feel alive.

**Fix:**
```js
function updateProgress(progress) {
  const totalCards = cards.length;
  const newIndex = Math.min(Math.floor(progress * totalCards) + 1, totalCards);
  if (newIndex !== currentIndex) {
    currentIndex = newIndex;
    if (progressCurrent) {
      gsap.fromTo(progressCurrent,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'expo.out', overwrite: true }
      );
      progressCurrent.textContent = newIndex;
    }
    if (progressTotal) progressTotal.textContent = totalCards;
  }
}
```

**Note:** Update `textContent` before the tween, not after — GSAP animates the element, not the value. The brief opacity-0 frame before the tween starts is imperceptible at 0.2s.

---

### 8. CSS guard for phone mockup FOUC [DONE]

**File:** `src/styles/about-intro.css`

**Problem:** Phone mockups are set to `yPercent:120, opacity:0` in JS (`about-intro.js:80`), but between page paint and GSAP initialization, they may briefly appear at their default position before GSAP applies the initial state.

**Fix — add to CSS:**
```css
.about-intro__phone {
  opacity: 0;
}
```

GSAP will override this once it initializes. If `prefers-reduced-motion` is on and JS returns early, the CSS opacity:0 will keep them hidden — which is the desired behavior anyway (the phones are decorative).

---

### 9. Delete dead `@keyframes heroFadeIn` [DONE]

**File:** `src/styles/index2.css:392-397`

**Problem:** `@keyframes heroFadeIn` is defined but never referenced anywhere in the codebase. Dead code.

**Fix:** Delete lines 392-397 from `index2.css`.

---

### 10. Credits `height` animation — technical debt note

**File:** `src/sections/credits.js:215, 237, 259, 265`

**Problem:** `tl.to(details, { height: 0 })` and `height: 'auto'` animate a layout property. GSAP handles `height: auto` well internally, but it triggers layout recalculation on every frame.

**Alternative approach (future refactor):** Replace with `clip-path: inset(0 0 100% 0)` → `clip-path: inset(0 0 0% 0)`. This is pure compositor, interruptible, and avoids layout thrashing. Requires removing `height: 0; overflow: clip` from the CSS and replacing with `clip-path`.

**Deferral rationale:** This fires a few times per session at most (accordion rows), so the layout cost is not perceptible. Tag as tech debt, not an immediate fix.

---

## Implementation Order

1. **Delete dead keyframe** — 1 minute, zero risk (item 9)
2. **Social icon transition** — 2 lines of CSS (item 3)
3. **`:active` press feedback** — CSS only, no JS (item 5)
4. **CSS guard for phones** — 1 line of CSS (item 8)
5. **Add blur to enter animations** — 3 targeted `fromTo` changes (item 2)
6. **Credits image fade** — `credits.js` only (item 4)
7. **`@property` chromatic aberration** — CSS only, replaces existing keyframe (item 6)
8. **Gallery counter transition** — small GSAP change (item 7)
9. **GLightbox customization** — minimum viable first, FLIP expansion if time permits (item 1)

Items 1-6 can be done in a single session. Items 7-9 are independent.
