# Continuous Cinematic Z-Zoom Implementation Plan

## Goal

Transform V4's opening sections (Hero, About, Featured Work) into a continuous "zooming forward" experience in the z-direction, eliminating the vertical scrolling sensation that currently occurs between featured-work items.

## Problem Summary

The current V4 implementation uses **independent ScrollTrigger pins** for each section. When one section unpins and the next pins, there's a brief gap where normal vertical scrolling resumes, breaking the z-axis illusion.

## Solution: Single Pinned Container

Wrap all z-zoom content in one container that pins once, with a single master timeline controlling the entire z-axis journey.

---

## Files to Modify

| File                                                      | Action                                                 |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `/Users/randycounsman/Git/website/v4/index.html`          | Restructure HTML to use single z-zoom container        |
| `/Users/randycounsman/Git/website/v4/styles.css`          | Add unified perspective CSS, update layer positioning  |
| `/Users/randycounsman/Git/website/v4/CinematicZoom.js`    | **New file** - single-pin zoom controller              |
| `/Users/randycounsman/Git/website/v4/animations.js`       | Update init to use CinematicZoom, remove old functions |
| `/Users/randycounsman/Git/website/v4/FeaturedWorkZoom.js` | Delete (replaced by CinematicZoom.js)                  |

---

## Implementation Steps

### Step 1: Restructure HTML (index.html)

Wrap Hero, About, and all 6 Featured Work sections in a single container:

```html
<!-- Z-ZOOM CONTAINER: Single pinned element -->
<div id="z-zoom-container" class="z-zoom-container">
  <div class="z-zoom-perspective">
    <div class="z-zoom-layers">
      <!-- Layer 0: Hero -->
      <div class="z-layer" data-layer="hero">
        <div class="z-layer-media"><!-- video --></div>
        <div class="z-layer-overlay"><!-- name, subtitle --></div>
      </div>

      <!-- Layer 1: About -->
      <div class="z-layer" data-layer="about">
        <div class="z-layer-media about-backdrop"></div>
        <div class="z-layer-overlay"><!-- bio content --></div>
      </div>

      <!-- Layers 2-7: Featured Work 1-6 -->
      <div class="z-layer" data-layer="featured-1"><!-- ... --></div>
      <!-- etc -->
    </div>
  </div>
</div>

<!-- Normal scroll content after z-zoom -->
<section id="gallery" class="gallery">...</section>
```

**Key changes:**

- Remove individual `<section>` wrappers from hero, about, featured-work
- All content becomes `.z-layer` elements inside single perspective container
- Overlays move inside their respective layers (no more `position: fixed`)

### Step 2: Add Z-Zoom CSS (styles.css)

```css
.z-zoom-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: var(--clr-pure-black);
}

.z-zoom-perspective {
  position: absolute;
  inset: 0;
  perspective: 1500px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
}

.z-zoom-layers {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  /* This element moves forward via translateZ */
}

.z-layer {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
```

### Step 3: Create CinematicZoom.js (new file)

Core architecture:

- **Constructor**: Collect all `.z-layer` elements, set initial z-positions
- **positionLayers()**: Stack layers in z-space (each 1500px behind previous)
- **createMasterTimeline()**: Single GSAP timeline with all layer animations
- **createScrollTrigger()**: Single pin on `#z-zoom-container`

**Key parameters (per your preferences):**

- `scrollDistance: '500%'` (~0.625 viewport per layer for faster pacing)
- Hero video fades to black during About transition
- Smooth release at end (no zoom-out effect)

**Timeline sequence:**

```
Progress    Layer           Action
0.00        Hero            Visible, overlay fades in
0.08        Hero            Overlay fades, video scales/blurs to black
0.16        About           Emerges from blur, overlay visible
0.24        About           Fades, transitions to black
0.32        Featured 1      Emerges, overlay visible, fades
...
0.88        Featured 6      Emerges, overlay visible
1.00        Complete        Pin releases, credits visible
```

### Step 4: Update animations.js

Replace initialization:

```javascript
// REMOVE these calls:
// initHeroToAboutZoom();
// initFeaturedWorkZoom();

// ADD:
function initCinematicZoom() {
  const cinematicZoom = new CinematicZoom({
    zDepthPerLayer: 1500,
    scrollDistance: "500%",
    blurMaxPx: 20,
  });
  window.cinematicZoom = cinematicZoom;
}
```

### Step 5: Delete FeaturedWorkZoom.js

Remove script tag from index.html, delete the file.

---

## Animation Details

### Layer Transition Effect

Each layer follows this pattern:

1. **Approach**: Layer at z=-1500px, blurred, opacity 0
2. **Arrive**: Animates to z=0, blur=0, opacity=1
3. **Overlay**: Text content fades in while in focus
4. **Hold**: Brief pause for reading
5. **Depart**: Scales up (1.5x), blurs, fades as "camera" passes through

### Hero-to-About Transition

- Hero video scales 2x, blurs 20px, fades to black (opacity 0)
- About emerges from the darkness (no video visible after About)

### Credits Transition

- Last featured work fades naturally
- Pin releases, `.gallery` section enters viewport via normal scroll
- Subtle gradient at top of gallery blends the transition

---

## Testing Checklist

- [ ] Continuous z-zoom without vertical scroll sensation
- [ ] Each project holds long enough to read quotes (~1.5s at normal scroll speed)
- [ ] Hero video fades completely before featured work begins
- [ ] Transition to credits table is smooth (no jump)
- [ ] Scroll back reverses correctly
- [ ] Mobile: Test at 768px and below
- [ ] Reduced motion: Simple fades, no 3D transforms

---

## Performance Notes

- All animated properties are GPU-accelerated (transform, opacity, filter)
- Images for later layers use `loading="lazy"`
- `will-change` applied during animation, removed after
- Single pin = simpler ScrollTrigger lifecycle, fewer edge cases
