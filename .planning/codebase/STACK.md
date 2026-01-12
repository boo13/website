# Technology Stack

**Analysis Date:** 2026-01-12

## Languages

**Primary:**
- HTML5 - All page content (`index.html`, `work.html`, `contact.html`, `credits.html`, `v4/index.html`)
- CSS3 (vanilla, no preprocessor) - `css/styles.css`, `css/styles_contact.css`, `css/fadein.css`, `v4/styles.css`
- JavaScript (ES6+) - `js/Slider.js`, `js/Video.js`, `js/script.js`, `v4/CinematicZoom.js`, `v4/animations.js`

**Secondary:**
- JSON - Configuration and data (`data/Projects.json`, `package.json`)

## Runtime

**Environment:**
- Browser-based (no Node.js backend)
- Static HTML/CSS/JS served via GitHub Pages
- No build step required

**Package Manager:**
- npm (for dev tooling only)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- None (vanilla browser stack)

**Animation:**
- GSAP 3.x (CDN-loaded) - Core animation library
  - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.1/gsap.min.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js`
  - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js` (v4 only)

**Testing:**
- None (manual testing only)

**Build/Dev:**
- No bundler (vanilla browser files)
- ESLint 9.39.2 - Linting (installed but unconfigured)
- Prettier 3.7.4 - Code formatting (installed but unconfigured)

## Key Dependencies

**Critical:**
- GSAP - Animation engine for slider transitions and cinematic zoom
- CustomEase plugin - Custom easing curves ("hop" curve in Slider)
- ScrollTrigger plugin - Scroll-driven animations (v4 CinematicZoom)

**Infrastructure:**
- jQuery 3.6.0 (legacy, `work.html` only) - CDN loaded from Google
- Adobe Typekit - Custom web fonts (ivypresto-display, Bebas Neue)

## Configuration

**Environment:**
- No environment variables required (static site)
- No `.env` files (Formspree/Buttondown APIs are public-facing)

**Build:**
- No build configuration files
- No TypeScript (`tsconfig.json` not present)
- `package.json` - npm metadata only

## Platform Requirements

**Development:**
- Any platform with modern browser
- Local server recommended for CORS: `npx serve .` or `python -m http.server 4000`
- Network access for CDN-loaded GSAP and Typekit fonts

**Production:**
- GitHub Pages (automatic deployment from `gh-pages` branch)
- Static file hosting (no server-side processing)
- Modern browser with ES6+ support

---

*Stack analysis: 2026-01-12*
*Update after major dependency changes*
