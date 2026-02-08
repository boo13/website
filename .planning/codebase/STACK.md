# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- HTML5 — Page content (`index.html`, `index2.html`, `contact.html`, `resume.html`, `sandbox.html`)
- CSS3 (vanilla, no preprocessor) — Per-page stylesheets imported from JS entry points, bundled by Vite
- JavaScript (ES modules, `"type": "module"`) — Section-based architecture under `src/`

**Secondary:**
- JSON — Configuration and data (`public/data/Projects.json`, `package.json`)

## Runtime

**Environment:**
- Browser-based (no Node.js backend)
- Static site built by Vite, deployed to GitHub Pages
- Node.js 20 used in CI

**Package Manager:**
- npm with lockfile (`package-lock.json`)

## Frameworks

**Core:**
- None (vanilla JS, no framework)

**Animation:**
- GSAP 3.14.2 (installed via npm, not CDN)
  - ScrollTrigger — Scroll-driven animations
  - CustomEase — Custom easing curves
  - Observer — Input/gesture observation

**Testing:**
- None (manual testing only)

**Build/Dev:**
- Vite 7.3.1 — Bundler, dev server, HMR
- ESLint 9.39.2 — Flat config (`eslint.config.js`) with `@eslint/js`, `eslint-config-prettier`, browser globals
- Prettier 3.7.4 — Configured in `.prettierrc` (semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 80)
- globals 17.0.0 — ESLint browser globals

**Dev Commands:**
- `npm run dev` — Vite dev server with HMR
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally
- `npm run lint` — ESLint on `src/`
- `npm run format` — Prettier on `src/`

## Key Dependencies

**Critical:**
- GSAP — Animation engine for scroll-driven sections, slider transitions, cinematic zoom
- ScrollTrigger plugin — Scroll-driven animations across all sections
- CustomEase plugin — Custom easing curves
- Observer plugin — Input/gesture observation

**Infrastructure:**
- Adobe Typekit — Custom web fonts loaded via CSS link
- No jQuery (removed entirely)
- No TypeScript

## Configuration

**Environment:**
- No environment variables required (static site)
- No `.env` files (Formspree/Buttondown APIs are public-facing)

**Build:**
- `vite.config.js` — Vite configuration (multi-page build with rollup input entries)
- `eslint.config.js` — ESLint flat config
- `.prettierrc` — Prettier formatting rules
- `package.json` — npm metadata, scripts, dependencies (`"type": "module"`)

## Platform Requirements

**Development:**
- Node.js 20+
- npm
- `npm run dev` starts Vite dev server with HMR

**Production:**
- GitHub Pages — Deployed via GitHub Actions (`deploy.yml` runs `npm ci && npm run build`, uploads `dist/`)
- Static file hosting (no server-side processing)
- Modern browser with ES module support

---

*Stack analysis: 2026-02-08*
*Update after major dependency changes*
