# Project Research Summary

**Project:** Randy Counsman Portfolio Enhancement
**Domain:** Video producer portfolio (editorial single-page, recruiter-focused)
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

This project enhances an existing GSAP-powered portfolio for a senior-level nonfiction video producer targeting recruiters and collaborators. Research reveals that video producer portfolios differentiate through execution quality and signature moments rather than feature breadth. The critical path is: hero reel (immediate credibility) → featured work with video lightbox (demonstrable range) → comprehensive credits (depth signal) → editorial about section (personality) → contact/newsletter CTA.

The recommended technical approach leverages the existing Vite + GSAP + vanilla JS architecture with strategic additions: GLightbox for video modals (27kb, zero dependencies), tiered video preloading via Intersection Observer, scroll-driven text reveals for editorial content, and Buttondown API for newsletter capture. The site should remain static (GitHub Pages hosting) while delivering high-end animation polish through GSAP plugins (SplitText for typography, Flip for layout transitions) and intelligent video loading strategies.

Key risks center on GitHub Pages constraints (repository size limits with 42MB video assets), mobile autoplay policies (iOS Safari requires muted + playsinline + intersection trigger), and scroll performance (avoid expensive blur filters, limit simultaneous ScrollTrigger pins). Success depends on balancing visual polish with recruiter-focused UX: fast access to credentials, clear project context, and mobile-first video playback. The existing architecture is solid; enhancements should extend patterns (section-based modules, gsap.context() scoping, prefers-reduced-motion support) rather than replace them.

## Key Findings

### Recommended Stack

The existing stack (Vite 7.3.1, GSAP 3.14.2, vanilla JS) is appropriate and should NOT be replaced. Strategic additions complement the architecture without introducing framework complexity or backend dependencies.

**Core additions:**
- **GLightbox ^3.3.0**: Video lightbox — zero dependencies, 27kb, supports YouTube/Vimeo/HTML5, keyboard navigation, mobile gestures, ARIA compliant. Alternative (Fancybox) rejected due to size (120kb) and licensing. Custom build rejected to avoid reinventing complex UX patterns (focus trapping, keyboard nav, video coordination).
- **Native HTML5 video + modern codecs**: WebM (VP9) primary, MP4 (H.264) fallback. DO NOT add video player library (VideoJS, Plyr). Native controls sufficient for portfolio use case. Encoding via FFmpeg (local tool, not npm dependency).
- **Buttondown API via Fetch**: Newsletter integration with native HTML form fallback. Generous free tier (1000 subscribers), simpler than Mailchimp/ConvertKit. API key exposed client-side is acceptable (subscribe-only scope, rate-limited endpoint).
- **GSAP SplitText plugin**: For editorial text reveals. Handles word/char splitting with responsive reflow and accessibility concerns. Manual split rejected due to whitespace/wrapping complexity.
- **GSAP Flip plugin**: Free plugin for gallery filtering/sorting transitions. "Record state, change DOM, animate difference" pattern ideal for grid reordering.
- **Sharp ^0.33.0**: Build-time image optimization (WebP/AVIF generation). Node-based, fast, generates responsive variants. Vite plugin alternative rejected for less explicit control.
- **web-vitals ^4.0.0 + Lighthouse CI**: Runtime performance tracking (LCP/FID/CLS) and build-time regression testing. Critical for video-heavy site.

**What NOT to add:**
- Frameworks (React/Vue/Svelte) — GSAP works beautifully without framework overhead
- State management (Redux/Zustand) — minimal state (lightbox open/closed), DOM is state store
- CSS-in-JS — standard CSS via Vite is sufficient
- Testing libraries — manual QA + Lighthouse CI sufficient for portfolio scale
- Video player libraries — native HTML5 handles requirements
- UI component libraries (Bootstrap/Tailwind) — custom editorial aesthetic

### Expected Features

Video producer portfolios targeting recruiters have narrow table stakes but differentiate through execution quality and signature moments. Missing a feature is less damaging than poor execution (recruiters forgive missing blog, not slow video loading).

**Must have (table stakes):**
- Hero reel with autoplay (muted) and fast load — immediate proof of production quality
- Project showcase (3-10 curated) with video playback in lightbox — demonstrates range, shows client/network logos
- Network/client logos — social proof establishes credibility instantly
- Comprehensive credits list — shows depth beyond featured work
- Clear contact method — email + LinkedIn minimum
- Mobile responsive — 40-60% of recruiter traffic is mobile
- Fast load time (<3s) — recruiters bounce at blank screen

**Should have (differentiators):**
- Signature animation moments — z-depth hero, parallax storytelling, scroll reveals (GSAP-powered)
- Project-specific visual treatments — custom layout/animation per featured work (e.g., Wyatt Earp parallax)
- Hover video previews — gallery cards + credits cursor preview
- Stats with credibility — "20M+ views" "Emmy Nominated" with scroll-triggered counters
- Editorial copywriting — punchy statements vs resume-speak
- Network logo marquee — animated horizontal scroll (visually dynamic)
- About section with personality — scroll-driven reveals tied to work examples
- Scroll progress indicators — reduces "how long is this?" anxiety

**Defer to v2+:**
- Case study pages — deep-dive process/outcomes per project
- Video quality selection — adaptive streaming (sufficient for portfolio scale)
- Dark mode toggle — already dark-default, toggle is overkill
- Share functionality — individual project sharing for award submissions

**Anti-features (deliberately avoid):**
- Auto-playing audio — instant bounce, accessibility nightmare
- Full-length videos inline — page becomes unwieldy
- Splash screen "Enter Site" — extra click before value, dated
- Background music — distracting, assumes private viewing
- Elaborate 3D WebGL intro — high bounce rate from loading
- Pop-up newsletter on entry — interrupts before providing value
- Paginated project grid — disrupts single-page flow

### Architecture Approach

The existing section-based ES module architecture is solid and should be extended, not replaced. Each scroll section exports `initSectionName()` wrapped in `gsap.context()` scoped to section element, with centralized plugin registration in `scroll-defaults.js` and no shared state between sections.

**Major components to add:**

1. **VideoLightbox** (`src/components/video-lightbox.js`) — Modal playback with controls, keyboard navigation (Esc/arrows), URL hash routing (#video=project-id), prev/next navigation. Lives outside scroll flow (position: fixed) to prevent z-index battles with pinned sections. Singleton pattern, self-initializing, triggered from gallery/credits sections.

2. **VideoPreloader** (`src/components/video-preloader.js`) — Tiered loading strategy:
   - Tier 1 (Critical): Hero video, immediate load via `<link rel="preload">`
   - Tier 2 (Near-viewport): Gallery videos, Intersection Observer with rootMargin: "100%"
   - Tier 3 (On-demand): Lightbox videos, load on click with loading state
   - Tier 4 (Deferred): Idle-time preload via requestIdleCallback()

3. **ScrollRevealText** (`src/animations/scroll-reveal-text.js`) — Utility for scroll-triggered text reveals in about section. ScrollTrigger + GSAP from/to animations. Alternative to SplitText for simpler line-by-line reveals.

4. **NewsletterForm** (`src/components/newsletter-form.js`) — Email capture with validation, Buttondown API integration, loading/success/error states. Progressive enhancement: HTML form works without JS, Fetch adds AJAX submission.

**Integration with existing pattern:**
- All components follow gsap.context() scoping for automatic cleanup
- VideoPreloader instantiated per-section, cleaned up in section's return function
- VideoLightbox singleton, imported in main.js for side effects
- ScrollRevealText utility called from sections, returns cleanup function
- Modified files: main.js (lightbox import), gallery.js (preloader + lightbox triggers), credits.js (lightbox triggers), about.js (scroll reveals + newsletter)

**Video asset strategy:**
- Current: 42MB in public/video/, GitHub Pages hosting
- Sustainable: ~4,700 visits/month within 100GB bandwidth limit
- Migration trigger: If bandwidth >80GB/month, move to Cloudflare Pages (500GB free tier)
- Format: WebM (VP9) primary + MP4 (H.264) fallback for Safari compatibility
- Current gap: Only WebM files present, need MP4 fallbacks

**Performance targets:**
- Desktop Lighthouse: Performance 90+, Accessibility 100
- Mobile Lighthouse: Performance 80+ (video impacts this)
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s

### Critical Pitfalls

Research identified 14 pitfalls across critical/moderate/minor severity. Top 5 most impactful:

1. **GitHub Pages Repository Size Blowout** — Video files accumulate in git history, repo exceeds limits. Current state: 42MB in public/video/ with multiple versions (v04, v04.2, v05). Prevention: Use Git LFS for *.webm/*.mp4 BEFORE adding more videos, keep iterations in cloud storage (not repo), audit file sizes before commits. Phase 1 priority.

2. **Mobile Autoplay Policy Violation** — Hero video doesn't autoplay on iOS Safari, users see black screen. Current state: Has autoplay muted playsinline (good) but no fallback if blocked. Prevention: Progressive enhancement (poster works standalone), play on scroll intersection (50% visible), detect autoplay support with dummy video, fallback to animated poster if blocked. Phase 2 priority.

3. **ScrollTrigger Video Jank on Mobile** — Scroll animations stutter, video playback drops frames. Current risk: landing.js uses ScrollTrigger with scrub + blur filter (expensive GPU operation). Prevention: Remove blur filter during scroll (use static blur on poster), limit simultaneous pins, use will-change sparingly, mobile-specific scrub values (less smooth but better perf), lazy-load below-fold ScrollTriggers. Phase 3 priority.

4. **Video Preload Bandwidth Waste** — All videos preload on page load, mobile users consume 50MB+ before scroll. Current state: Mixed (gallery has preload="none", but hero has eager <link rel="preload">). Prevention: Tier-based loading via Intersection Observer (see Architecture section). Phase 2 priority.

5. **Recruiter UX Mismatch** — Site optimized for creative directors, recruiters bounce because key info hidden. Current risk: Animations before credits, resume requires scrolling through sections. Prevention: Fast-access resume link (nav or hero), 1-sentence project descriptions on cards, skip-to-credits jump link, print-friendly resume page, SEO for show names. Phase 4 priority.

**Other notable pitfalls:**
- **Video format compatibility** — Only WebM, Safari needs MP4 fallback (Phase 1)
- **Accessibility with video** — No pause controls for decorative videos, missing captions (Phase 5)
- **Vimeo embed performance** — Each iframe adds 500KB, use thumbnail facade instead (Phase 2)
- **Mobile video orientation** — Widescreen videos waste screen on portrait, need 9:16 variants (Phase 2)

## Implications for Roadmap

Based on combined research, recommend 5-phase structure balancing technical dependencies with recruiter-focused value delivery.

### Phase 1: Video Infrastructure & Assets
**Rationale:** Foundational work must happen before building features that consume videos. GitHub Pages size limits are imminent concern (42MB already in repo). Establishing video formats, encoding pipeline, and Git LFS prevents painful migration later.

**Delivers:**
- Git LFS configuration for video files
- MP4 fallbacks for all WebM videos (Safari compatibility)
- Portrait (9:16) variants for mobile hero reel
- FFmpeg encoding scripts for consistent output
- Image optimization pipeline (Sharp script)
- projects.json verification (all videos have entries)

**Addresses (from FEATURES.md):**
- Table stakes: Fast load time (optimized encodes)
- Table stakes: Mobile responsive (portrait variants)

**Avoids (from PITFALLS.md):**
- Pitfall 1: Repository size blowout
- Pitfall 7: Video format compatibility
- Pitfall 12: Mobile orientation issues

**Research flag:** Standard patterns (FFmpeg encoding well-documented, Git LFS standard). Skip /gsd:research-phase.

---

### Phase 2: Video Playback & Lightbox
**Rationale:** Lightbox is core feature (table stakes for project showcase) and has dependencies on video loading strategy. Build loading infrastructure first (VideoPreloader), then lightbox that consumes it. This phase delivers immediate recruiter value (watchable portfolio).

**Delivers:**
- VideoPreloader component (tiered loading strategy)
- VideoLightbox component (GLightbox integration)
- Gallery card → lightbox triggers
- Credits table → lightbox triggers
- URL hash routing (#video=project-id)
- Keyboard navigation (Esc/arrows)
- Mobile autoplay fallback (intersection-based play triggers)
- Loading states for buffering videos

**Addresses (from FEATURES.md):**
- Table stakes: Video playback controls
- Table stakes: Project showcase with video in lightbox
- Differentiator: Hover video previews (gallery cards)

**Avoids (from PITFALLS.md):**
- Pitfall 2: Mobile autoplay policy violation
- Pitfall 4: Video preload bandwidth waste
- Pitfall 6: Vimeo embed performance trap (using GLightbox + native video)
- Pitfall 14: Hover video on touch devices (intersection fallback)

**Uses (from STACK.md):**
- GLightbox ^3.3.0
- Intersection Observer API (native)
- Native HTML5 video

**Implements (from ARCHITECTURE.md):**
- VideoLightbox (singleton pattern, portal approach)
- VideoPreloader (per-section instantiation)

**Research flag:** Medium complexity. GLightbox integration with ScrollTrigger may need experimentation (pause scroll, disable triggers). Consider short spike task to verify no conflicts.

---

### Phase 3: Scroll Performance & Polish
**Rationale:** After core video features work, optimize for mobile and animation quality. This phase addresses jank identified in pitfalls research and ensures signature animation moments land without performance cost.

**Delivers:**
- Remove blur filters from scroll animations (landing.js)
- Mobile-specific scrub values for ScrollTriggers
- GPU layer promotion (will-change, translate3d)
- Lazy initialization of below-fold ScrollTriggers
- Font loading detection (document.fonts.ready)
- Scroll height recalculation on resize
- Section transition choreography (parallax complete → gallery intro)
- Performance profiling (Chrome DevTools, Lighthouse)

**Addresses (from FEATURES.md):**
- Differentiator: Signature animation moments (ensure smooth execution)
- Table stakes: Mobile responsive (jank-free animations)

**Avoids (from PITFALLS.md):**
- Pitfall 3: ScrollTrigger video jank on mobile
- Pitfall 8: Scroll height miscalculation
- Pitfall 13: Video loop stutter

**Research flag:** Needs device testing (not just DevTools throttling). Cannot fully validate without real mobile hardware. Flag for manual QA phase.

---

### Phase 4: Editorial Content & Recruiter UX
**Rationale:** With technical foundation solid, focus on content that converts recruiters. About section with scroll reveals, newsletter capture, fast-access resume, project descriptions. This phase maximizes differentiation through editorial voice.

**Delivers:**
- ScrollRevealText animation utility
- About section content (punchy statements, scroll-triggered reveals)
- Stats section with scroll-triggered counters
- Newsletter form component (Buttondown API)
- Newsletter form placement (contact or about section)
- Project descriptions on gallery cards (1-sentence context)
- Fast-access resume link (nav or hero)
- Skip-to-credits jump link (accessibility + recruiter UX)
- SEO optimization (structured data for video objects, project names)

**Addresses (from FEATURES.md):**
- Differentiator: Editorial copywriting
- Differentiator: About section with personality
- Differentiator: Stats with credibility
- Should have: Newsletter signup

**Avoids (from PITFALLS.md):**
- Pitfall 5: Recruiter UX mismatch

**Uses (from STACK.md):**
- Buttondown API (native Fetch)
- GSAP SplitText (if budget allows, otherwise ScrollRevealText utility)

**Implements (from ARCHITECTURE.md):**
- ScrollRevealText utility
- NewsletterForm component

**Research flag:** Newsletter API integration needs early verification (spike task). Buttondown CORS policy and API key client-side exposure should be tested before committing to this approach.

---

### Phase 5: Accessibility & Launch Readiness
**Rationale:** Final polish and validation before launch. Accessibility is not optional (legal requirement + brand reputation), but can come after core features built. This phase ensures production-ready state.

**Delivers:**
- Pause controls for autoplay videos (hidden UI, keyboard accessible)
- Captions for demo reel videos (nonfiction requires dialogue/narration)
- Skip links for long scroll sections
- Focus management (gallery keyboard navigation)
- ARIA landmarks and labels
- Color contrast audit
- Screen reader testing
- Reduced motion fallback verification
- Cross-browser testing (Chrome, Firefox, Safari, iOS Safari, Android Chrome)
- Lighthouse audit (all 4 metrics: Performance, Accessibility, Best Practices, SEO)
- Print-friendly resume page (separate from scroll experience)

**Addresses (from FEATURES.md):**
- Differentiator: Keyboard navigation
- Table stakes: Mobile responsive (verified across devices)

**Avoids (from PITFALLS.md):**
- Pitfall 9: Accessibility with video content
- Pitfall 11: Loading state flicker (if observed)

**Research flag:** Standard patterns (WCAG compliance well-documented). Skip /gsd:research-phase. Use automated tools (axe DevTools, Lighthouse) plus manual testing.

---

### Phase Ordering Rationale

**Why this order:**
1. **Phase 1 before all others** — Git LFS must be configured BEFORE more videos added (retroactive LFS migration is painful). Video encoding pipeline establishes quality/format standards for phases 2-4.
2. **Phase 2 before 3** — Cannot optimize scroll performance until video playback implemented (need real performance data, not speculation). Lightbox is highest complexity component; tackle while fresh.
3. **Phase 3 before 4** — Editorial content animations (scroll reveals) benefit from performance optimizations established in Phase 3. Don't add more ScrollTriggers until existing ones optimized.
4. **Phase 4 independent of 5** — Accessibility can happen in parallel with content IF resources available, but typically better to feature-complete first, then audit.
5. **Phase 5 last** — Accessibility testing most effective when all features complete (avoid re-testing after each feature addition).

**Dependencies:**
- Phase 2 depends on Phase 1 (video assets ready)
- Phase 3 depends on Phase 2 (need video animations to optimize)
- Phase 4 depends on Phase 3 (scroll reveal utility benefits from perf work)
- Phase 5 depends on Phases 1-4 (testing complete feature set)

**Groupings avoid pitfalls:**
- Phase 1 prevents repository size blowout before it happens
- Phase 2 addresses mobile autoplay early (high-impact recruiter UX issue)
- Phase 3 prevents scroll jank from compounding as features added
- Phase 4 ensures recruiter value before launch (not just technical completeness)
- Phase 5 catches accessibility gaps before production

### Research Flags

**Phases needing deeper research:**
- **Phase 2 (Video Playback):** GLightbox + ScrollTrigger integration may need spike task. Test: Does lightbox opening/closing cause ScrollTrigger conflicts? How to pause scroll during video viewing? Library unknown to researcher, verify API compatibility.
- **Phase 4 (Newsletter):** Buttondown API client-side exposure needs verification. Test: CORS policy, rate limiting, error handling, fallback if API unreachable. Early spike recommended.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Video Infrastructure):** FFmpeg encoding, Git LFS, Sharp image optimization all well-documented. Established patterns, no novel integration.
- **Phase 3 (Scroll Performance):** GSAP optimization patterns documented in GreenSock forums, Chrome DevTools profiling standard. Manual testing required but no research needed.
- **Phase 5 (Accessibility):** WCAG compliance well-documented, automated tools (axe, Lighthouse) provide clear guidance. Standard audit process.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | GLightbox verified via npm registry (3.3.0 exists), GSAP plugins official, Sharp/web-vitals industry standard. Buttondown API documented but client-side pattern needs validation. |
| Features | HIGH | Existing codebase analysis confirms current implementation, recruiter UX patterns established in creative portfolio domain, table stakes features verified across multiple portfolio examples in training data. |
| Architecture | HIGH | Section-based ES module pattern already proven in codebase, component boundaries align with existing patterns (gsap.context scoping, cleanup functions), video loading strategy follows established Intersection Observer patterns. |
| Pitfalls | MEDIUM | GitHub Pages limits documented, mobile autoplay policies established (but may have evolved since 2025), ScrollTrigger performance issues well-documented in GreenSock community. WebSearch unavailable to verify 2026-specific updates. |

**Overall confidence:** HIGH

Research is based on solid foundation (existing codebase analysis, official documentation, established patterns) with gaps limited to 2026-specific tool availability and API behavior (both verifiable during implementation).

### Gaps to Address

**Verify during implementation:**

1. **GLightbox + ScrollTrigger compatibility** — Training data confirms GLightbox exists and has GSAP-friendly API, but specific integration pattern (pausing ScrollTriggers on lightbox open, preventing scroll during video playback) should be tested early. Spike task recommended: Build minimal lightbox over pinned section, verify no conflicts.

2. **Buttondown client-side API security** — Documentation suggests subscribe endpoint is designed for public use, but verify: (a) CORS policy allows client-side calls, (b) rate limiting sufficient to prevent abuse, (c) error handling for API unreachable. Test with dummy account before production integration.

3. **Mobile autoplay policy changes** — Training cutoff January 2025, mobile autoplay policies may have evolved. Verify on iOS Safari 2026, Android Chrome 2026 that `muted + playsinline + intersection trigger` pattern still works. Manual device testing required.

4. **GitHub Pages LFS pricing** — Git LFS may have usage fees for bandwidth beyond free tier. Verify current pricing, calculate projected costs based on 42MB assets + estimated traffic. Cloudflare Pages migration may be cheaper at scale.

5. **WebM Safari support** — Training data indicates Safari requires MP4 fallback, but WebM support may have improved. Test current Safari desktop/iOS versions. If WebM now universal, can skip MP4 encoding (save 50% asset storage).

**Gaps acceptable for now:**
- Recruiter behavior validation (assumes recruiters prioritize credibility markers, fast access) — validate post-launch with analytics
- Video encoding quality settings (CRF values, bitrate targets) — establish baseline, iterate based on bandwidth/quality metrics
- Performance targets (specific LCP/TBT thresholds) — use Lighthouse defaults, adjust if needed for video-heavy context

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (`/Users/randy/Git/website/`) — index2.html structure, section modules (landing.js, gallery.js, credits.js), GSAP implementation patterns, projects.json schema, current video assets (public/video/), Vite configuration
- **CLAUDE.md and DECISIONS.md** — Technical architecture decisions, content strategy, existing component patterns (ResponsiveVideo, CreditsTable), GSAP conventions
- **GSAP official documentation** — ScrollTrigger API, plugin ecosystem (SplitText, Flip, Observer), performance best practices, mobile considerations
- **GitHub Pages documentation** — Repository size limits (100MB soft, 1GB hard), bandwidth limits (100GB/month), deployment constraints (static only, no backend)

### Secondary (MEDIUM confidence)
- **Training knowledge on video portfolio best practices** (January 2025 cutoff) — Recruiter UX patterns, creative portfolio feature expectations, video optimization strategies, mobile-first design patterns
- **GLightbox GitHub repository** — Feature set, API documentation, ARIA compliance, bundle size (27kb), dependency-free architecture. Version 3.3.0 confirmed available via npm.
- **Buttondown API documentation** — REST API structure, subscribe endpoint, authentication, free tier limits (1000 subscribers), CORS considerations
- **FFmpeg encoding guides** — VP9/H.264 codec settings, 2-pass encoding, CRF recommendations, mobile variant generation
- **Web.dev performance best practices** — Core Web Vitals (LCP/FID/CLS), video optimization, lazy loading patterns, Intersection Observer usage

### Tertiary (LOW confidence, verify during implementation)
- **Browser autoplay policies** (pre-2025 knowledge) — iOS Safari muted+playsinline requirement, Android MEI threshold, Low Power Mode behavior. May have changed in 2026.
- **Video codec browser support** — WebM VP9 97% global support, Safari MP4 requirement. Should verify current Safari versions.
- **Mobile video performance** — Blur filter GPU cost, ScrollTrigger scrub performance on mid-tier devices. Needs real device testing, not just DevTools throttling.
- **Git LFS pricing** — Bandwidth costs beyond free tier. Should verify current GitHub LFS pricing model.

**WebSearch unavailable for 2026 verification:** Recommendations based on established patterns (2023-2025 training data) and codebase analysis. For production confidence, verify: (1) GLightbox current version/API, (2) Buttondown API endpoint stability, (3) Browser autoplay policy updates, (4) Sharp compatibility with Node 18+.

---
*Research completed: 2026-02-09*
*Ready for roadmap: Yes*
