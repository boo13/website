# Roadmap: Randy Counsman Portfolio v2

**Created:** 2026-02-09
**Revised:** 2026-02-09
**Depth:** Standard (5-8 phases)
**Target:** index2.html — full editorial portfolio experience

## Overview

This roadmap delivers a recruiter-focused video portfolio with a design-first approach: build the full page structure/layout roughed in before optimizing any single section. Seven phases transform index2.html into a polished single-page scroll experience. The philosophy is "build to a rough layout of the project before optimizing assets" — video optimization and performance work happen after the page takes shape.

Section order on page: Hero → About → Featured Work → Credits → CTA

Each phase delivers a coherent, verifiable capability. Housekeeping first (extract Wyatt Earp case study), then About section structure (user's starting priority), then rough layouts for remaining sections, then polish/interactivity, and finally optimization and accessibility.

## Phases

### Phase 1: Housekeeping & About Section Structure

**Goal:** Wyatt Earp content extracted cleanly, and About section roughed in with content structure and basic scroll animations.

**Dependencies:** None (foundation work)

**Requirements:**
- HOUSE-01: Extract Wyatt Earp parallax section from index2.html into standalone case_study_wyatt.html, then remove from index2.html
- ABOU-01: Series of punchy scroll-driven statement sections (1-2 lines each)
- ABOU-02: Scroll-driven text reveal animations on about statements
- ABOU-03: Animated phone mockups section — multiple phones at different sizes scroll across screen with parallax (varying speeds/depths), showcasing digital/social work
- ANIM-02: Scroll-driven text mask reveals for key content

**Success Criteria:**
1. Wyatt Earp section exists as standalone case_study_wyatt.html with HTML boilerplate and all assets working
2. Wyatt Earp section removed from index2.html cleanly (no orphaned styles or scripts)
3. About section comes immediately after hero in index2.html with multiple subsections (1-2 punchy lines each)
4. Text reveals animate on scroll (basic fade-in or mask effects) as user progresses through about content
5. Phone mockups section displays multiple phone screens with rough parallax scrolling at different speeds
6. About section structure demonstrates creative personality before featured work

**Notes:**
- Prioritizes user's starting request: extract Wyatt Earp FIRST, then work on About sections
- About section order is critical: Hero → About → Featured Work → Credits → CTA
- Focus on structure and rough animation concepts, not polish
- Phone mockups can use placeholder images initially

---

### Phase 2: Hero Section & Core Animations

**Goal:** Hero section delivers immediate visual impact with autoplay video and signature animation moments.

**Dependencies:** Phase 1 (About structure complete, page order established)

**Requirements:**
- HERO-01: Hero reel autoplays muted on page load with seamless loop
- HERO-02: "Randy Counsman - Nonfiction Video Development & Production" visible in first viewport
- HERO-03: Loading screen with visual indicator, no white flash, font-ready gating
- HERO-04: Cinematic z-depth or parallax zoom transition on hero section
- ANIM-01: Signature hero zoom/depth animation moment
- ANIM-03: Choreographed section transitions between major sections

**Success Criteria:**
1. Hero video autoplays muted on desktop (with fallback handling for blocked autoplay)
2. Loading screen displays immediately with spinner, transitions out after fonts load
3. Hero section has signature z-depth or parallax zoom animation on scroll
4. Title lockup visible and readable in first viewport before/during video playback
5. Section transitions between hero → about → featured work feel choreographed, not abrupt
6. Basic mobile autoplay handling (intersection trigger if needed)

**Notes:**
- Builds on existing landing.js section architecture
- Hero establishes credibility immediately (recruiter table stakes)
- Focus on desktop experience first; mobile refinement in Phase 6
- Video optimization deferred to Phase 7

---

### Phase 3: Featured Work & Credits Rough Layout

**Goal:** Main content sections roughed in with structure, layout, and static content — users can see the page take shape.

**Dependencies:** Phase 2 (hero complete, scroll patterns established)

**Requirements:**
- WORK-01: 3-5 curated project cards with thumbnail, title, role, and network/client
- WORK-03: Network/client logos displayed on each project card
- CRED-01: Comprehensive credits table rendered from Projects.json
- ANIM-04: Gallery scroll animation (horizontal scroll or animated card transitions)
- CTA-01: Inline newsletter signup form with Buttondown integration
- CTA-02: CTA button linking to contact.html

**Success Criteria:**
1. Featured work section displays 3-5 curated project cards with thumbnails and metadata (static layout)
2. Network/client logos visible on each card (establishes credibility)
3. Gallery/horizontal scroll structure roughed in with basic scroll behavior
4. Credits section displays comprehensive filmography from Projects.json (table layout)
5. Newsletter signup form visible in final section with Buttondown integration
6. Contact CTA button prominently displayed linking to contact.html

**Notes:**
- Focus on structure and layout, not interactivity
- Video lightbox and hover previews deferred to Phase 4
- Credits table rendered but without cursor tracking or staggered animation yet
- Newsletter form should work (email capture) but no loading states yet
- Goal: See the full page structure end-to-end

---

### Phase 4: Video Lightbox & Hover Interactivity

**Goal:** Featured work section becomes interactive — users can play videos in lightbox and see hover previews.

**Dependencies:** Phase 3 (featured work layout complete)

**Requirements:**
- WORK-02: Video lightbox — click project to play video in modal overlay
- WORK-04: Hover video preview on desktop — thumbnail plays clip on hover
- ACCS-02: Keyboard navigation for video lightbox (Esc to close, arrow keys)

**Success Criteria:**
1. Clicking a project card opens video in lightbox overlay with playback controls
2. Lightbox supports keyboard navigation (Esc closes, arrow keys navigate between projects)
3. Desktop users see hover video preview on project cards (short clip plays on hover)
4. Lightbox video plays correctly across browsers (Chrome, Safari, Firefox)
5. Video playback controls are accessible and functional

**Notes:**
- Implements VideoLightbox component (GLightbox integration or custom)
- Research flag: GLightbox + ScrollTrigger compatibility (test for conflicts)
- Mobile video playback refinement in Phase 6
- Focus on desktop interaction first

---

### Phase 5: Credits Section Enhancements

**Goal:** Credits section becomes interactive with cursor-tracking previews and scroll reveals.

**Dependencies:** Phase 3 (credits layout complete)

**Requirements:**
- CRED-02: Cursor-tracking image preview on credit row hover
- CRED-03: Staggered row reveal animation on scroll (IntersectionObserver)

**Success Criteria:**
1. Hovering over credit row shows cursor-tracking image preview
2. Image preview follows cursor smoothly across credit rows
3. Credit rows reveal with staggered animation as user scrolls into section
4. Stagger animation uses IntersectionObserver for performance
5. Credits demonstrate breadth beyond featured work (recruiter credibility signal)

**Notes:**
- Extends existing credits.js section architecture
- Cursor-tracking preview pattern already explored in codebase
- Staggered reveal adds polish without heavy performance cost

---

### Phase 6: Mobile Responsive & Scroll Performance

**Goal:** All sections work beautifully on mobile devices with smooth scroll performance.

**Dependencies:** Phases 1-5 (all sections and features implemented)

**Requirements:**
- MOBI-01: All sections designed for mobile, not just responsive
- MOBI-02: Video playback works correctly on iOS Safari and Android Chrome
- PERF-02: Smooth scroll animations without jank on mobile and desktop

**Success Criteria:**
1. All sections adapt to mobile viewport with intentional mobile-first design
2. Hero video autoplays on iOS Safari (with intersection fallback if needed)
3. Featured work video playback works on iOS Safari and Android Chrome
4. Scroll animations maintain smooth performance on mobile devices (30fps+)
5. Mobile-specific scrub values applied where needed for performance
6. Phone mockups section works correctly on mobile (no performance issues)

**Notes:**
- Requires real device testing (iOS Safari, Android Chrome)
- May need to adjust animation timing/complexity for mobile
- Focus on eliminating jank without removing personality
- Video encoding may need mobile-specific variants (portrait orientation for hero)

---

### Phase 7: Optimization & Accessibility Polish

**Goal:** Site is production-ready with optimized assets and full accessibility compliance.

**Dependencies:** Phases 1-6 (all features complete and mobile-tested)

**Requirements:**
- PERF-01: Fast initial load — optimized video assets, smooth loading experience
- ACCS-01: prefers-reduced-motion respected in all animations

**Success Criteria:**
1. All videos have optimized encoding (appropriate bitrate, resolution, format)
2. Git LFS configured and tracking all video files (prevents repository size blowout)
3. Initial page load is fast (3G throttle test passes)
4. All animations respect prefers-reduced-motion (content visible immediately without animation)
5. Lighthouse audit passes (Performance 85+, Accessibility 95+, Best Practices 90+, SEO 95+)
6. ARIA landmarks and labels properly applied to all sections
7. Cross-browser testing complete (Chrome, Firefox, Safari, iOS Safari, Android Chrome)

**Notes:**
- Video optimization happens here, after content is finalized
- FFmpeg encoding scripts documented for consistent quality/format
- Accessibility testing on complete feature set
- Final production validation before launch
- May need Git LFS for video files depending on size

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Housekeeping & About Section Structure | Pending | HOUSE-01, ABOU-01, ABOU-02, ABOU-03, ANIM-02 | 0% |
| 2 - Hero Section & Core Animations | Pending | HERO-01, HERO-02, HERO-03, HERO-04, ANIM-01, ANIM-03 | 0% |
| 3 - Featured Work & Credits Rough Layout | Pending | WORK-01, WORK-03, CRED-01, ANIM-04, CTA-01, CTA-02 | 0% |
| 4 - Video Lightbox & Hover Interactivity | Pending | WORK-02, WORK-04, ACCS-02 | 0% |
| 5 - Credits Section Enhancements | Pending | CRED-02, CRED-03 | 0% |
| 6 - Mobile Responsive & Scroll Performance | Pending | MOBI-01, MOBI-02, PERF-02 | 0% |
| 7 - Optimization & Accessibility Polish | Pending | PERF-01, ACCS-01 | 0% |

**Overall Progress:** 0/27 requirements complete (0%)

---

## Next Steps

1. Review and approve this revised roadmap
2. Begin Phase 1: `/gsd:plan-phase 1`
3. Research may be needed for Phase 4 (video lightbox implementation) and Phase 5 (Buttondown API)

---

*Roadmap created: 2026-02-09*
*Last updated: 2026-02-09 with design-first philosophy (rough layouts before optimization)*
