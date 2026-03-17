# Particle Portrait Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a scroll-driven particle portrait to the about section — crisp photo with tagline dissolves into a 3D particle system that scatters and fades out.

**Architecture:** Dual-layer (DOM img + tagline on top, Three.js canvas behind). GSAP ScrollTrigger scrub drives both DOM animations and WebGL uniforms from a single timeline. Section follows site pattern: `gsap.context()` wrapper, `initAboutPortrait()` export, cleanup on revert.

**Tech Stack:** Three.js (Points geometry + custom shaders), GSAP ScrollTrigger, Depth Anything v2 (offline depth map generation)

**Design Doc:** `docs/plans/2026-03-01-feat-particle-portrait-design.md`

---

## Task 1: Generate pixel-aligned depth map

**Files:**
- Create: `scripts/generate-depth-map.py`
- Output: `public/images/RandyHeroPic-depth.png` (replaces existing misaligned version)

**Step 1: Install Depth Anything v2**

```bash
pip3 install torch torchvision
pip3 install huggingface_hub
```

**Step 2: Write the depth map generation script**

```python
#!/usr/bin/env python3
"""Generate a pixel-aligned depth map from a photo using Depth Anything v2."""

import sys
import torch
import numpy as np
from PIL import Image
from huggingface_hub import hf_hub_download
from torchvision.transforms import Compose, Resize, Normalize, ToTensor

def load_depth_anything_v2():
    """Load Depth Anything v2 Small model."""
    from depth_anything_v2.dpt import DepthAnythingV2

    model_configs = {
        'vits': {'encoder': 'vits', 'features': 64, 'out_channels': [48, 96, 192, 384]},
    }
    model = DepthAnythingV2(**model_configs['vits'])
    filepath = hf_hub_download(
        repo_id='depth-anything/Depth-Anything-V2-Small',
        filename='depth_anything_v2_vits.pth',
        repo_type='model',
    )
    model.load_state_dict(torch.load(filepath, map_location='cpu', weights_only=True))
    model.eval()
    return model

def main():
    input_path = 'public/images/RandyHeroPic.JPG'
    output_path = 'public/images/RandyHeroPic-depth.png'

    img = Image.open(input_path).convert('RGB')
    raw = np.array(img)

    model = load_depth_anything_v2()

    with torch.no_grad():
        depth = model.infer_image(raw)

    # Normalize to 0-255 (closer = brighter)
    depth = depth - depth.min()
    depth = depth / depth.max()
    depth = (depth * 255).astype(np.uint8)

    depth_img = Image.fromarray(depth, mode='L')
    depth_img.save(output_path)
    print(f'Wrote {output_path} ({depth_img.size[0]}x{depth_img.size[1]})')

if __name__ == '__main__':
    main()
```

Note: If `depth_anything_v2` package is unavailable via pip, clone the repo and install:
```bash
pip3 install git+https://github.com/DepthAnything/Depth-Anything-V2.git
```
Or use the transformers pipeline as a fallback:
```python
from transformers import pipeline
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")
result = pipe(Image.open(input_path))
depth_img = result["depth"]
```

**Step 3: Run the script and verify output**

```bash
python3 scripts/generate-depth-map.py
```

Expected: `public/images/RandyHeroPic-depth.png` — same dimensions as source (1280×853), grayscale, subject clearly brighter than background, edges aligned to photo features.

Open both images side-by-side to visually confirm the depth map silhouette matches the photo (subject, chair, floor, windows).

**Step 4: Commit**

```bash
git add scripts/generate-depth-map.py public/images/RandyHeroPic-depth.png
git commit -m "feat(about-portrait): add ML depth map via Depth Anything v2

Replaces misaligned PLY-rasterized depth map with pixel-aligned
monocular depth estimation."
```

---

## Task 2: Add HTML section and CSS layout

**Files:**
- Modify: `index.html` (insert section between hero and about-intro, lines 221–222)
- Create: `src/styles/about-portrait.css`

**Step 1: Add the HTML section**

In `index.html`, after the closing `</section>` of the hero section (line 221) and before the about-intro comment (line 223), insert:

```html
    <!-- =====================================================
         SECTION: ABOUT PORTRAIT
         Scroll-driven particle portrait — photo dissolves into 3D particles
    ====================================================== -->
    <section class="about-portrait">
        <canvas class="about-portrait__canvas"></canvas>
        <div class="about-portrait__overlay">
            <img
                class="about-portrait__photo"
                src="images/RandyHeroPic.JPG"
                alt="Randy Counsman portrait"
                loading="eager"
            >
            <p class="about-portrait__tagline">
                <span class="about-portrait__tagline-inner">Crafting stories that matter</span>
            </p>
        </div>
    </section>
```

Notes:
- `loading="eager"` because this is above the fold (right after hero).
- Tagline copy is placeholder — user will finalize.
- The `<span>` wrapper inside `<p>` is the mask-wipe target (`overflow: hidden` on `<p>`, translate on `<span>`).

**Step 2: Write the CSS**

Create `src/styles/about-portrait.css`:

```css
/**
 * About Portrait Section
 * Dual-layer: Three.js canvas (behind) + DOM photo/tagline (on top)
 */

/* =====================================================
   SECTION LAYOUT
====================================================== */
.about-portrait {
  position: relative;
  height: 300vh; /* scroll distance for the animation */
  background: var(--color-nearblack);
}

/* =====================================================
   WEBGL CANVAS
====================================================== */
.about-portrait__canvas {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  display: block;
  z-index: 0;
}

@supports (height: 100svh) {
  .about-portrait__canvas {
    height: 100svh;
  }
}

/* =====================================================
   DOM OVERLAY (photo + tagline)
====================================================== */
.about-portrait__overlay {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
  /* Offset back up since both sticky elements compete for the same slot */
  margin-top: -100vh;
}

@supports (height: 100svh) {
  .about-portrait__overlay {
    height: 100svh;
    margin-top: -100svh;
  }
}

.about-portrait__photo {
  max-width: min(70vw, 900px);
  max-height: 60vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

/* =====================================================
   TAGLINE
====================================================== */
.about-portrait__tagline {
  margin-top: 1.5rem;
  overflow: hidden; /* mask for wipe animation */
  font-family: var(--ff-display);
  font-size: clamp(1rem, 2vw, 1.5rem);
  font-style: italic;
  font-weight: 300;
  color: var(--color-offwhite);
  letter-spacing: 0.02em;
  text-align: center;
}

.about-portrait__tagline-inner {
  display: block;
  /* GSAP will animate translateY from 0 to 110% for mask-wipe out */
}

/* =====================================================
   RESPONSIVE
====================================================== */
@media (max-width: 768px) {
  .about-portrait__photo {
    max-width: 85vw;
  }
}

@media (max-width: 480px) {
  .about-portrait__photo {
    max-width: 92vw;
  }

  .about-portrait__tagline {
    font-size: clamp(0.85rem, 3.5vw, 1.1rem);
  }
}

/* =====================================================
   REDUCED MOTION
====================================================== */
@media (prefers-reduced-motion: reduce) {
  .about-portrait {
    height: auto;
  }

  .about-portrait__canvas {
    display: none;
  }

  .about-portrait__overlay {
    position: relative;
    margin-top: 0;
    padding: 4rem 2rem;
  }
}
```

**Step 3: Verify the static layout**

Run `npm run dev`, navigate to `localhost:5173`. Confirm:
- Photo appears centered between hero and about-intro
- Tagline text visible below the photo
- Canvas element present in DOM (empty/black, no JS yet)
- Scrolling past the section reveals the about-intro section normally
- No layout breaks in existing sections

**Step 4: Commit**

```bash
git add index.html src/styles/about-portrait.css
git commit -m "feat(about-portrait): add HTML section and CSS layout

Inserts about-portrait section between hero and about-intro.
Dual sticky layers: canvas behind, photo+tagline in front.
Reduced-motion fallback hides canvas and shows static photo."
```

---

## Task 3: Build the particle system module

**Files:**
- Create: `src/sections/about-portrait.js`
- Modify: `src/main.js`

This is the core implementation. It follows the site's section pattern (`gsap.context`, exported init function, cleanup return).

**Step 1: Write `src/sections/about-portrait.js`**

The module structure:

```javascript
import * as THREE from 'three';
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { SCRUB } from '../config.js';

// --- GLSL shaders ---
// Vertex: uniforms for uDepthScale, uScatter, uPointSize, uOpacity, uTime
// Attributes: aColor (vec3), aDepth (float), aScatterDir (vec3)
// Depth: pos.z += aDepth * uDepthScale
// Scatter: smoothstep scatter with drift
// Size: uPointSize * (refDist / -mvPosition.z)

// Fragment: soft circle discard, vColor * vAlpha

// --- sampleImage(colorImg, depthImg, camera) ---
// Draws both images to offscreen canvas, reads pixel data
// Creates position grid sized to match camera frustum at z=0 (~70% of viewport)
// Returns { positions, colors, depths, scatterDirs, count, idealSize }

// --- initAboutPortrait() ---
// 1. Query DOM elements (.about-portrait, .about-portrait__canvas, etc.)
// 2. Early return if missing or prefers-reduced-motion
// 3. gsap.context(() => { ... }, section)
// 4. Inside context:
//    a. Load color image + depth image (from DOM img src + hardcoded depth path)
//    b. Create Three.js renderer, camera (fov 50, z=4), scene
//    c. Sample images into particle data
//    d. Create Points geometry with ShaderMaterial
//    e. Build ScrollTrigger timeline:
//       - Phase 1: tagline mask-wipe (translateY on .about-portrait__tagline-inner)
//       - Phase 2: photo opacity fade (on .about-portrait__photo)
//       - Phase 3: uDepthScale 0 → 1.5
//       - Phase 4: camera x shift (parallax orbit)
//       - Phase 5: uScatter 0 → 1, uOpacity 1 → 0
//    f. Render loop with RAF, paused when section is off-screen
//    g. Resize handler
// 5. Return cleanup function (ctx.revert disposes GSAP; also dispose Three.js)

export function initAboutPortrait() { ... }
```

Key implementation details (adapt from `src/main-sandbox-3d-particles.js`):

- Import GSAP from `../animations/scroll-defaults.js` (NOT directly from 'gsap') to match site convention
- Use `SCRUB.smooth` (1.5) for the ScrollTrigger scrub value
- The ScrollTrigger trigger is `.about-portrait`, start `'top top'`, end `'bottom bottom'` (the section is 300vh, so 200vh of scroll animation)
- Pin is NOT needed — the canvas and overlay are already `position: sticky`
- Pause the RAF render loop when section is not active (use ScrollTrigger `onToggle` or check scroll position)
- On `ctx.revert()`: dispose Three.js renderer, geometry, material, textures

**Step 2: Wire into `src/main.js`**

Add import and init call following the existing pattern:

```javascript
// At top, with other imports:
import './styles/about-portrait.css';
import { initAboutPortrait } from './sections/about-portrait.js';

// Inside init(), with other section inits:
const cleanupAboutPortrait = initAboutPortrait();

// In pagehide cleanup:
if (typeof cleanupAboutPortrait === 'function') cleanupAboutPortrait();
```

**Step 3: Verify in browser**

Run `npm run dev`. Check:
- Photo visible at rest, tagline below it
- Scrolling triggers: tagline wipes out → photo fades → particles visible → depth reveals → orbit → scatter → fade
- 60fps in stats
- No console errors
- About-intro section appears normally after the portrait section
- Existing sections (hero, gallery, credits) are unaffected

**Step 4: Commit**

```bash
git add src/sections/about-portrait.js src/main.js
git commit -m "feat(about-portrait): particle system with scroll-driven animation

Three.js particle cloud sampled from photo pixels, depth map drives
Z displacement. Single ScrollTrigger scrub timeline coordinates DOM
crossfade (img opacity, tagline mask-wipe) with WebGL uniforms
(depth, scatter, camera orbit). One-way disintegration."
```

---

## Task 4: Align particle grid to DOM photo

**Files:**
- Modify: `src/sections/about-portrait.js`

This is the critical alignment step. The Three.js particle positions must exactly match the `<img>` element's rendered position and size on screen.

**Step 1: Implement alignment calculation**

The photo `<img>` is sized by CSS (`max-width: min(70vw, 900px)`, `max-height: 60vh`, `object-fit: contain`). To align the particle grid:

1. After loading images, read the `<img>` element's `getBoundingClientRect()`
2. Convert that screen rect to Three.js world coordinates at z=0 using the camera's projection
3. Position the particle grid to exactly match those world coordinates

```javascript
function getImageWorldBounds(imgEl, camera) {
  const rect = imgEl.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Convert screen coordinates to normalized device coordinates (-1 to 1)
  const ndcLeft = (rect.left / w) * 2 - 1;
  const ndcRight = (rect.right / w) * 2 - 1;
  const ndcTop = -(rect.top / h) * 2 + 1;
  const ndcBottom = -(rect.bottom / h) * 2 + 1;

  // Unproject to world coordinates at z=0
  const dist = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
  const visibleWidth = visibleHeight * camera.aspect;

  return {
    left: (ndcLeft / 2) * visibleWidth,
    right: (ndcRight / 2) * visibleWidth,
    top: (ndcTop / 2) * visibleHeight,
    bottom: (ndcBottom / 2) * visibleHeight,
  };
}
```

Use these bounds when creating the particle positions instead of the FOV-based calculation from the sandbox.

**Step 2: Verify alignment**

In browser: at the exact scroll position where the photo is at ~50% opacity, confirm the particle grid underneath aligns with the photo edges. The crossfade should be seamless — no visible shift or resize.

**Step 3: Handle resize**

On window resize, the `<img>` changes size. The particle grid must update. Options:
- Rebuild particle positions (expensive but simple)
- Scale the Three.js scene to match the new img rect (cheaper)

Use the scale approach: store original world bounds, on resize compute new bounds, apply a scale factor to the Points object.

**Step 4: Commit**

```bash
git add src/sections/about-portrait.js
git commit -m "fix(about-portrait): align particle grid to DOM photo position

Reads img bounding rect and converts to Three.js world coordinates.
Particle grid matches photo edges exactly for seamless crossfade.
Scale-based resize keeps alignment without rebuilding geometry."
```

---

## Task 5: Polish and verify

**Files:**
- Possibly modify: `src/sections/about-portrait.js`, `src/styles/about-portrait.css`

**Step 1: Tune scroll timing**

Open in browser, scroll slowly through the section. Adjust the timeline phase durations and easings for:
- Text wipe feels sharp and intentional (not too fast, not too slow)
- Photo-to-particles crossfade is smooth (no flash of empty space)
- Depth reveal is dramatic enough to read as 3D
- Camera orbit is subtle (not disorienting)
- Scatter is the climax — particles should feel like they're dissolving into air
- The transition into about-intro below is clean

**Step 2: Test performance**

Check FPS counter in stats. Target 60fps on desktop. If below:
- Reduce particle count (increase sampling step from 2 to 3)
- Reduce point size attenuation complexity
- Ensure RAF loop pauses when section is off-screen

**Step 3: Test reduced-motion fallback**

Enable `prefers-reduced-motion: reduce` in browser devtools. Confirm:
- Canvas is hidden
- Static photo and tagline visible
- No scroll animation
- No JS errors

**Step 4: Run lint**

```bash
npm run lint
npm run format
```

Fix any issues.

**Step 5: Commit**

```bash
git add -A
git commit -m "polish(about-portrait): tune scroll timing and verify performance"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Generate ML depth map | `scripts/generate-depth-map.py`, `public/images/RandyHeroPic-depth.png` |
| 2 | HTML section + CSS layout | `index.html`, `src/styles/about-portrait.css` |
| 3 | Particle system + scroll animation | `src/sections/about-portrait.js`, `src/main.js` |
| 4 | Align particle grid to DOM photo | `src/sections/about-portrait.js` |
| 5 | Polish, tune timing, verify | Various |

Tasks 1 and 2 are independent and can run in parallel. Tasks 3–5 are sequential.
