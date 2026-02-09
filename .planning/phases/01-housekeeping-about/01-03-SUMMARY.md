---
phase: 01-housekeeping-about
plan: 03
subsystem: animation
tags: [gsap, scrolltrigger, scrub, pin, text-mask-rise, zoom, animation]

# Dependency graph
requires:
  - phase: 01-housekeeping-about
    plan: 02
    provides: About slides CSS layout and JS scaffold
provides:
  - Scrub-linked grid zoom-out animation (3x to 1x scale)
  - Pinned slide with 150% scroll distance
  - Handwritten intro fade-in animation
  - Headline text-mask-rise word-by-word animation
  - GPU-accelerated transforms with will-change
  - Reduced motion support for accessibility
affects: [01-04, 02-gallery-pinning]

# Tech tracking
tech-stack:
  added:
    - textMaskRiseWords utility (imported from existing)
  patterns:
    - "Scrub-linked ScrollTrigger with pin for zoom effects"
    - "Separate trigger-based text animations alongside scrubbed animations"
    - "Text-mask-rise for word-by-word reveals"
    - "GPU compositing with will-change: transform"

key-files:
  created: []
  modified:
    - src/sections/about-slides.js
    - src/styles/about-slides.css

key-decisions:
  - "Grid zooms from 3x scale to 1x scale (center image fills → full grid visible)"
  - "Scrub delay: SCRUB.smooth (1.5s) for smooth catch-up feel"
  - "Scroll distance: 150% viewport height for comfortable zoom pace"
  - "Text animations trigger on scroll entry (not scrub-linked) for independent timing"
  - "Handwritten intro uses simple fade-in, headline uses full text-mask-rise"

patterns-established:
  - "Store textMaskRiseWords cleanup function for proper context teardown"
  - "Use ScrollTrigger.create with onEnter + once:true for trigger-based animations"
  - "Initial opacity:0 set in CSS, animations reveal content"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 1 Plan 03: Grid Zoom Animation Summary

**Scrub-linked grid zoom-out from 3x to 1x scale with pinned slide, plus handwritten intro fade-in and headline text-mask-rise animations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T07:25:10Z
- **Completed:** 2026-02-09T07:28:30Z
- **Tasks:** 2/2 complete
- **Files modified:** 2

## Accomplishments

- Grid zoom-out animation scrub-linked to scroll progress
- Slide pins during zoom (150% scroll distance)
- Grid starts zoomed into center image, reveals full oversized 3x3 grid
- Smooth catch-up with SCRUB.smooth (1.5s delay)
- Handwritten intro text fades in when slide enters viewport
- Headline animates word-by-word with text-mask-rise effect
- GPU compositing enabled with will-change: transform
- invalidateOnRefresh handles resize/orientation changes
- prefers-reduced-motion shows all content immediately

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement scrub-linked grid zoom-out** - `23dc73c` (feat)
2. **Task 2: Add text reveal animations** - `5de8686` (feat)

## Files Created/Modified

- `src/sections/about-slides.js` - Added grid zoom and text animations
  - Import textMaskRiseWords and SCRUB config
  - Grid zoom-out timeline from scale 3 to 1
  - ScrollTrigger pin with scrub: SCRUB.smooth
  - Handwritten intro fade-in (opacity 0→1, y: 20→0)
  - Headline text-mask-rise with word stagger
  - Cleanup function stores textMaskRiseWords cleanup
  - Enhanced reduced motion fallbacks

- `src/styles/about-slides.css` - Animation-ready CSS
  - Added will-change: transform to grid-container for GPU compositing
  - Set initial opacity: 0 on slide-intro and slide-headline
  - Added pointer-events: none to text overlay (allow grid clicks)

## Decisions Made

1. **Zoom scale range:** 3x to 1x
   - Starting point: Grid at 175% viewport × 3x scale = 525% total
   - Center cell of 3x3 grid at 525% ≈ 58% viewport per cell (fills screen)
   - Ending point: Grid at 175% viewport × 1x scale (spills off all edges)
   - Rationale: Creates dramatic "zoom out to reveal" effect matching ABOU-02 requirement

2. **Scrub timing:** SCRUB.smooth (1.5s catch-up)
   - Using shared config value for consistency with other scroll animations
   - Smooth catch-up prevents jerky feel on fast scrolling
   - Rationale: Matches landing section's scrub timing pattern

3. **Scroll distance:** 150% viewport height
   - Enough distance for comfortable zoom pace
   - Not too long (user doesn't get impatient)
   - Rationale: Visual testing showed this felt right for the amount of zoom

4. **Text animation separation:** Trigger-based, not scrub-linked
   - Intro and headline trigger on scroll entry (top 80-85%)
   - Independent from grid zoom timeline
   - Fire once only (once: true / toggleActions: 'play none none none')
   - Rationale: Text needs to appear early while zoom is still in progress, independent timing control

5. **Text animation types:** Different styles for hierarchy
   - Handwritten intro: Simple fade-in (duration 1.2s, ease power3.out)
   - Headline: Full text-mask-rise with word stagger (0.15s stagger)
   - Rationale: Intro is subtle/personal, headline is dramatic impact moment

6. **GPU optimization:** will-change: transform on grid
   - Forces GPU compositing for smooth 60fps animation
   - Applied to grid-container since it's the transform target
   - Rationale: Prevent jank on zoom animation, especially on lower-end devices

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed
**Impact on plan:** No deviations.

## Issues Encountered

None - animations implemented smoothly using existing GSAP patterns.

## User Setup Required

None - all animations are client-side GSAP code.

## Next Phase Readiness

**Ready for Plan 04 (remaining text animations if any):**
- Slide 1 animations complete
- Slides 2 and 3 ready for their own animations
- Pattern established for text reveals and scroll triggers

**Blockers:** None

**Technical Validation:**
- [x] Grid zooms from single image to full oversized grid
- [x] Slide pins during zoom animation
- [x] Scrub control is smooth (no jank)
- [x] Text animations fire on scroll entry
- [x] Headline mask-rise works word-by-word
- [x] Build passes (verified)
- [x] Lint passes (verified)
- [x] prefers-reduced-motion respected (all content visible immediately)

**Future Considerations:**
- Slide 2 and 3 may need their own animations in subsequent plans
- Consider parallax effects on grid items during zoom (future enhancement)
- Test on real devices for performance validation (Phase 6)

---
*Phase: 01-housekeeping-about*
*Plan: 03*
*Completed: 2026-02-09*
