# Codebase Concerns

**Analysis Date:** 2026-01-12

## Security

**Exposed API Key in Client-Side Code:**
- File: `v4/newsletter.js` (line 8)
- Issue: Buttondown API key hardcoded: `const BUTTONDOWN_API_KEY = '13cbf2fb-...'`
- Risk: Anyone viewing source can access newsletter API
- Current mitigation: None
- Recommendations: Move API calls to backend proxy, or use Buttondown's public form endpoint

## Performance Bottlenecks

**Unthrottled Resize Event Listener:**
- File: `js/Video.js` (line 19)
- Problem: `window.addEventListener('resize', () => this.updateVideoSource())` fires on every pixel
- Measurement: Not profiled, but resize events fire 100+ times during resize
- Cause: No debouncing or throttling
- Improvement path: Use `ResizeObserver` or debounce with 150ms delay

**Repeated DOM Queries in Animation Loop:**
- File: `js/Slider.js` (lines 53-54)
- Problem: `document.querySelectorAll('.img')` called twice in `animateSlide` method
- Cause: Not caching selector results
- Improvement path: Store reference once at top of method

**Memory Leak Risk - Event Listeners:**
- File: `js/Video.js` (lines 26-28, 52-58)
- Problem: `loadeddata` and `loadedmetadata` listeners added without removal on source change
- Impact: Listeners accumulate over multiple source switches
- Improvement path: Remove listener after first firing with `{ once: true }` or manual removal

## Tech Debt

**Debug Logging in Production Code:**
- Files: `v4/animations.js` (lines 13, 52, 120-188), `v2/scripts.js` (line 62)
- Issue: Extensive `console.log/warn/error` statements throughout
- Why: Development debugging left in place
- Impact: Performance overhead, verbose console output
- Fix approach: Wrap in `if (DEBUG)` flag or remove for production

**Large Monolithic Files:**
- File: `v4/CinematicZoom.js` (622 lines)
- File: `v4/animations.js` (519 lines)
- Issue: Multiple concerns in single files
- Why: Rapid prototyping
- Impact: Hard to maintain and understand
- Fix approach: Extract `ParallaxLayer.js`, `PerformanceOptimizations.js`, etc.

**Multiple Unmaintained Versions:**
- Files: `index_old.html`, `v2/`, `css/styles2.css`, `css/styles3.css`, `css/styles3-v2.css`
- Issue: Multiple versions without clear deprecation path
- Why: Iterative design exploration
- Impact: Confusion about which files are active
- Fix approach: Archive old versions to separate branch or clearly mark as deprecated

## Known Bugs

**No Critical Bugs Detected**

Minor issues:
- Empty `404.html` file (0 bytes) - should have content
- Some alt attributes on images are empty (accessibility concern)

## Fragile Areas

**Global Click Event Delegation:**
- File: `js/Slider.js` (line 111)
- Why fragile: `document.addEventListener('click')` catches ALL clicks on page
- Common failures: Interferes with other click handlers if not properly scoped
- Safe modification: Add click handler to slider container only, not document
- Test coverage: None

**Video Loading Timeout:**
- File: `js/Video.js` (line 32)
- Why fragile: 5-second hardcoded timeout for loading overlay
- Common failures: Slow networks may not load video in 5s, fast networks waste user's time
- Safe modification: Use video events (`canplay`, `loadeddata`) instead of timeout
- Test coverage: None

## Missing Critical Features

**No Automated Testing:**
- File: `package.json` (line 7)
- Problem: `"test": "echo \"Error: no test specified\" && exit 1"`
- Current workaround: Manual testing in browser
- Blocks: Confident refactoring, catching regressions
- Implementation complexity: Low (Vitest + basic tests)

**No Error Handling for Video Loading:**
- File: `js/Video.js`
- Problem: No `error` event listener on video element
- Current workaround: 5-second timeout hides spinner regardless
- Blocks: User feedback on failed video loads
- Implementation complexity: Low (add error listener and user-facing message)

**No Linting/Formatting Enforcement:**
- Files: ESLint and Prettier installed but unconfigured
- Problem: No consistent code style enforcement
- Current workaround: Manual review
- Blocks: Consistent code quality
- Implementation complexity: Low (add config files and npm scripts)

## Test Coverage Gaps

**Slider Navigation Logic:**
- What's not tested: Boundary conditions (first/last slide), animation timing
- Risk: Regressions in navigation behavior
- Priority: Medium
- Difficulty to test: Low (unit tests with mock DOM)

**Responsive Video Switching:**
- What's not tested: Aspect ratio detection, source switching, playback preservation
- Risk: Video fails on specific devices/orientations
- Priority: High
- Difficulty to test: Medium (need to mock matchMedia)

**Form Submission:**
- What's not tested: Formspree integration, validation
- Risk: Forms stop working without notice
- Priority: Low (Formspree handles server-side)
- Difficulty to test: Medium (need integration test setup)

## Dependencies at Risk

**jQuery (Legacy):**
- File: `work.html`
- Risk: Only page still using jQuery (3.6.0), inconsistent with rest of codebase
- Impact: Extra 87KB download for one page
- Migration plan: Rewrite work.html to use vanilla JS or GSAP

**GSAP CDN Availability:**
- Files: All HTML pages
- Risk: CDN outage breaks all animations
- Impact: Slider non-functional, video overlay stuck
- Migration plan: Consider self-hosting GSAP files

## Positive Findings

- Clean HTML structure with proper semantic elements
- Good use of GSAP with proper plugin registration
- Accessibility considerations (prefers-reduced-motion in v4)
- Proper lazy loading attributes on images
- Video autoplay/muted attributes correctly set
- Form uses Formspree (reduces security burden)
- No XSS vulnerabilities detected
- `.gitignore` properly configured
- CSS variables for design tokens

---

*Concerns audit: 2026-01-12*
*Update as issues are fixed or new ones discovered*
