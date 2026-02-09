# Requirements: Randy Counsman Portfolio

**Defined:** 2026-02-09
**Core Value:** The work speaks for itself — every design decision exists to showcase Randy's video production work and make it effortless for recruiters to see what he's done and get in touch.

*v1 = existing bare-bones index.html. v2 = index2.html, the full portfolio being built now. v3 = future enhancements.*

## v2 Requirements

Requirements for index2.html — the full editorial portfolio site.

### Hero / Landing

- [ ] **HERO-01**: Hero reel autoplays muted on page load with seamless loop
- [ ] **HERO-02**: "Randy Counsman - Nonfiction Video Development & Production" visible in first viewport
- [ ] **HERO-03**: Loading screen with visual indicator, no white flash, font-ready gating
- [ ] **HERO-04**: Cinematic z-depth or parallax zoom transition on hero section

### About (immediately after hero)

- [ ] **ABOU-01**: Series of punchy scroll-driven statement sections (1-2 lines each)
- [ ] **ABOU-02**: Scroll-driven text reveal animations on about statements
- [ ] **ABOU-03**: Animated phone mockups section — multiple phones at different sizes scroll across screen with parallax (varying speeds/depths), showcasing digital/social work

### Featured Work

- [ ] **WORK-01**: 3-5 curated project cards with thumbnail, title, role, and network/client
- [ ] **WORK-02**: Video lightbox — click project to play video in modal overlay
- [ ] **WORK-03**: Network/client logos displayed on each project card
- [ ] **WORK-04**: Hover video preview on desktop — thumbnail plays clip on hover

### Credits

- [ ] **CRED-01**: Comprehensive credits table rendered from Projects.json
- [ ] **CRED-02**: Cursor-tracking image preview on credit row hover
- [ ] **CRED-03**: Staggered row reveal animation on scroll (IntersectionObserver)

### Animations & Transitions

- [ ] **ANIM-01**: Signature hero zoom/depth animation moment
- [ ] **ANIM-02**: Scroll-driven text mask reveals for key content
- [ ] **ANIM-03**: Choreographed section transitions between major sections
- [ ] **ANIM-04**: Gallery scroll animation (horizontal scroll or animated card transitions)

### CTA

- [ ] **CTA-01**: Inline newsletter signup form with Buttondown integration
- [ ] **CTA-02**: CTA button linking to contact.html

### Mobile & Performance

- [ ] **MOBI-01**: All sections designed for mobile, not just responsive
- [ ] **MOBI-02**: Video playback works correctly on iOS Safari and Android Chrome
- [ ] **PERF-01**: Fast initial load — optimized video assets, smooth loading experience
- [ ] **PERF-02**: Smooth scroll animations without jank on mobile and desktop
- [ ] **ACCS-01**: prefers-reduced-motion respected in all animations
- [ ] **ACCS-02**: Keyboard navigation for video lightbox (Esc to close, arrow keys)

## v3 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Enhancements

- **ENH-01**: Case study pages for featured projects (separate pages, shareable links for job applications)
- **ENH-02**: Stats section (years, views, awards)
- **ENH-03**: Network logo marquee animation
- **ENH-04**: Press quotes section
- **ENH-05**: Social links in hero viewport
- **ENH-06**: Global scroll progress indicator
- **ENH-07**: Video quality selection / adaptive streaming
- **ENH-08**: Project-specific visual treatments for each featured project

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Blog or written content | Focus is on video work, not written editorial |
| CMS or admin panel | Content managed via code and JSON data files |
| User accounts or authentication | Static portfolio, no user system |
| Dark mode toggle | Already dark-default, toggle is overkill |
| Social media feed embed | Curate specific items instead of embedding feeds |
| 3D WebGL effects | Purposeful GSAP animations over spectacle |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | — | Pending |
| HERO-02 | — | Pending |
| HERO-03 | — | Pending |
| HERO-04 | — | Pending |
| ABOU-01 | — | Pending |
| ABOU-02 | — | Pending |
| ABOU-03 | — | Pending |
| WORK-01 | — | Pending |
| WORK-02 | — | Pending |
| WORK-03 | — | Pending |
| WORK-04 | — | Pending |
| CRED-01 | — | Pending |
| CRED-02 | — | Pending |
| CRED-03 | — | Pending |
| ANIM-01 | — | Pending |
| ANIM-02 | — | Pending |
| ANIM-03 | — | Pending |
| ANIM-04 | — | Pending |
| CTA-01 | — | Pending |
| CTA-02 | — | Pending |
| MOBI-01 | — | Pending |
| MOBI-02 | — | Pending |
| PERF-01 | — | Pending |
| PERF-02 | — | Pending |
| ACCS-01 | — | Pending |
| ACCS-02 | — | Pending |

**Coverage:**
- v2 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26

---
*Requirements defined: 2026-02-09*
*Last updated: 2026-02-09 after initial definition*
