# Architecture Patterns: Scroll-Driven Video Portfolio

**Domain:** Video producer portfolio with scroll-driven reveals
**Researched:** 2026-02-09
**Confidence:** HIGH (based on existing codebase analysis and established patterns)

## Executive Summary

The site already has a solid section-based ES module architecture with GSAP integration. New video features (hero reel, lightbox, scroll-driven reveals, newsletter) should extend this pattern, not replace it. The key architectural challenges are:

1. **Video loading strategy** — GitHub Pages has no backend, so intelligent client-side loading is critical
2. **Lightbox integration** — Must work within the existing ScrollTrigger pin ecosystem without conflicts
3. **Data flow** — projects.json already exists; extend it for enhanced features
4. **Asset hosting** — Current approach (42MB in public/video) works but needs optimization strategy

## Current Architecture (Existing)

### Section-Based Module Pattern

**Pattern:** Each scroll section = one ES module exporting `initSectionName()`

```
src/sections/
  landing.js         → initLanding()
  featured-work.js   → initFeaturedWork()
  gallery.js         → initGallery()
  credits.js         → initCredits()
  about.js           → initAbout()
```

**Characteristics:**
- Each init function wraps setup in `gsap.context()` scoped to section element
- Returns cleanup function for proper teardown
- Main.js orchestrates initialization order and handles loading screen
- Centralized GSAP plugin registration in `scroll-defaults.js`

**Why this works:**
- gsap.context() provides automatic cleanup and scoping
- No shared state between sections (only CustomEvents for inter-section communication)
- ScrollTrigger conflicts avoided via single `ScrollTrigger.defaults()` call
- Mobile/reduced-motion handled per-section

### Video Handling (Current)

**ResponsiveVideo component** (`src/components/responsive-video.js`):
- Handles aspect-ratio-based source switching
- Loading overlay management
- Preserves playback position on source swap
- Used in index.html (not index2.html)

**Gallery hover-to-play** (`src/sections/gallery.js`):
- Videos preload="none"
- Play on mouseenter, pause/reset on mouseleave
- Simple, no complex state management

**Hero video** (index2.html):
- Autoplay, loop, muted, playsinline
- Single WebM source (6.3MB)
- ScrollTrigger animates blur/opacity/scale on scroll

### Data Flow (Current)

**projects.json** → CreditsTable component
- JSON structure: `{ projects: [...] }`
- Each project has: id, title, platform, year, role, description, videoStandard, videoVertical, poster, links, preview
- Fetched in credits.js, rendered dynamically
- Already has video paths for some projects (Cowboy War, Beyond the Spotlight, Capsized)

### Asset Pipeline (Current)

**Vite configuration:**
- `public/` directory copied as-is to dist/
- Multi-page build (index.html, index2.html, contact.html, etc.)
- No video processing/optimization in build step
- Total video size: 42MB across 9 files (largest: 18MB)

**Current video sizes:**
- Hero reels: 6.3MB (standard), 2.4MB (9x16 vertical)
- Project clips: 1.4–2.1MB each (10-second reels)
- Format: WebM only

## Proposed Architecture (Enhanced)

### Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| **VideoLightbox** | Modal playback, controls, close | projects.json (data), gallery/credits (triggers) | src/components/video-lightbox.js |
| **VideoPreloader** | Intelligent preloading, buffer management | All video-consuming sections | src/components/video-preloader.js |
| **ScrollRevealText** | Text animations triggered by scroll | Any section needing text reveals | src/animations/scroll-reveal-text.js |
| **NewsletterForm** | Email capture, validation, Buttondown API | Contact section | src/components/newsletter-form.js |
| **HeroReel** | Enhanced hero with multiple video clips | landing.js (section) | Extend existing landing.js |

### Video Loading Strategy

#### Problem Space

GitHub Pages constraints:
- Static hosting only (no backend for transcoding)
- No CDN for edge caching (unless added separately)
- Large video files increase bundle size
- Mobile bandwidth considerations
- Scroll-based UX requires videos ready when needed

#### Recommended Approach: Tiered Preloading

**Tier 1: Critical (Load immediately)**
- Hero video (above the fold)
- Use native `<link rel="preload" as="video">` in HTML head (already implemented)
- Current hero video: 6.3MB → reasonable for immediate load

**Tier 2: Near-viewport (Intersection Observer)**
- Gallery card videos
- Preload when section is 1 viewport away
- Use Intersection Observer with `rootMargin: "100%"` (one viewport ahead)
- Set `preload="none"` initially, upgrade to `preload="metadata"` when approaching

**Tier 3: On-demand (User interaction)**
- Lightbox full videos
- Only load when user clicks "Watch" CTA
- Show loading state while buffering

**Tier 4: Deferred (Idle time)**
- Background preload remaining videos during idle time
- Use `requestIdleCallback()` to avoid blocking interactions

#### Implementation Pattern

```javascript
// src/components/video-preloader.js

export class VideoPreloader {
  constructor(options = {}) {
    this.tier2Threshold = options.tier2Threshold || '100%'; // 1 viewport ahead
    this.tier4Enabled = options.tier4Enabled !== false;
    this.observers = [];
  }

  // Tier 2: Intersection-based preloading
  observeVideo(videoElement, callback) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preloadMetadata(videoElement);
            if (callback) callback(videoElement);
          }
        });
      },
      { rootMargin: this.tier2Threshold }
    );
    observer.observe(videoElement);
    this.observers.push(observer);
    return observer;
  }

  preloadMetadata(videoElement) {
    if (videoElement.preload === 'none') {
      videoElement.preload = 'metadata';
    }
  }

  // Tier 4: Idle-time preloading
  preloadDuringIdle(videoElements) {
    if (!this.tier4Enabled || !('requestIdleCallback' in window)) return;

    const preloadNext = (index) => {
      if (index >= videoElements.length) return;
      requestIdleCallback(() => {
        const video = videoElements[index];
        if (video.readyState < 2) { // HAVE_CURRENT_DATA
          video.preload = 'auto';
        }
        preloadNext(index + 1);
      });
    };
    preloadNext(0);
  }

  cleanup() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
  }
}
```

**Usage in gallery.js:**

```javascript
import { VideoPreloader } from '../components/video-preloader.js';

export function initGallery() {
  // ... existing setup ...

  const preloader = new VideoPreloader();
  const videos = section.querySelectorAll('.card-video');

  videos.forEach(video => {
    preloader.observeVideo(video);
  });

  // Preload remaining videos during idle time
  preloader.preloadDuringIdle(videos);

  return () => {
    ctx.revert();
    preloader.cleanup();
  };
}
```

### Lightbox Architecture

#### Integration Points

**Trigger sources:**
1. Gallery cards (click)
2. Credits table rows (click)
3. Direct URL hash (e.g., `#video=wyatt-earp`)

**Constraints:**
- Must work with ScrollTrigger pinning (hero, parallax, gallery all use pin)
- Must disable scroll while open
- Must handle video loading/buffering states
- Must support keyboard navigation (Esc to close, arrow keys for next/prev)

#### Recommended Pattern: Portal + State Management

**Why a "portal" approach:**
- Lightbox lives outside normal scroll flow
- Prevents z-index battles with pinned sections
- Allows independent styling/positioning
- No ScrollTrigger conflicts (lightbox is position: fixed)

**Structure:**

```javascript
// src/components/video-lightbox.js

export class VideoLightbox {
  constructor() {
    this.container = null;
    this.isOpen = false;
    this.currentProject = null;
    this.projectsData = null;

    this.init();
  }

  init() {
    // Create lightbox DOM structure
    this.container = this.createLightboxDOM();
    document.body.appendChild(this.container);

    // Bind event listeners
    this.bindEvents();

    // Check for URL hash on init
    this.checkURLHash();
  }

  createLightboxDOM() {
    const lightbox = document.createElement('div');
    lightbox.className = 'video-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">
          <svg><!-- close icon --></svg>
        </button>
        <div class="lightbox-video-container">
          <video class="lightbox-video" controls playsinline></video>
          <div class="lightbox-loading">Loading...</div>
        </div>
        <div class="lightbox-meta">
          <h3 class="lightbox-title"></h3>
          <p class="lightbox-description"></p>
          <div class="lightbox-links"></div>
        </div>
        <button class="lightbox-prev" aria-label="Previous">←</button>
        <button class="lightbox-next" aria-label="Next">→</button>
      </div>
    `;
    return lightbox;
  }

  async open(projectId) {
    if (!this.projectsData) {
      this.projectsData = await this.loadProjectsData();
    }

    const project = this.projectsData.projects.find(p => p.id === projectId);
    if (!project || !project.videoStandard) return;

    this.currentProject = project;
    this.isOpen = true;

    // Disable scroll
    document.body.style.overflow = 'hidden';

    // Update URL hash
    window.history.pushState(null, '', `#video=${projectId}`);

    // Populate content
    this.populateContent(project);

    // Animate in
    this.animateIn();

    // Load and play video
    this.loadVideo(project.videoStandard);
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Re-enable scroll
    document.body.style.overflow = '';

    // Clear URL hash
    window.history.pushState(null, '', window.location.pathname);

    // Stop video
    const video = this.container.querySelector('.lightbox-video');
    video.pause();
    video.src = '';

    // Animate out
    this.animateOut();
  }

  bindEvents() {
    // Close button
    this.container.querySelector('.lightbox-close').addEventListener('click', () => this.close());

    // Backdrop click
    this.container.querySelector('.lightbox-backdrop').addEventListener('click', () => this.close());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.showPrevious();
      if (e.key === 'ArrowRight') this.showNext();
    });

    // Prev/Next buttons
    this.container.querySelector('.lightbox-prev').addEventListener('click', () => this.showPrevious());
    this.container.querySelector('.lightbox-next').addEventListener('click', () => this.showNext());
  }

  async loadProjectsData() {
    const response = await fetch('/data/projects.json');
    return response.json();
  }

  loadVideo(src) {
    const video = this.container.querySelector('.lightbox-video');
    const loading = this.container.querySelector('.lightbox-loading');

    loading.style.display = 'flex';
    video.style.opacity = '0';

    video.src = src;
    video.load();

    video.addEventListener('canplay', () => {
      loading.style.display = 'none';
      video.style.opacity = '1';
      video.play();
    }, { once: true });
  }

  animateIn() {
    gsap.to(this.container, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
      onStart: () => {
        this.container.style.display = 'flex';
      }
    });
  }

  animateOut() {
    gsap.to(this.container, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.container.style.display = 'none';
      }
    });
  }

  checkURLHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#video=')) {
      const projectId = hash.replace('#video=', '');
      this.open(projectId);
    }
  }

  showPrevious() {
    // Navigate to previous project with video
    const withVideos = this.projectsData.projects.filter(p => p.videoStandard);
    const currentIndex = withVideos.findIndex(p => p.id === this.currentProject.id);
    const prevIndex = (currentIndex - 1 + withVideos.length) % withVideos.length;
    this.open(withVideos[prevIndex].id);
  }

  showNext() {
    // Navigate to next project with video
    const withVideos = this.projectsData.projects.filter(p => p.videoStandard);
    const currentIndex = withVideos.findIndex(p => p.id === this.currentProject.id);
    const nextIndex = (currentIndex + 1) % withVideos.length;
    this.open(withVideos[nextIndex].id);
  }
}

// Initialize as singleton
export const lightbox = new VideoLightbox();
```

**Integration in main.js:**

```javascript
import { lightbox } from './components/video-lightbox.js';

// Lightbox is self-initializing, just import it
// Sections can trigger it via: lightbox.open('project-id')
```

**Integration in gallery.js:**

```javascript
import { lightbox } from '../components/video-lightbox.js';

// In initGallery():
cards.forEach(card => {
  card.addEventListener('click', () => {
    const projectId = card.dataset.project;
    lightbox.open(projectId);
  });
});
```

### Scroll-Driven Text Reveals

#### Existing Pattern (text-mask-rise.js)

Already have word-by-word reveal animation (used in landing.js).

#### Proposed Enhancement: Scroll-Triggered Reveals

For "about" section content reveals (DECISIONS.md mentions "reveal the 'about' text through a series of featured work examples").

**Pattern: ScrollTrigger + SplitText alternative**

```javascript
// src/animations/scroll-reveal-text.js

import { gsap, ScrollTrigger } from './scroll-defaults.js';

/**
 * Reveal text lines as user scrolls
 * @param {string} selector - CSS selector for text elements
 * @param {object} options - Configuration options
 */
export function scrollRevealText(selector, options = {}) {
  const elements = gsap.utils.toArray(selector);
  if (!elements.length) return () => {};

  const defaults = {
    start: 'top 80%',
    end: 'top 60%',
    scrub: false,
    stagger: 0.1,
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  };

  const config = { ...defaults, ...options };

  elements.forEach((element, index) => {
    gsap.from(element, {
      y: config.y,
      opacity: config.opacity,
      duration: config.duration,
      ease: config.ease,
      delay: index * config.stagger,
      scrollTrigger: {
        trigger: element,
        start: config.start,
        end: config.end,
        scrub: config.scrub,
        toggleActions: 'play none none none'
      }
    });
  });

  return () => {
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars.trigger && elements.includes(st.vars.trigger)) {
        st.kill();
      }
    });
  };
}
```

**Usage in about.js:**

```javascript
import { scrollRevealText } from '../animations/scroll-reveal-text.js';

export function initAbout() {
  const section = document.querySelector('.about-section');
  if (!section) return () => {};

  const ctx = gsap.context(() => {
    // Reveal about statements one at a time
    scrollRevealText('.about-statement', {
      start: 'top 75%',
      stagger: 0.15,
      y: 40
    });

    // Reveal stats
    scrollRevealText('.stat', {
      start: 'top 80%',
      stagger: 0.08
    });
  }, section);

  return ctx;
}
```

### Newsletter Integration

#### Requirements
- Email capture form
- Integration with newsletter service (Buttondown recommended for static sites)
- Loading/success/error states
- Validation

#### Recommended: Buttondown API

**Why Buttondown:**
- Designed for static sites (client-side API)
- CORS-friendly
- Free tier sufficient for personal portfolio
- Simple REST API

**Implementation:**

```javascript
// src/components/newsletter-form.js

export class NewsletterForm {
  constructor(formSelector, options = {}) {
    this.form = document.querySelector(formSelector);
    if (!this.form) return;

    this.apiKey = options.apiKey || import.meta.env.VITE_BUTTONDOWN_API_KEY;
    this.endpoint = 'https://api.buttondown.email/v1/subscribers';

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const emailInput = this.form.querySelector('input[type="email"]');
    const submitButton = this.form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();

    if (!this.validateEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiKey}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        this.showSuccess('Thanks for subscribing!');
        this.form.reset();
      } else {
        const data = await response.json();
        this.showError(data.detail || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      this.showError('Network error. Please check your connection.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Subscribe';
    }
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showSuccess(message) {
    // Implementation depends on UI design
    // Could be inline message, toast, or form replacement
    const messageEl = this.form.querySelector('.form-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = 'form-message success';
    }
  }

  showError(message) {
    const messageEl = this.form.querySelector('.form-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = 'form-message error';
    }
  }
}
```

**Usage in contact.js (or about.js if newsletter goes in about section):**

```javascript
import { NewsletterForm } from '../components/newsletter-form.js';

export function initContact() {
  const newsletter = new NewsletterForm('.newsletter-form');

  // No cleanup needed; form listeners persist through page lifecycle
  return () => {};
}
```

**Environment variable setup:**

Add to `.env.local` (not committed):
```
VITE_BUTTONDOWN_API_KEY=your_api_key_here
```

Vite automatically exposes `VITE_*` vars as `import.meta.env.VITE_*`.

### Hero Reel Enhancement

#### Current State
Hero has single looping video with scroll-driven zoom/blur effect.

#### Proposed Enhancement
Multi-clip reel with crossfades (like a montage).

**Approach 1: Video editing (Recommended)**
- Edit multiple clips into single video file externally
- Keep existing architecture (single video element)
- Simpler, more reliable, better performance
- Current video already appears to be a montage (LandingPageMontagev04.2.webm)

**Approach 2: Client-side clip switching**
- Multiple video elements, crossfade with GSAP
- More complex, potential for janky transitions
- Only use if dynamic clip selection needed

**Recommendation:** Stick with Approach 1. If multiple reels needed (e.g., different themes), create separate montage videos and switch based on query param or time-based rotation.

### Section Transition Choreography

#### Current Transitions
- **Hero → Featured Work:** Zoom/fade to black, parallax rack-focus begins
- **Featured Work → Gallery:** Gallery pin starts immediately after parallax completes
- **Gallery → Credits:** Horizontal scroll completes, credits section flows in
- **Credits → About:** Standard scroll
- **About → Contact:** Standard scroll

#### Proposed Enhancements

**Custom event system already in place:**
```javascript
// landing.js dispatches:
document.dispatchEvent(new CustomEvent('heroZoomProgress', { detail: { progress } }));

// featured-work.js dispatches:
document.dispatchEvent(new CustomEvent('parallaxProgress', { detail: { progress } }));
```

**Enhancement pattern:**
Listen for section completion, trigger next section's intro animation.

```javascript
// Example: Trigger gallery intro when parallax completes

// In featured-work.js:
ScrollTrigger.create({
  trigger: section,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1.5,
  animation: tl,
  onLeave: () => {
    document.dispatchEvent(new CustomEvent('parallaxComplete'));
  }
});

// In gallery.js:
document.addEventListener('parallaxComplete', () => {
  // Trigger gallery intro animation
  gsap.from('.gallery-progress', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power2.out'
  });
}, { once: true });
```

**Note:** Keep transitions subtle. The scroll experience itself is the primary transition mechanism.

## Video Asset Strategy

### Current Hosting: GitHub Pages

**Characteristics:**
- Files served from `public/video/` (copied to dist/ by Vite)
- Total size: 42MB
- GitHub Pages bandwidth limits: Soft limit 100GB/month, hard limit on repo size (1GB recommended, 5GB max)

**Is this sustainable?**

**Calculation:**
- 42MB video assets
- Assume average visitor loads 50% of videos (21MB)
- 100GB monthly bandwidth = ~4,700 full visits/month (100,000 MB / 21 MB)
- For personal portfolio, likely sufficient

**When to migrate:**
- If bandwidth exceeds 80GB/month consistently
- If portfolio scales to 20+ videos
- If video quality needs increase (4K, longer clips)

### Migration Path (Future)

**Option 1: CDN (Recommended if scaling)**
- **Cloudflare Pages** (free tier: 500GB/month bandwidth)
  - Drop-in replacement for GitHub Pages
  - Automatic CDN, better performance
  - No build changes needed

- **Netlify** (free tier: 100GB/month)
  - Similar to Cloudflare
  - Slightly better DX for form handling

**Option 2: Video hosting service**
- **Mux** (usage-based pricing)
  - Adaptive bitrate streaming
  - Thumbnail generation
  - Analytics
  - Higher complexity, ongoing cost

- **Vimeo** (Plus plan: $12/month)
  - Embed videos via iframe
  - Vimeo player (less control over UX)
  - Privacy settings available

**Recommendation for now:** Stay on GitHub Pages until bandwidth becomes issue. Monitor GitHub Pages metrics (if available) or use Plausible/Fathom analytics to track traffic.

### Video Format Strategy

**Current format:** WebM only

**Recommendation:** Add fallback format

```html
<video>
  <source src="video/example.webm" type="video/webm">
  <source src="video/example.mp4" type="video/mp4">
</video>
```

**Why:**
- WebM support is excellent on modern browsers (97%+ global)
- MP4 fallback ensures compatibility with older Safari, iOS
- GitHub Pages has space for both formats within limits

**Format priorities:**
1. **WebM (VP9 codec)** — Modern, efficient, excellent quality-to-size ratio
2. **MP4 (H.264 codec)** — Universal compatibility fallback

**Encoding settings (for reference):**
```bash
# WebM (VP9) - balanced quality/size
ffmpeg -i input.mov -c:v libvpx-vp9 -b:v 2M -c:a libopus -b:a 128k output.webm

# MP4 (H.264) - compatibility fallback
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k output.mp4
```

**Responsive video strategy:**
Current ResponsiveVideo component handles aspect-ratio switching (16:9 vs 9:16). Extend pattern for resolution switching:

```javascript
// Pseudo-code for responsive video sources
const getVideoSource = (basePath) => {
  const isVertical = window.matchMedia('(max-aspect-ratio: 9/16)').matches;
  const isHighDPI = window.devicePixelRatio > 1.5;
  const isMobile = window.innerWidth <= 768;

  if (isVertical) return `${basePath}_9x16.webm`;
  if (isMobile && !isHighDPI) return `${basePath}_720p.webm`;
  return `${basePath}_1080p.webm`; // default
};
```

**Note:** Don't implement responsive video sources until asset library grows. Current 1080p files are reasonable size (1.4–6.3MB).

### Build Order Implications

**Suggested Phase Structure** (for roadmap):

**Phase 1: Foundation**
1. Create VideoPreloader component
2. Integrate into existing gallery.js
3. Test preloading strategy

**Phase 2: Lightbox**
1. Build VideoLightbox component (DOM structure, styles)
2. Integrate with projects.json
3. Add triggers in gallery.js and credits.js
4. Test keyboard navigation, URL hash routing

**Phase 3: Content Enhancement**
1. Add scroll-reveal-text animation utility
2. Enhance about.js with new content reveals
3. Create about content in HTML

**Phase 4: Newsletter**
1. Set up Buttondown account
2. Create NewsletterForm component
3. Add form to contact or about section
4. Test submission flow

**Phase 5: Polish**
1. Add section transition choreography
2. Performance audit (Lighthouse)
3. Mobile testing
4. Accessibility audit

**Dependencies:**
- Phase 2 (Lightbox) depends on Phase 1 (VideoPreloader) for smooth video loading
- Phase 3 (Content) independent of Phases 1-2
- Phase 4 (Newsletter) independent of all other phases
- Phase 5 (Polish) depends on all previous phases

## Performance Considerations

### Current Performance (Baseline)

**Existing assets:**
- Hero video: 6.3MB (preloaded)
- Project videos: 1.4–2.1MB each (lazy)
- Total JavaScript (estimated): ~200KB (GSAP + site code)
- CSS (estimated): ~50KB

**Lighthouse target (desktop):**
- Performance: 90+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

**Lighthouse target (mobile):**
- Performance: 80+ (video impacts this)
- Other metrics: same as desktop

### Optimization Strategies

**1. Code Splitting**
Vite handles automatic code splitting for multi-page apps. Each page gets own bundle.

**Potential optimization:**
Dynamic import for lightbox (only load when needed).

```javascript
// In gallery.js or credits.js
async function openLightbox(projectId) {
  const { lightbox } = await import('../components/video-lightbox.js');
  lightbox.open(projectId);
}
```

**Trade-off:** Slight delay on first lightbox open vs. smaller initial bundle. Probably not worth it for ~10KB component, but consider if lightbox grows.

**2. Image Optimization**

Current images in `public/images/` are not optimized by Vite.

**Recommendation:**
- Use next-gen formats (WebP) with fallbacks
- Responsive images for posters/thumbnails
- Lazy loading (already using `loading="lazy"`)

**Future enhancement:**
Add `vite-plugin-imagemin` to build process for automatic optimization.

**3. Video Preloading (Already Addressed)**

See "Video Loading Strategy" section above. Tier-based approach balances UX and bandwidth.

**4. Reduce Layout Shift**

**Current best practice already in place:**
- Hero video has `poster` attribute (1x1 black)
- Video elements have explicit dimensions in CSS

**Enhancement:**
Set `aspect-ratio` CSS property on video containers:

```css
.hero-video-container {
  aspect-ratio: 16 / 9;
}
```

Prevents layout shift during video load.

**5. Critical CSS**

Already inlined in index2.html head (dark background, loading spinner).

**No action needed** — pattern is solid.

**6. Font Loading**

Using Typekit (Adobe Fonts), loaded via external stylesheet.

**Consideration:**
Typekit is render-blocking. If performance becomes issue, consider self-hosting fonts with `font-display: swap`.

**Current approach acceptable for portfolio site** — Typekit is fast and reliable.

## Anti-Patterns to Avoid

### 1. Multiple ScrollTrigger.defaults() Calls

**Problem:** Each `ScrollTrigger.defaults()` call overrides previous defaults. If different sections call it with different settings, last one wins.

**Solution (Already Implemented):**
Single `ScrollTrigger.defaults()` call in `scroll-defaults.js`, imported everywhere.

**For new features:** Don't call `ScrollTrigger.defaults()` in component code. Set per-trigger settings explicitly.

### 2. Shared Video Elements

**Problem:** Reusing same `<video>` element for different sources can cause race conditions and janky playback.

**Solution:**
- Lightbox has dedicated video element
- Gallery cards each have own video element
- Hero has dedicated video element
- No sharing

### 3. Preload="auto" on All Videos

**Problem:** Browser preloads all videos immediately, consuming bandwidth and blocking other resources.

**Solution (Already Implemented):**
Gallery uses `preload="none"`. Hero uses implicit preload (link rel="preload" in head) because it's above fold.

**For new videos:** Default to `preload="none"`, upgrade to `metadata` or `auto` based on tiered strategy.

### 4. Z-Index Wars

**Problem:** Lightbox, pinned sections, and header all fighting for z-index supremacy.

**Solution:**
Establish z-index scale in CSS:

```css
:root {
  --z-base: 1;
  --z-section: 10;
  --z-header: 100;
  --z-lightbox: 1000;
  --z-loading: 9999;
}
```

Use CSS variables consistently. Lightbox is highest (except loading screen).

### 5. Scroll Hijacking

**Problem:** Over-controlling scroll behavior breaks browser norms, frustrates users.

**Solution (Already Followed):**
- Use ScrollTrigger for animations, not scroll prevention
- Respect prefers-reduced-motion
- Allow normal scroll when animations disabled (mobile, reduced motion)
- Only disable scroll when lightbox open (intentional modal behavior)

### 6. Ignoring Mobile/Reduced Motion

**Problem:** Desktop-optimized animations break or are janky on mobile; motion-sensitive users get nauseated.

**Solution (Already Implemented):**
Every section checks `prefers-reduced-motion` and mobile breakpoint, disables complex animations.

**For new features:** Follow same pattern. Mobile and reduced-motion checks first thing in init function.

### 7. Loading Videos on Page Load

**Problem:** All videos start loading immediately, blocking critical resources.

**Solution:**
See "Video Loading Strategy" — tiered approach with Intersection Observer and idle-time loading.

### 8. Not Cleaning Up

**Problem:** Event listeners, observers, and GSAP instances persist after component unmounts, causing memory leaks.

**Solution (Already Implemented):**
Every section returns cleanup function from gsap.context(). Main.js calls cleanup on pagehide.

**For new features:** Always return cleanup function. Disconnect observers, remove listeners.

## Integration with Existing Pattern

### How New Components Fit

**VideoLightbox:**
- Lives in `src/components/`
- Initialized in main.js (import for side effects)
- Triggered from sections (gallery.js, credits.js) via singleton instance
- No section-specific initialization needed

**VideoPreloader:**
- Lives in `src/components/`
- Instantiated per-section (gallery.js, about.js if about has videos)
- Cleaned up in section's cleanup function

**ScrollRevealText:**
- Lives in `src/animations/`
- Utility function (like text-mask-rise.js)
- Called from sections (about.js)
- Returns cleanup function

**NewsletterForm:**
- Lives in `src/components/`
- Instantiated in contact.js (or about.js if newsletter in about section)
- No cleanup needed (form persists through page lifecycle)

### Modified Files

**Existing files requiring changes:**

1. **src/main.js**
   - Add lightbox import: `import './components/video-lightbox.js';`
   - Extend loading Promise with video preload check (optional)

2. **src/sections/gallery.js**
   - Add VideoPreloader instantiation
   - Add lightbox trigger on card click
   - Add preloader cleanup to return function

3. **src/sections/credits.js**
   - Add lightbox trigger on table row click

4. **src/sections/about.js**
   - Add scrollRevealText calls for new content
   - Optionally add NewsletterForm if newsletter goes in about section

5. **src/config.js**
   - Add z-index scale constants
   - Add video preloader thresholds (if needed)

6. **public/data/projects.json**
   - Ensure all projects have videoStandard/videoVertical populated (where applicable)

**New files to create:**

1. `src/components/video-lightbox.js` (and .css)
2. `src/components/video-preloader.js`
3. `src/animations/scroll-reveal-text.js`
4. `src/components/newsletter-form.js` (and .css)

### Vite Configuration Changes

**Current vite.config.js:** Multi-page setup already in place.

**Potential additions:**

1. **Environment variables** (for newsletter API key)
   - Add `.env.local` to .gitignore (probably already there)
   - Document required env vars in README or CLAUDE.md

2. **Image optimization** (future enhancement)
   ```javascript
   import imagemin from 'vite-plugin-imagemin';

   export default defineConfig({
     plugins: [
       imagemin({ /* options */ })
     ]
   });
   ```

3. **Bundle analyzer** (for performance debugging)
   ```javascript
   import { visualizer } from 'rollup-plugin-visualizer';

   export default defineConfig({
     plugins: [
       visualizer({ open: true })
     ]
   });
   ```

**For initial implementation:** No Vite config changes needed. Existing setup handles everything.

## Testing Strategy

### Critical Paths to Test

1. **Video Loading Sequence**
   - Hero loads immediately (preload link)
   - Gallery videos load as section approaches
   - Lightbox videos load on-demand
   - No video loads block page interactivity

2. **Lightbox Functionality**
   - Opens on gallery card click
   - Opens on credits row click
   - Opens via URL hash
   - Closes on Esc key
   - Closes on backdrop click
   - Closes on X button
   - Prev/Next navigation works
   - Video loads and plays smoothly
   - Scroll disabled when open
   - URL updates when opening
   - URL clears when closing

3. **Mobile Experience**
   - Videos responsive (aspect ratio switching)
   - Gallery degrades to vertical stack on mobile
   - Lightbox usable on small screens
   - Touch gestures work (tap to close, swipe to navigate - future enhancement)

4. **Reduced Motion**
   - Animations disabled
   - Videos still load
   - Lightbox still functional
   - No janky fallbacks

5. **Performance**
   - Lighthouse scores meet targets (desktop: 90+, mobile: 80+)
   - No layout shift during video load
   - Smooth scrolling on mid-tier devices

### Testing Tools

**Automated:**
- Lighthouse (built into Chrome DevTools)
- WebPageTest (for bandwidth throttling simulation)

**Manual:**
- Test on real mobile devices (iOS Safari, Android Chrome)
- Test with keyboard only (accessibility)
- Test with screen reader (accessibility)
- Test on slow connection (Chrome DevTools throttling)

**Checklist per feature:**
- [ ] Works on Chrome desktop
- [ ] Works on Firefox desktop
- [ ] Works on Safari desktop
- [ ] Works on Chrome mobile (Android)
- [ ] Works on Safari mobile (iOS)
- [ ] Works with keyboard navigation
- [ ] Works with reduced motion enabled
- [ ] Works on slow 3G
- [ ] No console errors
- [ ] Lighthouse score meets targets

## Summary: Build Order

**Phase 1: Foundation** (1-2 days)
- Create VideoPreloader component
- Integrate into gallery.js
- Test tier-based loading

**Phase 2: Lightbox** (2-3 days)
- Build VideoLightbox component structure
- Implement open/close/navigate logic
- Integrate with projects.json
- Add triggers in gallery.js and credits.js
- Style lightbox (CSS)
- Test all interaction paths

**Phase 3: Content Enhancement** (1-2 days)
- Create scroll-reveal-text utility
- Add new about section content (HTML)
- Integrate reveals in about.js

**Phase 4: Newsletter** (1 day)
- Set up Buttondown account
- Create NewsletterForm component
- Add form HTML to contact or about section
- Test submission flow

**Phase 5: Polish** (1-2 days)
- Add section transition choreography
- Performance audit and optimization
- Mobile testing across devices
- Accessibility audit
- Cross-browser testing

**Total estimated time:** 6-10 days for solo developer

**Dependencies:**
- Lightbox depends on VideoPreloader (loading UX)
- Polish depends on all features being complete
- All other phases independent

**Risks:**
- Lightbox is most complex component (highest risk of delays)
- Newsletter depends on external service (potential API issues)
- Performance targets may require iteration on video encoding

**Mitigation:**
- Build lightbox in incremental steps (DOM → events → animations → polish)
- Test newsletter API integration early (spike task)
- Prepare multiple video encode profiles upfront
