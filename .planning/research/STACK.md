# Technology Stack Enhancement

**Project:** Randy Counsman Video Producer Portfolio
**Researched:** 2026-02-09
**Context:** Subsequent milestone adding video reel, lightbox, newsletter integration to existing Vite + GSAP + vanilla JS stack

## Current Stack (Already Established)

| Technology | Version | Purpose |
|------------|---------|---------|
| Vite | 7.3.1 | Build tool, dev server, HMR |
| GSAP | 3.14.2 | Core animation engine |
| ScrollTrigger | (GSAP plugin) | Scroll-driven animations |
| CustomEase | (GSAP plugin) | Custom easing curves |
| Observer | (GSAP plugin) | Event observation |
| Vanilla JS | ES modules | Core logic, no framework |
| CSS | Standard | Styling |
| GitHub Pages | Static | Hosting (no backend) |

**DO NOT replace these.** The following recommendations complement the existing stack.

## Additions Needed

### Video Playback & Lightbox

#### Recommended: GLightbox
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GLightbox | ^3.3.0 | Video lightbox, gallery | Zero dependencies, tiny (27kb), supports YouTube/Vimeo/HTML5, keyboard nav, mobile gestures, ARIA compliant |

**Installation:**
```bash
npm install glightbox
```

**Rationale:**
- Pure JavaScript, no jQuery or framework dependencies (fits vanilla JS architecture)
- Supports all video types portfolio needs: YouTube embeds, Vimeo, self-hosted HTML5
- Responsive by default with mobile touch gestures
- Keyboard accessible (Esc to close, arrows to navigate)
- API allows integration with GSAP (can trigger animations on open/close)
- Active maintenance (2024+ releases), modern ES module support
- 27kb gzipped is acceptable for video-heavy site where lightbox is core feature

**Alternative considered: Fancybox 5**
- Feature-rich but 120kb+ (4x larger)
- Commercial license required for non-GPL projects
- **Why not:** Overkill for video portfolio needs, licensing complexity

**Alternative considered: VideoJS**
- Focused on video player customization, not lightbox
- 240kb+ with plugins
- **Why not:** Portfolio needs lightbox presentation, not custom player controls

**Alternative considered: Custom build**
- Full control over features and size
- **Why not:** Lightbox UX has many edge cases (keyboard nav, focus trapping, touch gestures, video API coordination). GLightbox solves these well. Don't reinvent unless hitting specific limitations.

**Integration pattern:**
```javascript
// src/sections/featured-work.js
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.css';

export function initFeaturedWork() {
  const ctx = gsap.context(() => {
    const lightbox = GLightbox({
      touchNavigation: true,
      loop: false,
      autoplayVideos: false, // User-initiated playback
      onOpen: () => {
        // Pause GSAP ScrollTriggers during video viewing
        ScrollTrigger.getAll().forEach(st => st.disable());
      },
      onClose: () => {
        ScrollTrigger.getAll().forEach(st => st.enable());
      }
    });
  });

  return () => ctx.revert();
}
```

### Video Optimization & Handling

#### Recommended: Native HTML5 with Modern Codecs
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| WebM (VP9) | Standard | Primary video format | Best compression-to-quality for web, wide browser support (95%+) |
| MP4 (H.264) | Standard | Fallback format | Universal compatibility (Safari, older browsers) |
| Native `<video>` | HTML5 | Playback | Zero library overhead, built-in lazy loading, picture-in-picture |

**DO NOT add video player library.** Native HTML5 video is sufficient for portfolio use case.

**Encoding recommendations:**
- **WebM VP9:** CRF 30-35, 2-pass encoding for variable bitrate
- **MP4 H.264:** CRF 23-28, high profile, 2-pass
- **Resolution tiers:** 1920x1080 (desktop), 1280x720 (tablet), 854x480 (mobile)
- **Aspect ratios:** 16:9 (landscape), 9:16 (portrait/mobile fullscreen)

**Responsive video pattern (already exists in codebase):**
```javascript
// Extend existing ResponsiveVideo class for lightbox videos
// src/components/responsive-video.js already handles:
// - Aspect ratio switching
// - Source swapping without losing playback position
// - Loading overlays
// Reuse this pattern for featured work thumbnails
```

**Lazy loading strategy:**
```html
<!-- Hero reel: eager load -->
<video autoplay muted loop playsinline preload="auto">
  <source src="reel-1080p.webm" type="video/webm">
  <source src="reel-1080p.mp4" type="video/mp4">
</video>

<!-- Featured work: lazy load via Intersection Observer -->
<video preload="none" data-src="project-1.webm" loading="lazy">
  <!-- Populated when approaching viewport -->
</video>
```

**Performance optimization:**
- Use `preload="none"` for below-fold videos
- Implement Intersection Observer to load videos 500px before viewport entry
- Poster images (WebP format, 1920x1080 max, optimized at quality 80)
- `playsinline` attribute for iOS inline playback (avoids fullscreen)

#### Recommended: FFmpeg for Encoding
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| FFmpeg | 7.x | Video encoding | Industry standard, CLI scriptable, precise control over codecs/bitrates |

**Not installed via npm** - Local machine tool for asset preparation.

**Example encoding scripts:**
```bash
# WebM VP9 2-pass
ffmpeg -i source.mov -c:v libvpx-vp9 -b:v 0 -crf 32 -pass 1 -an -f null /dev/null
ffmpeg -i source.mov -c:v libvpx-vp9 -b:v 0 -crf 32 -pass 2 -c:a libopus -b:a 128k output.webm

# MP4 H.264 2-pass
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 23 -pass 1 -an -f null /dev/null
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 23 -pass 2 -c:a aac -b:a 192k output.mp4

# Mobile portrait (9:16)
ffmpeg -i source.mov -vf "scale=720:1280" -c:v libvpx-vp9 -crf 33 mobile-portrait.webm
```

**Alternative considered: Cloudinary/Mux**
- Cloud video hosting with automatic transcoding
- **Why not:** GitHub Pages is static-only (no backend). Adding third-party video hosting introduces external dependencies, potential costs, and reduces control over file delivery. For portfolio with ~10 videos, self-hosted is simpler and free.

### Newsletter Integration (Buttondown)

#### Recommended: Buttondown REST API via Fetch
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Buttondown API | v1 | Newsletter signup | Simple REST API, generous free tier, no-JS fallback possible |
| Native Fetch | Standard | HTTP client | Built-in, no library needed |

**Installation:**
None needed - native browser API.

**Authentication:**
Buttondown API key required. For client-side integration, use API key with minimal permissions (subscribe-only).

**Security consideration:**
API keys in client-side code are visible. Buttondown's subscribe endpoint is designed for public use (rate-limited, subscribe-only permission). For production, consider:
1. Use Buttondown's native HTML form (no API key needed, Buttondown handles POST)
2. OR use GitHub Actions + Netlify/Vercel serverless function if advanced validation needed
3. OR accept that API key is public-facing with subscribe-only scope

**Recommended approach: Native HTML form with AJAX enhancement**
```html
<!-- Fallback: works without JavaScript -->
<form action="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
      method="post" target="_blank">
  <input type="email" name="email" placeholder="your@email.com" required>
  <button type="submit">Subscribe</button>
</form>
```

**Progressive enhancement with Fetch:**
```javascript
// src/sections/newsletter.js
export function initNewsletter() {
  const form = document.querySelector('#newsletter-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]').value;

    try {
      const response = await fetch('https://api.buttondown.com/v1/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${import.meta.env.VITE_BUTTONDOWN_API_KEY}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        // Success feedback with GSAP animation
        gsap.to(form, { opacity: 0, duration: 0.3, onComplete: () => {
          form.innerHTML = '<p class="success">Check your email!</p>';
          gsap.fromTo(form, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        }});
      } else {
        // Error handling
        const data = await response.json();
        showError(data.detail || 'Subscription failed');
      }
    } catch (err) {
      showError('Network error. Please try again.');
    }
  });
}
```

**Vite environment variable setup:**
```bash
# .env (not committed)
VITE_BUTTONDOWN_API_KEY=your_api_key_here
```

```javascript
// vite.config.js - already configured for env vars
// No changes needed - Vite automatically exposes VITE_* variables
```

**Alternative considered: Mailchimp**
- Complex API, overkill for simple signup
- **Why not:** Buttondown is purpose-built for writers/creators, simpler API, better free tier (1000 subscribers vs Mailchimp's 500), cleaner UX

**Alternative considered: ConvertKit**
- Popular with creators
- **Why not:** No free tier, API requires paid plan. Buttondown free tier is sufficient for portfolio.

### GSAP Plugin Additions

#### Recommended: SplitText
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SplitText | (GSAP plugin) | Text animation | Word/char/line splitting for editorial typography effects (stagger reveals, scroll-triggered type) |

**License:** Club GreenSock membership required (paid plugin)
**Cost:** $99/year for single site

**Rationale:**
- Editorial portfolio = typography matters
- SplitText enables high-end text reveals common in editorial design (words sliding in, characters fading up, line stagger effects)
- Handles edge cases (wrapping, whitespace, responsive reflow)
- Alternative (manual split) is complex and brittle

**Installation:**
```bash
# After purchasing Club membership
npm install gsap/SplitText
```

**Usage pattern:**
```javascript
// src/sections/about.js
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export function initAbout() {
  const ctx = gsap.context(() => {
    const split = new SplitText('.about-statement', { type: 'words,chars' });

    gsap.from(split.chars, {
      opacity: 0,
      y: 20,
      stagger: 0.02,
      scrollTrigger: {
        trigger: '.about-statement',
        start: 'top 80%',
        end: 'bottom 60%',
        scrub: 1
      }
    });
  });

  return () => ctx.revert();
}
```

**Alternative considered: Custom split implementation**
- Wrap each word/char in span manually
- **Why not:**
  - Whitespace handling is tricky (SplitText preserves natural spacing)
  - Responsive reflow requires recalculation on resize
  - Accessibility concerns (screen readers may read split text oddly)
  - SplitText solves these problems; worth the cost for editorial quality

**SKIP: Other GSAP plugins**
- **DrawSVGPlugin:** Not needed (portfolio is video-focused, not SVG animation)
- **MorphSVGPlugin:** Not needed (no shape morphing in design)
- **ScrambleTextPlugin:** Gimmicky, not editorial aesthetic
- **GSDevTools:** Useful for development but not production dependency

#### Recommended: Flip
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Flip | (GSAP plugin, free) | Layout transitions | Smooth gallery grid reordering, filter animations |

**License:** Free, included with GSAP
**Already available:** Just needs registration

**Rationale:**
- If gallery section has filtering/sorting, Flip enables smooth layout transitions
- "Record state, change DOM, animate difference" pattern is perfect for grid reordering
- Free and lightweight, no downside to including

**Usage pattern:**
```javascript
// src/sections/gallery.js
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function initGallery() {
  const ctx = gsap.context(() => {
    const grid = document.querySelector('.gallery-grid');

    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = Flip.getState('.gallery-item');

        // Change DOM (filter, sort, etc)
        applyFilter(btn.dataset.filter);

        // Animate the difference
        Flip.from(state, {
          duration: 0.6,
          ease: 'power2.inOut',
          stagger: 0.02
        });
      });
    });
  });

  return () => ctx.revert();
}
```

### Image Optimization

#### Recommended: Sharp (build-time) + WebP/AVIF
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sharp | ^0.33.0 | Image processing | Fast, Node-based, generates WebP/AVIF/responsive variants |
| WebP | Standard | Primary image format | 25-35% smaller than JPEG, 97% browser support |
| AVIF | Standard | Next-gen format | 50% smaller than JPEG, 92% browser support (2026) |

**Installation:**
```bash
npm install --save-dev sharp
```

**Build script pattern:**
```javascript
// scripts/optimize-images.js
import sharp from 'sharp';
import { readdir } from 'fs/promises';

const sourceDir = './public/images/source';
const outputDir = './public/images';

const files = await readdir(sourceDir);

for (const file of files) {
  const input = `${sourceDir}/${file}`;
  const name = file.split('.')[0];

  // Generate AVIF (best compression)
  await sharp(input)
    .resize(1920, null, { withoutEnlargement: true })
    .avif({ quality: 80 })
    .toFile(`${outputDir}/${name}.avif`);

  // Generate WebP (better support)
  await sharp(input)
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(`${outputDir}/${name}.webp`);

  // Generate JPEG fallback
  await sharp(input)
    .resize(1920, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(`${outputDir}/${name}.jpg`);
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js",
    "prebuild": "npm run optimize:images"
  }
}
```

**HTML pattern:**
```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Description" loading="lazy">
</picture>
```

**Alternative considered: Vite plugin (vite-plugin-imagemin)**
- Automatic optimization during build
- **Why not:** Less control over output formats/quality. Sharp script gives explicit control and can run independently of Vite build.

**Alternative considered: Squoosh CLI**
- Google's image optimizer
- **Why not:** Sharp is faster (libvips under the hood), more Node-ecosystem friendly, better for scripting

### Performance Monitoring

#### Recommended: Web Vitals (runtime) + Lighthouse CI (build)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| web-vitals | ^4.0.0 | Core Web Vitals tracking | Lightweight (1.5kb), official Google library, tracks LCP/FID/CLS |
| Lighthouse CI | Latest | Performance budgets | Automated performance testing in CI/CD, catches regressions |

**Installation:**
```bash
npm install web-vitals
npm install --save-dev @lhci/cli
```

**web-vitals usage:**
```javascript
// src/analytics/web-vitals.js
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  // Log or send to analytics service
  console.log(name, value, id);
  // For production: send to your analytics endpoint
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

**Lighthouse CI setup:**
```javascript
// lighthouserc.json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/index2.html",
        "http://localhost/contact.html"
      ]
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

**Rationale:**
- Video-heavy site = performance monitoring is critical
- web-vitals gives production metrics (what users actually experience)
- Lighthouse CI prevents performance regressions during development
- Both tools are free, industry-standard

**Alternative considered: Bundle analyzer (rollup-plugin-visualizer)**
- Shows bundle composition
- **Why not:** Less actionable than runtime performance metrics. Use Lighthouse bundle analysis instead.

## Build Tool Additions

#### Recommended: Vite plugins
| Plugin | Version | Purpose | Why |
|--------|---------|---------|-----|
| vite-plugin-compress | ^1.1.0 | Gzip/Brotli compression | GitHub Pages serves static files; pre-compressed assets reduce bandwidth |

**Installation:**
```bash
npm install --save-dev vite-plugin-compress
```

**vite.config.js update:**
```javascript
import compress from 'vite-plugin-compress';

export default defineConfig({
  // existing config...
  plugins: [
    compress({
      algorithm: 'brotli',
      ext: '.br',
      threshold: 1024, // Only compress files > 1kb
      deleteOriginFile: false
    }),
    compress({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    })
  ]
});
```

**Rationale:**
- GitHub Pages doesn't auto-compress; this generates `.br` and `.gz` versions
- Serve compressed assets by configuring GitHub Pages or using CDN
- Brotli: ~20% better compression than gzip (for browsers that support it)
- No runtime overhead (compression happens at build time)

**Alternative considered: Server-side compression**
- **Why not:** GitHub Pages is static-only. Pre-compression is the only option.

## Development Tools (Non-Production)

#### Recommended: Browser DevTools extensions
| Tool | Purpose | Cost |
|------|---------|------|
| GreenSock Dev Tools | GSAP timeline scrubbing, real-time editing | Free (with GSAP Club) |
| Lighthouse | Performance auditing | Free (built into Chrome) |
| React DevTools | N/A - No React | N/A |

**DO NOT install:** Framework-specific devtools (React, Vue, etc). This is vanilla JS.

## Summary of Additions

### Required Installations
```bash
# Production dependencies
npm install glightbox web-vitals

# Development dependencies
npm install --save-dev sharp vite-plugin-compress @lhci/cli

# Optional (Club GreenSock membership required)
npm install gsap/SplitText  # Paid plugin
```

### Build Script Additions
```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js",
    "lighthouse": "lhci autorun",
    "prebuild": "npm run optimize:images"
  }
}
```

### File Structure Additions
```
scripts/
  optimize-images.js        # Sharp image processing
public/
  images/
    source/                 # Original high-res images (not deployed)
    [optimized outputs]     # WebP, AVIF, JPEG variants
.env                        # VITE_BUTTONDOWN_API_KEY (not committed)
.env.example                # Template for env vars (committed)
lighthouserc.json           # Lighthouse CI config
```

## What NOT to Add

### Frameworks (React, Vue, Svelte)
**Why not:** Project is vanilla JS by design. GSAP works beautifully without framework overhead. Adding a framework for this use case (portfolio with scroll animations) is architectural bloat. Frameworks excel at complex state management and component reuse; this project has neither need.

### State Management (Redux, Zustand, Pinia)
**Why not:** Portfolio has minimal state (lightbox open/closed, video playing/paused). DOM itself is the state store. Adding state management is over-engineering.

### CSS-in-JS (Styled Components, Emotion)
**Why not:** Project uses standard CSS imported via Vite. CSS-in-JS adds runtime cost and complexity without benefit for static portfolio.

### Testing Libraries (Jest, Vitest, Playwright)
**Why not:** Portfolio site with primarily visual/animation work. Visual regression testing would be valuable but is expensive to maintain. Manual QA + Lighthouse CI is sufficient for this project scale.

### Animation Libraries Beyond GSAP
**Anime.js, Motion One, Framer Motion:** GSAP is already chosen and best-in-class. Don't fragment animation approaches.

### Video Player Libraries
**Video.js, Plyr, MediaElement.js:** Native HTML5 `<video>` is sufficient. These libraries add 150-300kb for features (custom controls, DRM, adaptive streaming) that portfolio doesn't need.

### UI Component Libraries
**Bootstrap, Tailwind, Material UI:** Portfolio is custom-designed editorial aesthetic. Component libraries fight against custom design. Stick with custom CSS.

### Backend-as-a-Service
**Firebase, Supabase, Appwrite:** No backend needs beyond newsletter signup (handled by Buttondown API). Adding BaaS is architectural complexity without benefit.

## Version Pinning Strategy

**GSAP:** Pin minor version (`^3.14.2`) - GSAP has excellent backward compatibility within major versions
**Vite:** Pin minor version (`^7.3.1`) - Breaking changes rare in Vite, but build tool stability matters
**GLightbox:** Pin minor version (`^3.3.0`) - UX consistency important for lightbox
**Sharp:** Pin minor version (`^0.33.0`) - Image output consistency matters
**Others:** Allow patch updates (`^x.y.z`) - Security fixes without breaking changes

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Video lightbox (GLightbox) | HIGH | Well-established library, perfect fit for requirements |
| Video optimization (FFmpeg + HTML5) | HIGH | Industry standard approach, proven pattern already in codebase |
| Buttondown integration | MEDIUM | API is straightforward but untested with GSAP-heavy site; may need performance tuning |
| GSAP plugins (SplitText, Flip) | HIGH | Official GSAP plugins, well-documented, proven in editorial contexts |
| Image optimization (Sharp) | HIGH | Industry standard, fast, reliable |
| Performance monitoring | MEDIUM | Tools are standard but video-heavy sites are challenging; LCP thresholds may need adjustment |

## Sources

**Primary sources (training knowledge, January 2025):**
- GSAP official documentation and plugin ecosystem
- GLightbox GitHub repository and documentation
- Buttondown API documentation
- Web.dev performance best practices
- FFmpeg video encoding guides
- Vite plugin ecosystem

**Confidence note:** External tool availability not verified via live web search due to tool restrictions. Recommendations based on training knowledge (current as of January 2025). For production, verify:
1. GLightbox current version and npm availability
2. Buttondown API v1 endpoint stability
3. Sharp compatibility with Node 18+
4. Vite plugin ecosystem for any newer alternatives

**Verification recommended:**
- Test GLightbox with GSAP ScrollTrigger interactions (ensure no scroll jank)
- Verify Buttondown CORS policy for client-side API calls
- Benchmark video file sizes after encoding (aim for <5MB per featured work video)
- Test performance on actual mobile devices, not just DevTools throttling
