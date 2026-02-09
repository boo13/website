# Phase 7: Optimization & Accessibility Polish - Research

**Researched:** 2026-02-09
**Domain:** Web performance optimization, video encoding, accessibility compliance
**Confidence:** HIGH

## Summary

Phase 7 focuses on production readiness through video optimization, build configuration, accessibility compliance, and cross-browser testing. The site is already using WebM format and has `prefers-reduced-motion` handling in place across all animation modules.

**Key findings:**
- GitHub Pages does NOT support Git LFS, so video optimization must focus on aggressive compression rather than LFS tracking
- Current 42MB video directory is within GitHub Pages 1GB limit but needs optimization
- Vite's default esbuild minifier is optimal (20-40x faster than Terser with only 1-2% worse compression)
- Lighthouse CLI provides automated auditing for CI/CD integration
- GSAP's `gsap.matchMedia()` is the recommended pattern for motion preferences (codebase uses simpler `window.matchMedia` which works but is less elegant)

**Primary recommendation:** Use FFmpeg two-pass encoding with VP9 codec (CRF 31-35) and faststart flag to reduce video sizes by 30-50% while maintaining quality. Implement Lighthouse CI for automated performance regression testing.

## Standard Stack

The established tools for optimization and accessibility:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FFmpeg | Latest | Video transcoding/optimization | Industry standard for video processing, used by Netflix/YouTube |
| Lighthouse | 10.x | Performance/accessibility auditing | Official Google tool, WCAG 2.2 compliant |
| Vite | 7.3.1+ | Production bundling | Already in project, excellent defaults |
| GSAP | 3.14.2 | Animation with a11y | Already in project, native matchMedia support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lighthouse-ci | Latest | Automated CI/CD auditing | Optional: for regression testing |
| BrowserStack | SaaS | Real device testing | Optional: if local testing insufficient |
| axe DevTools | Browser ext | Manual accessibility audit | Recommended for final validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VP9 (WebM) | AV1 | AV1 has 50% better compression but limited Safari support (M3+/iPhone 15 Pro+ only) |
| Lighthouse | WebPageTest | WebPageTest offers more detailed waterfall analysis but less WCAG focus |
| esbuild | Terser | Terser minifies 1-2% better but 20-40x slower |

**Installation:**
```bash
# Lighthouse CLI (optional for CI)
npm install --save-dev lighthouse

# FFmpeg via Homebrew (macOS)
brew install ffmpeg
```

## Architecture Patterns

### Video Optimization Strategy
**Current state:** Site uses WebM format, 42MB total video size
**Target state:** 20-25MB total (40-50% reduction) through re-encoding

**Two-tier encoding approach:**
1. **Hero/landing videos** - High quality (CRF 28-31), faststart enabled
2. **Gallery preview videos** - Moderate quality (CRF 33-35), smaller file size

### Lighthouse Audit Workflow
```
1. Local dev audit → lighthouse http://localhost:4173 --view
2. Fix issues
3. Build → npm run build
4. Preview → npm run preview
5. Production audit → lighthouse https://yourdomain.com --view
6. (Optional) CI integration → lighthouse-ci in GitHub Actions
```

### Accessibility Testing Layers
```
Automated (Lighthouse)
  ↓
Manual (screen reader)
  ↓
Real user testing (if possible)
```

### Pattern: FFmpeg Video Optimization Script
**What:** Reusable bash script for consistent video encoding
**When to use:** Processing multiple videos with consistent quality
**Example:**
```bash
#!/bin/bash
# Source: FFmpeg VP9 Encoding Guide (https://wiki.webmproject.org/ffmpeg/vp9-encoding-guide)

INPUT=$1
OUTPUT=$2
CRF=${3:-31}  # Default CRF 31 (Google recommendation for 1080p)

# Two-pass encoding for best quality/size ratio
# Pass 1: Analysis
ffmpeg -i "$INPUT" -c:v libvpx-vp9 -b:v 0 -crf $CRF \
  -pass 1 -an -f null /dev/null

# Pass 2: Encoding with faststart equivalent (WebM doesn't use moov atom)
ffmpeg -i "$INPUT" -c:v libvpx-vp9 -b:v 0 -crf $CRF \
  -pass 2 -c:a libopus -b:a 128k "$OUTPUT"

# Clean up pass log
rm -f ffmpeg2pass-0.log
```

### Pattern: GSAP Motion Preference (Recommended)
**What:** Use `gsap.matchMedia()` for cleaner motion preference handling
**When to use:** New animation modules or refactoring existing ones
**Example:**
```javascript
// Source: GSAP Accessible Animation docs (https://gsap.com/resources/a11y/)
export function initSection() {
  const section = document.querySelector('.my-section');
  if (!section) return () => {};

  const mm = gsap.matchMedia();

  // Full animations for users with no preference set
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.to('.element', {
      x: 100,
      rotation: 360,
      duration: 1
    });
  });

  // Simplified animations for reduced motion users
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.to('.element', {
      opacity: 1,  // Simple fade instead of complex motion
      duration: 0.3
    });
  });

  return () => mm.revert();
}
```

**Note:** Current codebase uses `window.matchMedia` which works correctly but `gsap.matchMedia()` provides better cleanup and is GSAP's recommended pattern.

### Anti-Patterns to Avoid
- **Don't optimize videos manually one-by-one** - Use batch scripts for consistency
- **Don't skip faststart flag on MP4s** - Prevents streaming playback (WebM doesn't need this)
- **Don't remove animations entirely for reduced motion** - Simplify instead (fade vs swipe)
- **Don't test only in Chrome** - Safari has different video codec support
- **Don't run Lighthouse on dev build** - Always audit production build via `npm run preview`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video transcoding | Custom Node.js video processor | FFmpeg CLI scripts | Decades of optimization, hardware acceleration, format support |
| Performance auditing | Custom metrics collection | Lighthouse CLI | Standardized metrics (LCP, CLS, TBT), WCAG compliance checks |
| Minification | Custom AST transformer | Vite's esbuild (default) | Parallelized, 20-40x faster than Terser |
| Accessibility testing | Manual DOM inspection | axe-core + Lighthouse | Detects 57% of WCAG issues automatically |
| Cross-browser testing | Manual VM setup | BrowserStack/Selenium | Real devices, automated screenshots |

**Key insight:** Video optimization is deceptively complex. FFmpeg handles color space conversion, audio resampling, bitrate ladders, and codec quirks that would take months to implement correctly.

## Common Pitfalls

### Pitfall 1: Git LFS on GitHub Pages
**What goes wrong:** Attempting to use Git LFS to manage video files for a GitHub Pages site
**Why it happens:** Git LFS seems like the obvious solution for large files
**How to avoid:** GitHub Pages does NOT support Git LFS (official limitation). Videos must be committed directly or hosted externally (CDN)
**Warning signs:**
- Build succeeds but videos show as text pointers on deployed site
- GitHub Actions show LFS warnings during Pages deployment
**Solution:** Optimize videos aggressively (40-50% reduction possible) and commit directly. 42MB is well within 1GB repo limit.

### Pitfall 2: Missing faststart on MP4 Videos
**What goes wrong:** Video doesn't start playing until fully downloaded
**Why it happens:** Default FFmpeg output places metadata (moov atom) at end of file
**How to avoid:** Always use `-movflags +faststart` flag for MP4 encoding
**Warning signs:** Video works locally but feels slow to start on 3G
**Current status:** Site uses WebM which doesn't have this issue (no moov atom)

### Pitfall 3: Lighthouse Score Variance
**What goes wrong:** Lighthouse scores vary 10-20 points between runs
**Why it happens:** Real network conditions, CPU throttling, background processes
**How to avoid:**
- Run 3+ audits and average scores
- Use `--throttling.cpuSlowdownMultiplier=4` for consistency
- Audit production build, not dev server
- Close other browser tabs during audit
**Warning signs:** Score swings from 85 to 65 between identical runs

### Pitfall 4: ARIA Landmark Over-labeling
**What goes wrong:** Screen readers announce "Site Navigation Navigation" or "Main Content Main"
**Why it happens:** Adding redundant labels like `aria-label="main content"` on `<main>` tag
**How to avoid:** Use implicit semantics first, explicit labels only when multiple landmarks of same type exist
**Warning signs:**
- Every landmark has an `aria-label`
- Labels repeat the landmark role name
**Correct pattern:**
```html
<!-- GOOD: Implicit semantics -->
<main>
  <h1>Page Title</h1>
</main>

<!-- GOOD: Label only when multiple navs exist -->
<nav aria-label="Primary">...</nav>
<nav aria-label="Footer">...</nav>

<!-- BAD: Redundant label -->
<main aria-label="main content">...</main>
```

### Pitfall 5: Testing Only in Chrome DevTools Device Emulation
**What goes wrong:** Site works in Chrome emulation but fails on real iOS Safari
**Why it happens:** Chrome emulation doesn't replicate Safari's WebKit quirks (video autoplay, CSS support)
**How to avoid:** Test on real devices or BrowserStack for iOS Safari, Android Chrome
**Warning signs:**
- Video autoplay works in Chrome but not Safari
- CSS animations behave differently on iOS
- Touch interactions feel off on real devices

### Pitfall 6: Assuming Reduced Motion Means No Motion
**What goes wrong:** Removing all animation makes UI feel broken/unresponsive
**Why it happens:** Misunderstanding the purpose of `prefers-reduced-motion`
**How to avoid:**
- Keep functional animations (loading states, focus indicators)
- Replace large-scale motion with simple fades/opacity changes
- User is avoiding vestibular triggers (parallax, zoom), not all visual feedback
**GSAP recommendation:** "Animations can be important for spatial context—provide alternate animations that gently crossfade opacity instead of using big swiping motions"

## Code Examples

Verified patterns from official sources:

### Video Optimization: Two-Pass VP9 with Quality Target
```bash
# Source: Google VP9 Encoding Guide (https://developers.google.com/media/vp9/settings/vod)
# CRF 31 recommended for 1080p, 36 for 360p, 37 for 240p

# Pass 1
ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 31 \
  -pass 1 -an -f null /dev/null

# Pass 2 with Opus audio
ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 31 \
  -pass 2 -c:a libopus -b:a 128k output.webm
```

### Lighthouse CLI: Automated Audit with Throttling
```bash
# Source: Lighthouse npm docs (https://www.npmjs.com/package/lighthouse)
# Audit production build with consistent throttling
npm run build
npm run preview &  # Start preview server

lighthouse http://localhost:4173 \
  --output html \
  --output json \
  --output-path ./lighthouse-report \
  --throttling.cpuSlowdownMultiplier=4 \
  --view
```

### Vite Build: Production Optimization Config
```javascript
// Source: Vite Build Options (https://vite.dev/config/build-options)
// vite.config.js
export default {
  build: {
    target: 'es2015',           // Modern browsers (Chrome 107+, Safari 16+)
    minify: 'esbuild',          // Default, 20-40x faster than Terser
    cssMinify: true,            // Minify CSS
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],       // Separate GSAP for caching
          vendor: ['glightbox'] // Separate vendor libs
        }
      }
    }
  }
}
```

### ARIA Landmarks: Semantic HTML First
```html
<!-- Source: W3C ARIA Practices (https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) -->

<!-- REQUIRED: One main landmark per page -->
<main>
  <h1>Portfolio</h1>
  <!-- Primary content -->
</main>

<!-- CONDITIONAL: Label only when multiple of same type -->
<nav aria-label="Primary">
  <!-- Main navigation -->
</nav>

<nav aria-label="Social Media">
  <!-- Footer social links -->
</nav>

<!-- Use aria-labelledby to reference heading -->
<section aria-labelledby="featured-heading">
  <h2 id="featured-heading">Featured Work</h2>
</section>
```

### Accessibility: Focus Visible Styles
```css
/* Source: WCAG 2.4.7 Focus Visible (https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) */

/* Modern approach: use :focus-visible to show focus only for keyboard nav */
button:focus-visible,
a:focus-visible {
  outline: 3px solid var(--accent-color);
  outline-offset: 2px;
}

/* Don't remove focus entirely */
button:focus {
  /* outline: none; ❌ NEVER DO THIS */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| H.264 (MP4) only | VP9 (WebM) primary, H.264 fallback | 2024+ | 30% smaller files, universal browser support |
| Webpack | Vite (esbuild) | 2021+ | 20-40x faster builds |
| WCAG 2.1 | WCAG 2.2 | 2023 | New focus visible, dragging requirements |
| Manual a11y testing | Lighthouse + axe-core | Ongoing | 57% automated detection |
| Terser minification | esbuild minification | Vite default | 20-40x faster, 1-2% larger files |
| Git LFS for GitHub Pages | Direct commit or CDN | Always limited | LFS never worked with Pages |

**Deprecated/outdated:**
- **Theora codec**: Being removed from browsers, use VP9/AV1 instead
- **Webpack for new projects**: Vite is faster and simpler
- **`-movflags faststart` for WebM**: Only applies to MP4 (moov atom)
- **`window.matchMedia` for GSAP**: Still works but `gsap.matchMedia()` is cleaner

## Open Questions

Things that couldn't be fully resolved:

1. **Should we migrate to AV1 codec?**
   - What we know: AV1 offers 50% better compression than VP9, supported in Chrome/Firefox/Edge
   - What's unclear: Safari only supports AV1 on M3+ Macs and iPhone 15 Pro+, fallback complexity
   - Recommendation: Stick with VP9 for now. AV1 becomes viable when Safari support reaches 90%+

2. **Is Lighthouse CI worth the setup cost?**
   - What we know: Automated regression testing prevents performance degradation
   - What's unclear: GitHub Actions limits (600 mins/month free tier), setup complexity for static sites
   - Recommendation: Manual audits sufficient for small portfolio site. CI valuable for team projects with frequent deploys

3. **Should we add a UI toggle for reduced motion?**
   - What we know: GSAP docs recommend this for users unaware of system settings
   - What's unclear: How many users need this vs system preference coverage
   - Recommendation: Start with system preference only (already implemented). Add UI toggle only if user feedback requests it

## Sources

### Primary (HIGH confidence)
- [GSAP Accessible Animation](https://gsap.com/resources/a11y/) - Official motion preference patterns
- [Vite Build Options](https://vite.dev/config/build-options) - Official build configuration
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) - Official scoring metrics
- [W3C ARIA Landmark Regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) - Official landmark guidance
- [MDN Web Video Codec Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs) - Browser compatibility matrix
- [Git LFS Official](https://git-lfs.com/) - Official installation and usage
- [FFmpeg VP9 Encoding Guide](https://wiki.webmproject.org/ffmpeg/vp9-encoding-guide) - Google's official VP9 recommendations

### Secondary (MEDIUM confidence)
- [Mux: Optimize Video for Web with FFmpeg](https://www.mux.com/articles/optimize-video-for-web-playback-with-ffmpeg) - Industry best practices
- [Pixel Point: Web Optimized Video with FFmpeg](https://pixelpoint.io/blog/web-optimized-video-ffmpeg/) - VP9 and H.265 comparison
- [Smashing Magazine: Respecting Users' Motion Preferences](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/) - Accessibility design patterns
- [GitHub Community: Git LFS + GitHub Pages Discussion](https://github.com/orgs/community/discussions/50337) - Official limitation confirmation
- [Google VP9 Bitrate Modes](https://developers.google.com/media/vp9/bitrate-modes) - CRF vs CBR guidance
- [Lighthouse npm Package](https://www.npmjs.com/package/lighthouse) - CLI usage and options

### Tertiary (LOW confidence)
- WebSearch: Cross-browser testing tools (BrowserStack, LambdaTest, Selenium) - General market survey, needs validation for specific use case
- WebSearch: Vite vs Webpack benchmarks - Performance claims vary by project size/complexity

## Metadata

**Confidence breakdown:**
- Video optimization (VP9/FFmpeg): HIGH - Official Google docs, verified with existing WebM files in codebase
- Vite build optimization: HIGH - Official Vite docs, existing Vite 7.3.1 in project
- Accessibility (ARIA/WCAG): HIGH - W3C official specs, Lighthouse integration
- GSAP motion preferences: HIGH - Official GSAP docs, existing implementation verified in codebase
- Git LFS limitation: HIGH - Official GitHub documentation and community confirmation
- Cross-browser testing: MEDIUM - Tool recommendations based on market surveys, not tested for this project
- Lighthouse CI setup: MEDIUM - Official tool but ROI unclear for single-developer portfolio

**Research date:** 2026-02-09
**Valid until:** ~60 days (stable technologies, FFmpeg/WCAG specs change slowly)

## Key Takeaways for Planner

1. **Video optimization is critical**: 42MB current size → target 20-25MB (40-50% reduction) via two-pass VP9 encoding
2. **Git LFS is not an option**: GitHub Pages limitation means aggressive compression is the only path
3. **Accessibility mostly done**: `prefers-reduced-motion` already implemented, needs ARIA landmark audit and final Lighthouse check
4. **Build optimization minimal**: Vite defaults are excellent, no custom config needed
5. **Testing focus**: Real device testing (iOS Safari) more valuable than extensive CI setup
6. **FFmpeg script needed**: Create reusable encoding script with CRF 28-31 (hero) and 33-35 (gallery) presets
