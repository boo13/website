# Phase 4: Video Lightbox & Hover Interactivity - Research

**Researched:** 2026-02-09
**Domain:** Video lightbox libraries, hover interactions, mobile video playback, accessibility
**Confidence:** HIGH

## Summary

Phase 4 adds interactive video playback to the featured work gallery: users can click project cards to watch videos in a full-screen modal overlay, and desktop users see hover video previews. The research reveals a clear choice between GLightbox (lightweight, proven library) and a custom modal solution.

**Key findings:**
- GLightbox is the standard choice for vanilla JS video lightboxes: 11KB gzipped, zero dependencies, supports YouTube/Vimeo/HTML5 video with autoplay
- Hover video previews already exist in the codebase (gallery.js lines 38-50) using inline `<video>` elements with `mouseenter`/`mouseleave` handlers
- iOS Safari and Android Chrome require `muted playsinline` attributes for autoplay; unmuted autoplay requires user interaction
- Modal keyboard accessibility needs: Escape to close, Tab cycling within modal, focus trap, return focus on close
- GSAP ScrollTrigger and modals coexist well if modal is outside pinned sections and uses high z-index (9999+)

**Primary recommendation:** Use GLightbox for the video modal (proven, accessible, GSAP-compatible) and extend existing hover preview pattern to new project cards with clips. For mobile, provide a tap-to-play experience since hover doesn't exist.

## Standard Stack

Phase 4 can use GLightbox or build custom. Both approaches are viable.

### Core (Recommended)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GLightbox | 3.3.0+ | Video lightbox modal | Industry standard: 11KB gzipped, zero dependencies, supports all video types |
| focus-trap | 7.6.0+ | Keyboard focus management | Accessible focus trapping for modals (if building custom) |

### Alternative: Custom Build
| Component | Implementation | Tradeoff |
|-----------|----------------|----------|
| Modal overlay | Vanilla JS + CSS | Full control, smaller bundle (~2-3KB), but must implement all features manually |
| Video player | HTML5 `<video>` | Native browser controls, no player library needed |
| Focus trap | Custom Tab key handler | Lightweight but must handle edge cases |

### Installation (GLightbox)
```bash
npm install glightbox
```

### Installation (focus-trap, if custom)
```bash
npm install focus-trap
```

## Architecture Patterns

### Pattern 1: GLightbox Integration (Recommended)
**What:** Library handles modal overlay, video playback, keyboard navigation, and accessibility
**When to use:** Standard implementation for video modals
**Example:**
```javascript
// src/components/video-lightbox.js
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

export function initVideoLightbox() {
  const lightbox = GLightbox({
    selector: '.glightbox-video',  // Elements with this class trigger lightbox
    touchNavigation: true,
    loop: false,
    autoplayVideos: true,
    plyr: {
      config: {
        controls: ['play-large', 'play', 'progress', 'current-time',
                   'mute', 'volume', 'fullscreen']
      }
    }
  });

  return () => lightbox.destroy();
}
```

**HTML integration:**
```html
<article class="gallery-card">
  <a href="#video-wyatt-earp" class="glightbox-video card-clickable">
    <div class="card-media">
      <img class="card-thumbnail" src="images/portfolio/WyattEarp.jpg" alt="Wyatt Earp">
      <video class="card-video" muted loop playsinline preload="none">
        <source src="video/Cowboy.War.10secReel.v01_1920x1080.webm" type="video/webm">
      </video>
    </div>
    <!-- card content -->
  </a>
</article>

<!-- Hidden lightbox content -->
<div id="video-wyatt-earp" style="display: none;">
  <video controls playsinline>
    <source src="video/Cowboy.War.FULL.webm" type="video/webm">
    <source src="video/Cowboy.War.FULL.mp4" type="video/mp4">
  </video>
</div>
```

**GSAP compatibility:**
GLightbox modal appears outside ScrollTrigger pinned sections with z-index: 100002 (backdrop: 100001). No conflicts with existing scroll animations.

### Pattern 2: Custom Modal (Alternative)
**What:** Hand-rolled modal with full control over markup, styling, and behavior
**When to use:** If design requires custom animations, GSAP-driven transitions, or non-standard layouts
**Example:**
```javascript
// src/components/video-modal.js
import { gsap } from '../animations/scroll-defaults.js';
import focusTrap from 'focus-trap';

export function initVideoModal() {
  const modal = document.querySelector('.video-modal');
  const video = modal.querySelector('video');
  const closeBtn = modal.querySelector('.modal-close');
  let trap = null;

  function openModal(videoSrc) {
    video.src = videoSrc;
    modal.classList.add('active');

    // GSAP entrance animation
    gsap.fromTo(modal,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    );

    // Focus trap
    trap = focusTrap.createFocusTrap(modal, {
      escapeDeactivates: true,
      onDeactivate: closeModal
    });
    trap.activate();

    video.play().catch(() => {});
  }

  function closeModal() {
    video.pause();
    video.currentTime = 0;

    gsap.to(modal, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        modal.classList.remove('active');
        if (trap) trap.deactivate();
      }
    });
  }

  // Event listeners
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Return public API
  return { openModal, closeModal };
}
```

### Pattern 3: Hover Video Preview (Existing, Extend)
**What:** Inline `<video>` element plays on `mouseenter`, pauses on `mouseleave`
**When to use:** Desktop hover previews for project cards with video clips
**Example (already implemented in gallery.js):**
```javascript
// src/sections/gallery.js (lines 38-50, existing)
function setupVideoHover() {
  cards.forEach((card) => {
    const video = card.querySelector('.card-video');
    if (!video) return;
    card.addEventListener('mouseenter', () => {
      video.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}
```

**Mobile fallback (no hover):**
```javascript
// Detect touch devices
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  // On mobile: click opens lightbox (no hover preview)
  // Hover video element remains hidden on mobile via CSS
} else {
  // Desktop: hover plays preview, click opens lightbox
  setupVideoHover();
}
```

### Anti-Patterns to Avoid
- **Blocking body scroll incorrectly:** Don't use `overflow: hidden` on body — use scroll-lock technique or rely on GLightbox's built-in handling
- **Missing mobile video attributes:** Always include `playsinline muted` for iOS Safari autoplay compatibility
- **Focus trap without Escape handler:** Escape key must always close modal for accessibility
- **Preloading all videos:** Use `preload="none"` on hover preview videos, only load metadata when card is near viewport

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping in modals | Custom Tab key handler with focusable element detection | focus-trap library | Edge cases: hidden elements, disabled elements, nested iframes, SVG elements with tabindex |
| Video format detection | Browser sniffing to serve MP4 vs WebM | HTML5 `<source>` fallback chain | Browser picks best format automatically; WebM first, MP4 fallback |
| Mobile autoplay detection | Try/catch on play() with complex retry logic | Simple `play().catch()` pattern | Promise rejection is standard, no need for feature detection |
| Keyboard event normalization | Handling keyCode vs key vs which | Use `event.key === 'Escape'` | Modern standard, works in all browsers back to IE11 |
| Scroll locking | Manual scroll position tracking and body overflow toggling | GLightbox built-in scroll lock or body-scroll-lock library | Must handle iOS Safari quirks, touch-move prevention, scroll restoration |

**Key insight:** Video modal accessibility has many edge cases (focus management, screen reader announcements, keyboard navigation, scroll locking). GLightbox handles all of these correctly. Custom modals require significant accessibility testing and edge case handling.

## Common Pitfalls

### Pitfall 1: iOS Safari Muted Autoplay Failure
**What goes wrong:** Video doesn't autoplay on iPhone despite `autoplay` attribute
**Why it happens:** iOS Safari requires BOTH `muted` AND `playsinline` attributes for autoplay without user interaction
**How to avoid:** Always use this attribute combination for hover preview videos:
```html
<video muted loop playsinline preload="none">
  <source src="video.webm" type="video/webm">
</video>
```
**Warning signs:** Video plays on desktop but not mobile, console shows "play() request was interrupted"

### Pitfall 2: ScrollTrigger Pin Conflicts with Modal
**What goes wrong:** Modal appears behind pinned section or scroll position jumps when modal opens
**Why it happens:** Pinned sections use z-index and transform, which create new stacking contexts
**How to avoid:**
- Place modal HTML outside pinned sections (as direct child of `<body>`)
- Use z-index > 10000 for modal overlay and content
- GLightbox uses z-index: 100001 (backdrop) and 100002 (content) by default
**Warning signs:** Modal hidden behind gallery section, scroll position changes on modal open

### Pitfall 3: Focus Lost After Modal Close
**What goes wrong:** After closing modal, keyboard focus goes to document body instead of trigger element
**Why it happens:** Modal destroyed without returning focus to original trigger
**How to avoid:**
```javascript
let triggerElement = null;

function openModal(event) {
  triggerElement = document.activeElement;  // Store focus
  // ... open modal
}

function closeModal() {
  // ... close modal
  if (triggerElement) {
    triggerElement.focus();  // Restore focus
    triggerElement = null;
  }
}
```
**Warning signs:** Keyboard users must Tab from top of page after closing modal, screen readers announce page title instead of context

### Pitfall 4: Video Preload Performance Hit
**What goes wrong:** Page load is slow, many network requests on page load
**Why it happens:** Multiple video elements with `preload="metadata"` or `preload="auto"` all fetch data simultaneously
**How to avoid:**
- Use `preload="none"` on all hover preview videos
- Only use `preload="metadata"` on the first visible card
- Lazy-load video sources when card enters viewport using Intersection Observer
**Warning signs:** DevTools Network tab shows many video requests on page load, mobile data usage warnings

### Pitfall 5: Missing Keyboard Navigation in Custom Modals
**What goes wrong:** Modal can't be closed with Escape, Tab key exits modal, arrow keys don't work
**Why it happens:** Custom modal doesn't implement full keyboard accessibility spec
**How to avoid:** If building custom, implement ARIA dialog pattern:
- Escape key closes modal
- Tab cycles within modal (focus trap)
- Arrow keys navigate between videos (if gallery)
- Focus moves to modal on open
- Focus returns to trigger on close
- Modal has `role="dialog"` and `aria-modal="true"`
**Warning signs:** Keyboard users can't navigate, WCAG 2.1 Level AA compliance fails

### Pitfall 6: Android Chrome Unmuted Autoplay Assumption
**What goes wrong:** Video with sound doesn't autoplay on Android despite user interaction
**Why it happens:** Chrome's Media Engagement Index (MEI) on desktop doesn't apply to mobile; mobile always requires muted for autoplay OR explicit user play() call
**How to avoid:**
- Hover previews: always muted
- Lightbox modal: use `controls` attribute, let user unmute
- Don't assume autoplay with sound works even after user clicks card
**Warning signs:** Modal opens but video doesn't start, user must click play button manually

## Code Examples

Verified patterns from official sources:

### GLightbox Video Modal Setup
```javascript
// Source: https://github.com/biati-digital/glightbox
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

export function initVideoLightbox() {
  const lightbox = GLightbox({
    selector: '.glightbox-video',
    touchNavigation: true,
    loop: false,
    autoplayVideos: true,
    closeButton: true,
    closeOnOutsideClick: true,
    keyboardNavigation: true,  // Arrow keys, Escape
    svg: {
      close: '<svg>...</svg>',  // Custom close button icon
      next: '<svg>...</svg>',
      prev: '<svg>...</svg>',
    }
  });

  return () => lightbox.destroy();
}
```

### iOS Safari Autoplay Pattern
```html
<!-- Source: https://webkit.org/blog/6784/new-video-policies-for-ios/ -->
<video autoplay loop muted playsinline preload="none">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</video>
```

### Hover Preview with Mobile Touch Fallback
```javascript
// Source: Existing codebase (gallery.js) + web best practices
function setupVideoInteractions() {
  const cards = document.querySelectorAll('.gallery-card');
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  cards.forEach((card) => {
    const video = card.querySelector('.card-video');
    if (!video) return;

    if (!isTouchDevice) {
      // Desktop: hover preview
      card.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    } else {
      // Mobile: hide hover video, only show thumbnail
      video.style.display = 'none';
    }
  });
}
```

### Video Loading State Handler
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
function setupVideoLoadingStates(video) {
  const spinner = video.parentElement.querySelector('.video-spinner');

  video.addEventListener('loadstart', () => {
    spinner.style.display = 'block';
  });

  video.addEventListener('canplay', () => {
    spinner.style.display = 'none';
  });

  video.addEventListener('waiting', () => {
    spinner.style.display = 'block';
  });

  video.addEventListener('playing', () => {
    spinner.style.display = 'none';
  });

  video.addEventListener('error', () => {
    spinner.style.display = 'none';
    console.error('Video failed to load:', video.error);
  });
}
```

### Focus Trap with Escape Handler (Custom Modal)
```javascript
// Source: https://github.com/focus-trap/focus-trap
import * as focusTrap from 'focus-trap';

const trap = focusTrap.createFocusTrap('.video-modal', {
  escapeDeactivates: true,  // Escape key closes modal
  clickOutsideDeactivates: true,  // Click outside closes modal
  returnFocusOnDeactivate: true,  // Return focus to trigger
  initialFocus: '.video-modal video',  // Focus video on open
  fallbackFocus: '.video-modal',  // Fallback if video not focusable
  onActivate: () => {
    document.body.style.overflow = 'hidden';  // Prevent background scroll
  },
  onDeactivate: () => {
    document.body.style.overflow = '';  // Restore scroll
  }
});

// Activate when modal opens
trap.activate();

// Deactivate when modal closes
trap.deactivate();
```

### GSAP Modal Animation (Custom Build)
```javascript
// Source: https://gsap.com/community/forums/topic/17846-animate-a-modal-inout-from-the-click-point-of-origin/
import { gsap } from 'gsap';

function animateModalOpen(modal) {
  gsap.fromTo(modal,
    {
      opacity: 0,
      scale: 0.9,
      y: 50
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      clearProps: 'all'  // Clean up inline styles after animation
    }
  );
}

function animateModalClose(modal, onComplete) {
  gsap.to(modal, {
    opacity: 0,
    scale: 0.9,
    y: 50,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      modal.style.display = 'none';
      if (onComplete) onComplete();
    }
  });
}
```

### Lazy Video Preload on Hover Intent
```javascript
// Source: https://imagekit.io/blog/lazy-loading-html-videos/
function setupLazyVideoPreload() {
  const cards = document.querySelectorAll('.gallery-card');

  cards.forEach((card) => {
    const video = card.querySelector('.card-video');
    if (!video) return;

    let hoverTimeout = null;

    card.addEventListener('mouseenter', () => {
      // Wait 200ms before preloading (hover intent detection)
      hoverTimeout = setTimeout(() => {
        if (video.readyState === 0) {
          // Not loaded yet, start preload
          video.load();
        }
        video.play().catch(() => {});
      }, 200);
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      video.pause();
      video.currentTime = 0;
    });
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lightbox2 (jQuery) | GLightbox (vanilla JS) | ~2019 | Zero-dependency, ES module support, 11KB vs 20KB+jQuery |
| `<video autoplay>` without attributes | `<video autoplay muted playsinline>` | iOS 10 (2016) | Mobile autoplay now works reliably |
| Custom focus trap logic | focus-trap library | ~2018 | Handles edge cases: SVG, disabled elements, nested iframes |
| Chrome autoplay blocked all videos | Muted autoplay always allowed | Chrome 66 (2018) | Hover previews work without user interaction |
| keyCode / which | event.key | ES6 / widespread ~2017 | Cleaner API, handles international keyboards |
| Body scroll lock via overflow:hidden | body-scroll-lock library or CSS approach | ~2019 | iOS Safari scroll-through fixes, momentum scroll preservation |
| Manual video format detection | `<source>` element fallback | HTML5 spec | Browser picks best format (WebM, MP4, OGG) |

**Deprecated/outdated:**
- Lightbox2: jQuery dependency, no longer maintained actively
- jQuery-based video players: Modern vanilla JS solutions are smaller and faster
- Flash-based video embeds: Completely removed from all browsers
- `<video autobuffer>`: Renamed to `preload` in HTML5 spec (2010)

## Open Questions

Things that couldn't be fully resolved:

1. **Custom video player controls vs native browser controls**
   - What we know: GLightbox includes Plyr player with custom controls; native `<video controls>` works but styling is limited
   - What's unclear: User preference — does Randy want consistent branded controls or native browser controls?
   - Recommendation: Start with GLightbox + Plyr for consistent experience across browsers; can customize Plyr theme to match site design

2. **Full video file hosting and formats**
   - What we know: Projects.json has `videoStandard` (WebM) for 3 projects; hover preview clips exist
   - What's unclear: Do full-length videos exist for lightbox playback? If not, do we embed from Vimeo/YouTube instead?
   - Recommendation: Check with user — if full videos aren't hosted, add `vimeoLink` references to Projects.json and use GLightbox's Vimeo/YouTube embed support

3. **Gallery navigation in lightbox (arrow keys between projects)**
   - What we know: GLightbox supports galleries with arrow key navigation between items
   - What's unclear: Should users be able to arrow through all 5 projects in the lightbox, or is each modal isolated to one project?
   - Recommendation: Isolated modals (one project per modal) for Phase 4; gallery navigation could be added in a future enhancement if desired

4. **Hover preview clip duration and loop behavior**
   - What we know: Existing hover videos have `loop` attribute; gallery.js pauses and resets on `mouseleave`
   - What's unclear: Ideal clip length for previews (current clips are ~10 seconds)
   - Recommendation: Keep existing behavior (loop + reset on leave); 10-second clips are standard for portfolio hover previews

## Sources

### Primary (HIGH confidence)
- [GLightbox GitHub repository](https://github.com/biati-digital/glightbox) - Library features, installation, API
- [MDN: `<video>` element documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) - HTML5 video attributes, events, browser support
- [WebKit Blog: New Video Policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) - iOS Safari autoplay requirements
- [focus-trap GitHub repository](https://github.com/focus-trap/focus-trap) - Focus trap API, configuration options
- [Chrome Developers Blog: Autoplay Policy](https://developer.chrome.com/blog/autoplay) - Chrome/Android video autoplay rules

### Secondary (MEDIUM confidence)
- [GLightbox official site](https://biati-digital.github.io/glightbox/) - Examples and demos
- [CSS Script: Top 10 Gallery Lightbox Libraries (2026)](https://www.cssscript.com/top-10-javascript-css-gallery-lightbox-libraries/) - Library comparison
- [DEV Community: Video preview on hover with HTML and JavaScript](https://dev.to/juanbelieni/video-preview-on-hover-with-html-and-javascript-1b00) - Hover pattern implementation
- [UXPin Blog: How to Build Accessible Modals with Focus Traps](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/) - Focus trap best practices
- [ImageKit Blog: Lazy Loading HTML Videos](https://imagekit.io/blog/lazy-loading-html-videos/) - Video preload optimization
- [GSAP Forums: Animate a modal in/out](https://gsap.com/community/forums/topic/17846-animate-a-modal-inout-from-the-click-point-of-origin/) - GSAP modal animation patterns

### Tertiary (LOW confidence)
- [React Hover Video Player](https://react-hover-video-player.dev/) - Concept patterns (React-specific but useful for touch/hover fallback strategies)
- Various GSAP community forum discussions - ScrollTrigger + modal interaction patterns (multiple users reporting solutions, not official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - GLightbox is proven, widely used, well-documented
- Architecture: HIGH - Patterns verified in codebase (existing gallery.js) and official docs
- Pitfalls: HIGH - iOS Safari, Android Chrome, focus management issues well-documented in official browser blogs
- Mobile video: HIGH - WebKit and Chrome official blog posts provide authoritative guidance
- GSAP integration: MEDIUM - Community forums show it works, but no official GLightbox+GSAP documentation

**Research date:** 2026-02-09
**Valid until:** 2026-04-09 (60 days — stable domain, minimal API changes expected)
