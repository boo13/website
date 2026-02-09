# Codebase Concerns

**Analysis Date:** 2026-02-08

## Resolved (Vite Migration)

The following concerns from the 2026-01-12 audit have been resolved:

- ~~Exposed API Key in v4/newsletter.js~~ — v4/ no longer exists
- ~~GSAP CDN Availability~~ — GSAP now installed via npm
- ~~jQuery (Legacy)~~ — jQuery removed entirely
- ~~No Linting/Formatting Enforcement~~ — ESLint + Prettier now configured
- ~~Multiple Unmaintained Versions~~ — v2/, v4/ no longer in active architecture
- ~~Global Click Event Delegation in js/Slider.js~~ — old code replaced with ES modules
- ~~Script Loading Order~~ — Vite handles module bundling
- ~~Classes on window object~~ — now ES modules

## Active Concerns

### No Automated Testing

- **Problem:** No test framework configured; package.json has no test script
- **Current workaround:** Manual testing in browser
- **Blocks:** Confident refactoring, catching regressions
- **Implementation complexity:** Low (Vitest + basic tests)

### No Error Handling for Video Loading

- **File:** `src/components/responsive-video.js`
- **Problem:** No `error` event listener on video element; no user-facing feedback on failed loads
- **Implementation complexity:** Low

### Debug Logging

- **Problem:** `console.log` statements may exist in src/ files; ESLint console rule is set to `off`
- **Impact:** Verbose console output in production
- **Fix approach:** Enable ESLint `no-console` rule (warn), clean up existing statements

### Transition Incomplete

- **Problem:** `index.html` (legacy Slider page) and `index2.html` (new scroll-based site) both exist at the repo root
- **Impact:** Unclear which is the canonical homepage; both have Vite entry points
- **Fix approach:** Complete migration, make index2.html the primary index.html

### Performance — Large Media Assets

- **Problem:** Large video and image files in `public/` may affect initial load times
- **Impact:** Slow experience on mobile or constrained networks
- **Fix approach:** Audit asset sizes, consider lazy loading, compression, or CDN delivery

### No Pre-commit Hooks

- **Problem:** No husky or lint-staged configured
- **Impact:** Lint/format rules can be bypassed on commit
- **Implementation complexity:** Low

## Test Coverage Gaps

- **Responsive Video Switching:** Aspect ratio detection, source switching, playback preservation
- **Section Initialization:** ScrollTrigger setup, pin behavior, cleanup via gsap.context()
- **Form Submission:** Formspree integration on contact page

## Positive Findings

- Clean ES module architecture with section-based organization
- Vite build system with HMR
- ESLint + Prettier configured with npm scripts
- GitHub Actions CI/CD pipeline for deployment
- GSAP self-hosted via npm (no CDN dependency)
- `gsap.context()` cleanup pattern used per section
- Section-based code organization (`src/sections/`)
- Loading screen with font-ready detection
- CSS variables for design tokens
- No XSS vulnerabilities detected
- `.gitignore` properly configured

---

*Concerns audit: 2026-02-08*
*Previous audit: 2026-01-12*
*Update as issues are fixed or new ones discovered*
