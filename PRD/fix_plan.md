# Portfolio Homepage Redesign - Implementation Plan

## Status: READY FOR BROWSER TESTING

## Completed
- [x] Analyzed existing v4 implementation (CinematicZoom.js, parallax-test.html)
- [x] Identified available assets (Wyatt layers, video, portfolio images)

## Phase 1: Core Structure ✅
- [x] Create index2.html with semantic HTML structure
- [x] Create css/index2.css for new homepage
- [x] Create js/hero-zoom.js for z-depth transitions
- [x] Hero video integration (LandingPageMontagev04.2.webm)

## Phase 2: Wyatt Earp Section ✅
- [x] Create js/parallax.js for rack-focus effect
- [x] Integrate Wyatt_Layer01_v01.png (background)
- [x] Integrate Wyatt_Layer02_v01.png (foreground)
- [x] Implement blur timeline (BG 6px→0, FG 0→5px)
- [x] Add Netflix logo, title, pull quotes

## Phase 3: Horizontal Scroll Gallery ✅
- [x] Create js/gallery.js for horizontal scroll
- [x] 3 featured works with hover video playback
- [x] Card size: ~60vw x 70vh
- [x] Network logos, thumbnails, metadata

## Phase 4: Additional Credits ✅
- [x] Create js/credits.js for hover preview
- [x] Table layout: Title, Network columns
- [x] Cursor-following image preview
- [x] 10 credits from resume

## Phase 5: About Section ✅
- [x] Scroll-reveal stats (15+ years, 20M+ views, etc.)
- [x] Network logo marquee (auto-scroll)
- [x] Full Resume CTA

## Phase 6: Contact Section ✅
- [x] Location, email, LinkedIn, Vimeo
- [x] "Let's make something" CTA

## Current Focus
- [x] Initial implementation complete
- [x] Fixed gallery horizontal scroll (GSAP pin-based)
- [x] Added mobile responsive styles (tablet/mobile breakpoints)
- [x] Gallery converts to vertical scroll on mobile
- [x] Parallax simplified on mobile devices
- [x] Code review complete (JS, CSS, asset URLs verified)
- [ ] Browser testing (manual)
- [ ] Performance profiling (manual)

## Performance Targets
- FCP: <1.5s
- LCP: <2.5s
- CLS: <0.1
- 60fps animations

## Files Created
- index2.html (main page)
- css/index2.css (styles)
- js/hero-zoom.js (hero animation)
- js/parallax.js (Wyatt Earp rack-focus)
- js/gallery.js (horizontal scroll)
- js/credits.js (hover preview + stats reveal)

## Notes
- Using GSAP 3.12+ with ScrollTrigger
- Leveraging patterns from v4/CinematicZoom.js
- Mobile: simplified transitions, static thumbnails
