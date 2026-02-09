# Domain Pitfalls: Video Portfolio Site

**Domain:** Video producer portfolio (scroll-animated, video-heavy, static hosting)
**Researched:** 2026-02-09
**Confidence:** MEDIUM (based on established patterns, WebSearch unavailable)

## Critical Pitfalls

Mistakes that cause rewrites, major performance issues, or deployment failures.

### Pitfall 1: GitHub Pages Repository Size Blowout

**What goes wrong:** Video files accumulate in git history, repo exceeds 100MB soft limit (or 1GB hard limit), GitHub Pages deployment fails or warns.

**Why it happens:**
- Video files committed directly to repo (`public/video/`)
- Multiple iterations of same video (v01, v02, v03) all tracked in git
- No `.gitattributes` LFS configuration
- Build artifacts (`dist/`) accidentally committed

**Consequences:**
- GitHub warns about repository size
- Pages deployment slows or fails
- Clone/pull operations become painfully slow
- Cannot remove files from history without force-pushing

**Current state:** Already at risk — 42MB in `public/video/` alone, multiple video versions exist (LandingPageMontagev04.webm, v04.2.webm, v05_9x16.webm)

**Prevention:**
1. **Use Git LFS for video files** — track `*.webm`, `*.mp4` with LFS before commit
2. **Video versioning outside repo** — keep iterations in cloud storage, commit only final version
3. **Audit before adding** — check file size, remove old versions when adding new
4. **CDN for large assets** — use Cloudflare R2, Vimeo embed, or similar for hero videos >5MB
5. **Monitor repo size** — `git count-objects -vH` after each video commit

**Detection:**
- `git count-objects -vH` shows size-pack >50MB
- GitHub UI warns "This repository is over its data quota"
- Build times increase noticeably

**Phase to address:** Phase 1 (Video Infrastructure) — establish LFS before more videos added

---

### Pitfall 2: Mobile Autoplay Policy Violation

**What goes wrong:** Hero video doesn't autoplay on mobile Safari/Chrome, users see black screen or poster image.

**Why it happens:**
- iOS requires `muted`, `playsinline`, AND user interaction for autoplay
- Android Chrome blocks autoplay until Media Engagement Index threshold met
- Low Power Mode on iOS disables all autoplay
- Intersection Observer triggers play() too early (before visible)

**Consequences:**
- Hero section shows static poster instead of signature animation
- First impression fails on 40%+ of traffic (mobile recruiters)
- Video memory allocated but never plays (wastes resources)

**Current state:** GOOD — index2.html has `autoplay muted playsinline` on hero video, but no fallback strategy if autoplay blocked

**Prevention:**
1. **Progressive enhancement** — design works with poster image, video is enhancement
2. **Play on scroll intersection** — trigger `video.play()` when element 50% visible
3. **Detect autoplay support** — test with dummy video, show "Tap to play" if blocked
4. **Muted by default** — NEVER require audio for autoplay
5. **Fallback to animated poster** — CSS animation on poster if video fails

**Detection:**
- Test on iPhone Safari (worst case)
- Test with Low Power Mode enabled
- Monitor `video.play()` promise rejections in analytics

**Phase to address:** Phase 2 (Video Playback) — add intersection-based play triggers, fallback UI

---

### Pitfall 3: ScrollTrigger Video Jank on Mobile

**What goes wrong:** Scroll animations stutter, video playback drops frames, UI feels sluggish.

**Why it happens:**
- Multiple ScrollTrigger pins active simultaneously
- Video decoding + GSAP animations compete for main thread
- `scrub` forces constant repaints during scroll
- GPU layers not properly promoted (causes expensive compositing)
- Mobile browsers throttle during scroll

**Consequences:**
- Janky scroll experience destroys "polished" brand impression
- High bounce rate from mobile users
- Battery drain complaints
- Accessibility: reduced motion users get same heavy animations

**Current state:** MODERATE RISK — landing.js uses ScrollTrigger with scrub + blur filter (expensive), gallery.js pins section with horizontal scroll

**Prevention:**
1. **Use `will-change` sparingly** — only on actively animating elements, remove after
2. **Promote layers explicitly** — `transform: translate3d(0,0,0)` on scrolling elements (landing.js does this)
3. **Limit simultaneous pins** — never pin two sections at same scroll position
4. **Avoid filter during scroll** — `blur()` forces software rendering, use static blur on poster instead
5. **Reduce motion fallback** — skip ScrollTrigger entirely if `prefers-reduced-motion` (landing.js does this correctly)
6. **Mobile-specific scrub values** — increase scrub on mobile (less smooth but better perf)
7. **Lazy-load ScrollTrigger** — don't initialize below-fold sections until approached

**Detection:**
- Chrome DevTools Performance panel shows long frames (>16ms)
- Mobile Safari shows purple "paint" flashes
- Lighthouse Performance score <80 on mobile
- Test on mid-tier Android (not flagship)

**Phase to address:** Phase 3 (Scroll Performance) — profile scroll jank, remove expensive filters, test mobile-specific scrub values

---

### Pitfall 4: Video Preload Bandwidth Waste

**What goes wrong:** All videos preload on page load, mobile users consume 50MB+ data before scroll, slow connections timeout.

**Why it happens:**
- Missing `preload="none"` on videos
- Browser ignores preload hint when `autoplay` present
- Eager `<link rel="preload">` on non-critical videos
- No lazy loading strategy for below-fold content

**Consequences:**
- Poor Lighthouse score (Time to Interactive)
- Mobile data waste (recruiters on cellular)
- Slow connections see blank sections for 10+ seconds
- High bounce rate before content visible

**Current state:** MIXED — index2.html has `preload="none"` on gallery card videos (good), but `<link rel="preload">` on hero video (aggressive)

**Prevention:**
1. **Preload hierarchy** — only preload above-fold hero video, everything else `preload="none"`
2. **Intersection-based loading** — load gallery videos when section approaches viewport
3. **Adaptive quality** — detect connection speed, serve lower bitrate on slow networks
4. **Poster images first** — always show instant poster, video is progressive enhancement
5. **Remove eager preload hints** — `<link rel="preload">` only for critical above-fold assets

**Detection:**
- Network tab shows all videos loading immediately
- Time to Interactive >5 seconds
- Large Contentful Paint delayed by video loading

**Phase to address:** Phase 2 (Video Playback) — implement intersection-based preloading

---

### Pitfall 5: Recruiter UX Mismatch

**What goes wrong:** Site optimized for creative directors, but recruiters (primary audience) bounce because key info hidden.

**Why it happens:**
- Resume/contact require scrolling through 5 sections
- No project descriptions (recruiters unfamiliar with shows)
- Network logos tiny or missing (credibility markers)
- No quick-scan table of credits
- Animation prevents quick access to info

**Consequences:**
- Recruiters bounce to find resume faster elsewhere
- LinkedIn profile gets more traffic than portfolio
- Interview requests reference LinkedIn, not portfolio
- Site impresses peers but doesn't convert to jobs

**Current state:** MODERATE RISK — index2.html has animations before credits, but network logos present, resume link in about section

**Prevention:**
1. **Fast-access resume** — link in nav or hero, not buried in scroll
2. **Project context** — 1-sentence description on gallery cards (not just title/role)
3. **Prominent network logos** — above-the-fold credential markers
4. **Skip to credits** — jump link for recruiters who want list
5. **Print-friendly resume** — separate page, not scroll experience
6. **SEO for show names** — Google should surface portfolio for "Wyatt Earp producer"

**Detection:**
- Analytics show high bounce rate from LinkedIn referrals
- Avg time on page <30 seconds (didn't engage with scroll)
- Resume PDF gets more downloads than portfolio visits
- User testing with non-creative recruiters

**Phase to address:** Phase 4 (Recruiter UX) — add quick-access patterns, project descriptions, print resume

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or suboptimal UX.

### Pitfall 6: Vimeo Embed Performance Trap

**What goes wrong:** Embed Vimeo players for portfolio reels, page weight increases by 500KB per embed, scroll jank increases.

**Why it happens:**
- Vimeo iframe loads entire player JS (heavy)
- Multiple embeds = multiple player instances
- Thumbnail facade requires custom implementation
- Vimeo player API conflicts with GSAP scroll

**Prevention:**
1. **Thumbnail + modal pattern** — show poster, open lightbox on click
2. **Single player instance** — swap video src instead of multiple embeds
3. **Native video for <30sec clips** — only use Vimeo for full reels
4. **Lazy iframe loading** — `loading="lazy"` on iframes (limited support)

**Phase to address:** Phase 2 (Video Playback) — if Vimeo used, implement facade pattern

---

### Pitfall 7: Video Format Compatibility

**What goes wrong:** Only WebM provided, Safari users see broken video (MP4 fallback missing).

**Why it happens:**
- WebM smaller file size, assume universal support
- Forget Safari requires MP4 (still true in 2026)
- No error handling when video fails to load

**Current state:** RISK — only `.webm` files in public/video/

**Prevention:**
1. **Provide both formats** — `<source src="video.webm">` then `<source src="video.mp4">`
2. **Test on Safari** — iOS Safari is still most restrictive
3. **Error handling** — show poster if neither format loads

**Phase to address:** Phase 1 (Video Infrastructure) — transcode to MP4 alongside WebM

---

### Pitfall 8: Scroll Height Miscalculation

**What goes wrong:** Gallery horizontal scroll ends too early or too late, cards cut off.

**Why it happens:**
- `scrollWidth` calculated before fonts load
- Viewport units unstable on mobile (address bar collapse)
- `invalidateOnRefresh: true` not set on ScrollTrigger
- Window resize doesn't refresh calculations

**Current state:** GOOD — gallery.js has `invalidateOnRefresh: true`, resize handler reloads page

**Prevention:**
1. **Font loading detection** — wait for `document.fonts.ready`
2. **ScrollTrigger.refresh()** after critical layout shifts
3. **Mobile vh units** — use `dvh` (dynamic viewport height) instead of `vh`
4. **Debounced resize** — avoid refresh thrashing

**Phase to address:** Phase 3 (Scroll Performance) — if gallery scroll feels off

---

### Pitfall 9: Accessibility with Video Content

**What goes wrong:** Screen readers can't navigate video sections, keyboard users can't pause, captions missing.

**Why it happens:**
- Video decorative (no controls), but no way to pause for motion-sensitive users
- ARIA labels missing on video elements
- Skip links not provided for long scroll sections
- Captions not provided (nonfiction portfolios especially need this)

**Current state:** PARTIAL — `prefers-reduced-motion` respected (good), but no pause controls, no captions

**Prevention:**
1. **Pause button** — even for autoplay videos, provide hidden pause control
2. **Captions for demo reels** — especially for nonfiction (dialogue/narration matters)
3. **Skip links** — "Skip to credits" for keyboard users
4. **Focus management** — gallery cards keyboard navigable
5. **ARIA landmarks** — proper section roles

**Phase to address:** Phase 5 (Accessibility) — add pause controls, captions, skip links

---

### Pitfall 10: Build Size from GSAP Bloat

**What goes wrong:** Importing all GSAP plugins increases bundle by 200KB, slows initial load.

**Why it happens:**
- Import entire `gsap` package instead of specific plugins
- Unused plugins (DrawSVG, MorphSVG) included
- No tree-shaking optimization

**Current state:** GOOD — imports specific plugins from `gsap` package (tree-shakeable)

**Prevention:**
1. **Import only needed plugins** — `import { gsap, ScrollTrigger } from 'gsap'`
2. **Check bundle analyzer** — ensure unused plugins removed
3. **Core-only for simple pages** — contact.html doesn't need ScrollTrigger

**Phase to address:** Not urgent (already optimized)

---

## Minor Pitfalls

Annoyances that are easily fixable.

### Pitfall 11: Loading State Flicker

**What goes wrong:** White flash before dark theme loads, content jumps as fonts load.

**Why it happens:**
- CSS loads after HTML parsed
- Custom fonts cause layout shift
- No skeleton loaders for dynamic content

**Current state:** GOOD — index2.html has inline critical CSS for dark background, loading screen

**Prevention:**
1. **Inline critical CSS** — background, layout in `<style>` tag
2. **Font display swap** — `font-display: swap` on @font-face
3. **Skeleton loaders** — for credits table loaded via JS

**Phase to address:** Phase 6 (Polish) — if flicker still observed

---

### Pitfall 12: Mobile Video Orientation

**What goes wrong:** Widescreen videos have huge black bars on mobile portrait, waste screen space.

**Why it happens:**
- All videos optimized for desktop 16:9
- No portrait variants for mobile
- Object-fit doesn't solve composition issues

**Current state:** OBSERVED — public/video/ has some 9:16 variants (LandingPageMontagev05_9x16.webm), but not all

**Prevention:**
1. **Portrait variants for hero** — 9:16 or 4:5 for mobile
2. **`<picture>`-style video** — serve different src based on viewport
3. **Zoom/crop strategy** — object-fit fill if composition allows

**Phase to address:** Phase 2 (Video Playback) — add portrait variants where needed

---

### Pitfall 13: Video Loop Stutter

**What goes wrong:** Looping hero video has visible stutter/flash at loop point.

**Why it happens:**
- Video not encoded for seamless loop (missing frames at end)
- Browser re-seeks to start (not instant)
- Loop attribute unreliable on some browsers

**Prevention:**
1. **Encode for loop** — match first/last frames, use GOP alignment
2. **JavaScript loop** — listen for `timeupdate`, seek before end
3. **Short loops** — <10 seconds loops less noticeable than 30s

**Phase to address:** Phase 2 (Video Playback) — if loop stutter observed

---

### Pitfall 14: Hover Video on Touch Devices

**What goes wrong:** Gallery cards use `mouseenter` to play video, no equivalent on touch.

**Why it happens:**
- Hover-based interactions don't translate to touch
- No fallback for mobile gallery card videos

**Current state:** OBSERVED — gallery.js has mouseenter/mouseleave handlers, mobile gets static fallback (good)

**Prevention:**
1. **Touch = autoplay** — play gallery videos on intersection on mobile
2. **Tap to play/pause** — add touch handler for control
3. **Mobile-first design** — design for touch, enhance with hover

**Phase to address:** Phase 2 (Video Playback) — if gallery videos too static on mobile

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Video Infrastructure | GitHub Pages size limit | Implement Git LFS before adding more videos |
| Video Playback | Autoplay blocking on mobile | Intersection-based play triggers, fallback UI |
| Scroll Performance | Jank from blur filters | Profile performance, remove expensive filters |
| Recruiter UX | Key info buried in scroll | Fast-access resume link, project descriptions |
| Accessibility | No pause controls | Add pause button even for decorative videos |
| SEO | Videos not indexed | Structured data for video objects, alt text |

---

## Deep Research Flags

Areas where phase-specific research will be required:

1. **Video CDN Strategy** (Phase 1) — research Cloudflare R2, Bunny CDN pricing vs GitHub Pages LFS
2. **Autoplay Detection** (Phase 2) — verify 2026 autoplay policies across browsers (may have changed)
3. **Mobile Video Performance** (Phase 3) — need real-device testing, not just DevTools throttling
4. **Analytics Integration** (Phase 6) — which events to track for recruiter behavior (scroll depth, video plays, resume clicks)

---

## Sources

**Confidence Level: MEDIUM**

Research based on:
- Established patterns from video portfolio best practices (training knowledge)
- GitHub Pages documentation (100MB soft limit, 1GB hard limit well-documented)
- Browser autoplay policies (iOS/Android requirements established)
- GSAP ScrollTrigger performance patterns (documented in GreenSock forums)
- Project codebase analysis (index2.html, landing.js, gallery.js)

**Limitations:**
- WebSearch unavailable for 2026-specific updates to autoplay policies
- Unable to verify current CDN pricing
- Unable to check latest Lighthouse scoring criteria

**Verification needed:**
- Current browser autoplay policy details (may have evolved since training cutoff)
- GitHub Pages LFS pricing/limits (may have changed)
- Current mobile video codec support (AV1 adoption status)
