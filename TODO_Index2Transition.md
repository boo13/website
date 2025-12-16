# Zoom-In Transition Effect: Latest → About Section

## Overview
Transform the transition between the "Latest" and "About" sections from a simple scroll-snap to a cinematic zoom-through-video effect. The user scrolls down, triggering a zoom into the video with blur and fade-to-black, then emerging through to reveal the About text with a de-blur effect.

## Progress

- [x] Added ScrollTrigger CDN after GSAP core and before CSSRulePlugin in `index2.html`; wired new `v2/zoom-transition.js`.
- [x] Wrapped Latest video in `.latest-perspective-container` with 3D/perspective styling and GPU hints; set About section background/z-index for coverage.
- [x] Implemented ScrollTrigger timeline using window/body as scroller, with mobile-tuned scale/blur, reduced-motion fade fallback, start at `bottom bottom`, and snap temporarily disabled while pinned; global snap currently off to unblock scrolling (to re-tune later). Body/HTML now min-height (not fixed height) to allow pin spacing and normal scrolling.
- [ ] Additional refinements (snap handling beyond basic disable/restore, Safari/mobile trims, video readiness guard) remain to do; see “Additional Refinements.”

## Current State Analysis

### Architecture
- **Scrolling**: Pure CSS snap-scroll (`scroll-snap-type: y mandatory`)
- **Libraries**: GSAP 3.12.4 + CSSRulePlugin loaded
- **No ScrollTrigger**: Not currently loaded, will need to add
- **Latest Section**: Video with gradient overlay, content positioned with z-index
- **About Section**: Standard text layout with fade-up animations
- **Scroller**: Both `body` and `#website-container` set to `overflow-y: scroll`; need to target the real scroller for ScrollTrigger

### Key Files
- `index2.html` - HTML structure
- `css/styles2.css` - Latest section styles
- `v2/styles.css` - Global styles including snap-scroll
- `v2/scripts.js` - Current slideshow logic
- `v2/video.js` - Minimal video event handling

## Implementation Plan

### Phase 1: Add GSAP ScrollTrigger Plugin

**Goal**: Enable scroll-driven animations with precise control

**Tasks**:
1. Add ScrollTrigger CDN to index2.html before CSSRulePlugin and custom scripts (after GSAP core):
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/ScrollTrigger.min.js" defer></script>
   ```
2. Verify load order: GSAP core → ScrollTrigger → CSSRulePlugin → custom scripts

**Rationale**: ScrollTrigger is the industry-standard solution for scroll-based animations with GSAP, providing smooth interpolation and precise scroll position tracking.

### Phase 2: Restructure Latest Section for 3D Transform

**Goal**: Prepare the video and content layers for z-axis animation

**Tasks**:
1. Wrap video container in a 3D transform context:
   ```html
   <section id="latest" class="latest-randy">
     <div class="latest-perspective-container">
       <div class="latest-video-wrapper">
         <!-- existing video + gradient -->
       </div>
     </div>
     <div class="latest-content">
       <!-- existing content -->
     </div>
   </section>
   ```

2. Add CSS for 3D perspective (in `css/styles2.css`):
   ```css
   .latest-perspective-container {
     position: absolute;
     inset: 0;
     perspective: 1000px;
     perspective-origin: center center;
     overflow: hidden;
   }

   .latest-video-wrapper {
     transform-style: preserve-3d;
     transform-origin: center center;
     will-change: transform, filter, opacity;
   }
   ```

**Rationale**:
- `perspective` creates realistic depth for z-axis movement
- `will-change` optimizes GPU acceleration
- `transform-style: preserve-3d` maintains 3D space through nested elements

### Phase 3: Create Zoom Transition Animation

**Goal**: Implement the core zoom-in effect with blur and fade

**Tasks**:
1. Create new file: `v2/zoom-transition.js`

2. Implement ScrollTrigger animation:
   ```javascript
   // Register ScrollTrigger
   gsap.registerPlugin(ScrollTrigger);

   // Zoom transition configuration
   const ZOOM_CONFIG = {
     scaleFrom: 1,
     scaleTo: window.innerWidth < 768 ? 2.0 : 2.5, // softer on mobile
     blurMax: window.innerWidth < 768 ? 12 : 20,   // pixels; lower on mobile
     duration: 1.5,       // seconds of scroll "scrubbing"
     easing: 'power2.inOut'
   };

   const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

   function initZoomTransition() {
     const videoWrapper = document.querySelector('.latest-video-wrapper');
     const latestContent = document.querySelector('.latest-content');
     const aboutSection = document.querySelector('#about');
     const scroller = document.querySelector('#website-container') || window;

     if (!videoWrapper || !aboutSection) return;

     if (prefersReducedMotion) {
       gsap.to(videoWrapper, { opacity: 0, duration: 0.3 });
       gsap.fromTo('#about', { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.2 });
       return;
     }

     // Create timeline for synchronized animations
     const tl = gsap.timeline({
       scrollTrigger: {
         trigger: '#latest',
         start: 'bottom bottom',      // Start when bottom of Latest hits bottom of viewport
         end: 'bottom top',            // End when bottom of Latest hits top of viewport
         scrub: 1.2,                   // Smooth scrubbing with slight lag
         pin: true,                    // Pin Latest section during animation
         anticipatePin: 1,             // Prevent flashing
         invalidateOnRefresh: true,    // Recalculate on resize
         scroller                      // ensure we pin the correct scroll container
       }
     });

     // 1. Zoom and blur the video
     tl.to(videoWrapper, {
       scale: ZOOM_CONFIG.scaleTo,
       filter: `blur(${ZOOM_CONFIG.blurMax}px)`,
       ease: ZOOM_CONFIG.easing,
       duration: 1
     }, 0);

     // 2. Fade video to black (via gradient overlay)
     tl.to('.latest-gradient', {
       background: 'rgba(0, 0, 0, 1)',
       ease: 'power2.in',
       duration: 0.7
     }, 0.3);  // Start slightly after zoom begins

     // 3. Fade out Latest content
     tl.to(latestContent, {
       opacity: 0,
       y: -30,  // Subtle upward movement
       ease: 'power2.in',
       duration: 0.5
     }, 0);

     // 4. Fade in About section with de-blur effect
     tl.fromTo('#about',
       {
         opacity: 0,
         filter: 'blur(15px)',
         y: 100
       },
       {
         opacity: 1,
         filter: 'blur(0px)',
         y: 0,
         ease: 'power2.out',
         duration: 0.8
       },
       0.6  // Start as fade-to-black completes
     );
   }

   // Initialize on DOM ready
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', initZoomTransition);
   } else {
     initZoomTransition();
   }
   ```

3. Add script reference in `index2.html` after other scripts:
   ```html
   <script src="v2/zoom-transition.js" defer></script>
   ```

**Rationale**:
- **scrub: 1.2** creates buttery-smooth scroll-linked animation with slight elasticity
- **pin: true** holds Latest section in place while animation plays
- **Staggered timing** (0, 0.3, 0.6) creates layered reveal effect
- **power2.inOut/in/out** provides professional easing curves
- **scale: 2.5** is aggressive enough to feel immersive without distortion
- **blur: 20px** creates dreamlike tunnel effect

### Phase 4: Adjust CSS for Pinning Compatibility

**Goal**: Ensure sections work correctly with ScrollTrigger pinning

**Tasks**:
1. In `v2/styles.css`, ensure smooth scroll but plan to relax snap during pin if needed:
   ```css
   body {
     /* Keep existing styles but add: */
     scroll-behavior: smooth;
   }
   ```

2. Add spacer styles for ScrollTrigger pin-spacer in `css/styles2.css`:
   ```css
   .pin-spacer {
     /* ScrollTrigger adds this automatically, but we ensure it fits our layout */
     display: block !important;
   }
   ```

3. Ensure About section has proper starting state:
   ```css
   #about {
     position: relative;
     z-index: 3; /* Above pinned Latest section */
     background: #000; /* Solid background to cover video */
   }
   ```

**Rationale**: ScrollTrigger's pinning creates temporary spacers; we need to ensure they don't break the snap-scroll flow.

### Phase 5: Fine-Tune Animation Timing & Easing

**Goal**: Polish the effect to perfection

**Tasks**:
1. Add custom easing curve for zoom (optional enhancement):
   ```javascript
   // In zoom-transition.js
   gsap.registerPlugin(ScrollTrigger, CustomEase);

   // Create custom "zoom tunnel" ease
   CustomEase.create("zoomTunnel", "0.76, 0, 0.24, 1");

   // Use in timeline:
   ease: 'zoomTunnel'
   ```

2. Add viewport-based scale adjustments:
   ```javascript
   const scaleTo = window.innerWidth < 768 ? 2.0 : 2.5; // Less zoom on mobile
   ```

3. Implement reduced motion support:
   ```javascript
   if (prefersReducedMotion) {
     // Fallback to simple fade transition
     tl.to(videoWrapper, { opacity: 0, duration: 0.3 });
     tl.to('#about', { opacity: 1, duration: 0.3 }, 0.3);
   }
   ```

**Rationale**:
- Custom easing creates signature feel
- Mobile optimization prevents performance issues
- Accessibility compliance for motion sensitivity

### Phase 6: Performance Optimization

**Goal**: Ensure 60fps animation on all devices

**Tasks**:
1. Add GPU acceleration hints:
   ```css
   .latest-video-wrapper {
     transform: translateZ(0); /* Force GPU layer */
     backface-visibility: hidden; /* Prevent flickering */
   }
   ```

2. Optimize blur rendering with backdrop-filter fallback:
   ```javascript
   // In zoom-transition.js, detect if filter: blur is expensive
   const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)');
   const blurProperty = supportsBackdropFilter ? 'backdrop-filter' : 'filter';
   ```

3. Debounce resize handlers:
   ```javascript
   let resizeTimeout;
   ScrollTrigger.addEventListener('refresh', () => {
     clearTimeout(resizeTimeout);
     resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 250);
   });
   ```

**Rationale**:
- GPU acceleration is critical for smooth transforms
- Blur is computationally expensive; optimizations prevent jank
- Debouncing prevents layout thrashing on window resize

### Phase 7: Maintain Standard Transitions for Other Sections

**Goal**: Ensure Work and Contact sections retain normal scroll-snap behavior

**Tasks**:
1. Verify no interference by adding ScrollTrigger only to Latest→About:
   ```javascript
   // In zoom-transition.js
   // Only target #latest specifically, not other sections
   ```

2. Test scroll-snap behavior between About→Work and Work→Contact:
   - Should remain instant snap-scroll
   - No pinning or animation
   - Native browser behavior

3. Add fallback CSS if JS fails to load:
   ```css
   /* In css/styles2.css */
   @supports not (transform: translateZ(0)) {
     /* Fallback for older browsers */
     .latest-video-wrapper {
       position: static;
     }
   }
   ```

**Rationale**: Only the Latest→About transition should be special; other sections stay simple for performance and contrast.

## Testing Checklist

### Functional Tests
- [ ] Zoom effect triggers when scrolling from Latest to About
- [ ] Video scales smoothly from 1x to 2.5x
- [ ] Blur increases from 0 to 20px during zoom
- [ ] Gradient fades to pure black (rgba(0,0,0,1))
- [ ] Latest content (h1, subtitle, icons) fades out
- [ ] About text emerges with de-blur effect
- [ ] About section has solid black background (no video bleeding)
- [ ] Transition is reversible (scroll up reverses animation)
- [ ] Other sections (Work, Contact) use normal scroll-snap

### Performance Tests
- [ ] 60fps on desktop (Chrome DevTools Performance tab)
- [ ] 30fps minimum on mobile devices
- [ ] No layout shifts (CLS = 0)
- [ ] GPU layers created (check in DevTools Layers panel)
- [ ] Memory usage stable (<50MB increase during transition)

### Browser Compatibility
- [ ] Chrome 90+ (primary target)
- [ ] Safari 14+ (WebKit blur rendering)
- [ ] Firefox 88+ (Gecko transform handling)
- [ ] Mobile Safari iOS 14+ (touch scrolling)
- [ ] Chrome Mobile (Android)

### Accessibility
- [ ] Reduced motion fallback works (simple fade)
- [ ] Keyboard navigation unaffected (Tab, Arrow keys)
- [ ] Screen reader announces section changes
- [ ] No epilepsy triggers (blur/flashing checked)

### Edge Cases
- [ ] Viewport resize during transition
- [ ] Fast scrolling (snap vs. scrub balance)
- [ ] Page refresh mid-transition
- [ ] Back button from another page
- [ ] Slow network (video not loaded yet)

## Success Criteria

1. **Visual Impact**: Transition feels cinematic and immersive, like diving into the video
2. **Smoothness**: No jank, stuttering, or frame drops on target devices
3. **Naturalness**: Timing feels organic, not too fast or slow
4. **Elegance**: Blur and fade effects are subtle but noticeable
5. **Polish**: De-blur reveal of About text feels intentional and refined
6. **Performance**: No negative impact on page load or scroll performance elsewhere

## Rollback Plan

If issues arise:
1. Remove `<script>` tag for `v2/zoom-transition.js` from index2.html
2. Revert CSS changes to `.latest-video-wrapper` (remove 3D transforms)
3. Site returns to original scroll-snap behavior
4. All changes are isolated to new files (zoom-transition.js, minor CSS additions)

## Estimated Complexity

- **Phase 1-2**: Low (setup, ~30 min)
- **Phase 3**: Medium-High (core animation logic, ~2-3 hours)
- **Phase 4-5**: Medium (CSS adjustments, fine-tuning, ~1-2 hours)
- **Phase 6**: Medium (optimization, ~1 hour)
- **Phase 7**: Low (verification, ~30 min)
- **Testing**: High (cross-browser, performance, ~2-3 hours)

**Total**: ~8-11 hours for production-quality implementation

## Dependencies

- GSAP 3.12.4 (already loaded)
- ScrollTrigger plugin (new, CDN)
- CSSRulePlugin (already loaded)
- Modern browser with CSS `filter` support
- GPU acceleration support for smooth transforms

## Notes

- This is a **premium effect** that requires careful tuning; not a quick hack
- The `scrub` value (1.2) is the "feel" knob—adjust this first during testing
- Consider adding a loading spinner if video isn't ready (v2/video.js integration)
- Future enhancement: Add particle effects during zoom (stars, light streaks) for extra wow factor
- The blur tunnel effect is inspired by sci-fi "warp tunnel" transitions

## References

- GSAP ScrollTrigger Docs: https://greensock.com/docs/v3/Plugins/ScrollTrigger
- CSS `filter: blur()` performance: https://web.dev/blur-performance
- 3D transforms best practices: https://3dtransforms.desandro.com/perspective

## Additional Refinements (after basic version works)

- Safari/mobile safety rails: cap scale/blur further on Safari (e.g., 1.6–1.8 scale, 8–10px blur) and shorten duration if jank appears.
- Snap interplay: if both `body` and `#website-container` have snap, disable snap on the inactive scroller and temporarily relax snap on the active scroller during pin:
  ```js
  const scrollerEl = document.querySelector('#website-container');
  const originalSnap = scrollerEl?.style.scrollSnapType;
  ScrollTrigger.addEventListener('refreshInit', () => {
    if (scrollerEl) scrollerEl.style.scrollSnapType = 'none';
  });
  ScrollTrigger.addEventListener('refresh', () => {
    if (scrollerEl) scrollerEl.style.scrollSnapType = originalSnap || 'y mandatory';
  });
  ```
- Video readiness: guard the transition if the video isn’t ready—fallback to a simple fade or a poster frame until `canplaythrough` fires.
