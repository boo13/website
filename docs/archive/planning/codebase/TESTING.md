# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework

**Runner:**
- None currently configured
- No test files exist in codebase (`__tests__/`, `*.test.js`, `*.spec.js`)
- `package.json`: `"test": "echo \"Error: no test specified\" && exit 1"`

## Current Testing Approach

**Manual testing is the primary QA approach.**

Cross-browser validation: Chrome, Firefox, Safari. Check responsive behavior at mobile/tablet/desktop breakpoints. Verify animations, video autoplay/loading, slider navigation, form interactions. Ensure console is error-free.

**Manual Test Areas:**

1. **Section Initialization** — each `initSectionName()` function in `src/sections/`
2. **GSAP Animation Setup** — ScrollTrigger configs, pin behavior, timeline sequencing
3. **CreditsTable** — data loading from JSON, column sorting, responsive layout
4. **Responsive Video** — source switching based on viewport/aspect ratio
5. **Slider Navigation** — click-based nav, preview thumbnails, boundary conditions
6. **Loading Screen Sequence** — font-ready → fade → dispatch event → init landing
7. **Browser Compatibility** — video format support (WebM), GSAP animation consistency
8. **Accessibility** — reduced motion preference (planned)

## Development Tooling

**Linting (ESLint):**
- ESLint 9 with flat config (`eslint.config.js`)
- Uses `@eslint/js` recommended + `eslint-config-prettier` + browser globals
- Rules: `no-unused-vars` warn, `no-undef` warn, `no-console` off
- Run: `npm run lint`

**Formatting (Prettier):**
- Configured via `.prettierrc`
- Settings: semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 80
- Run: `npm run format`

**Type Checking:**
- Not applicable (vanilla JavaScript, no TypeScript)

## Dev Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint on src/
npm run format    # Prettier on src/
```

## CI/CD

- **GitHub Actions** runs `npm ci && npm run build` on deploy — build errors block deploy
- **Lighthouse** — `.github/lighthouserc.json` exists for performance monitoring
- No pre-commit hooks (no husky/lint-staged)

## Coverage

- No coverage targets or tooling
- 0% automated test coverage
- Relies entirely on manual testing

## Recommended Test Strategy

If implementing automated testing:

**Unit Tests (Vitest recommended):**
- Section `init*()` function setup (DOM queries, event listeners)
- CreditsTable data parsing and sort logic
- Slider navigation logic (boundary conditions, direction)
- Video source selection based on viewport

**Integration Tests:**
- Section initialization with real DOM
- GSAP ScrollTrigger creation and pin behavior
- Loading screen → landing section handoff
- Event listener behavior across components

**E2E Tests (Playwright recommended):**
- Full scroll-through of all sections on index2.html
- Slider navigation flow on index.html
- Video playback and responsive source switching
- Contact form submission (Formspree integration)
- Cross-browser visual testing

## Quality Assurance Process

**Current Workflow:**
1. Make changes locally
2. Run `npm run lint` and `npm run format`
3. Test manually in browser (`npm run dev`)
4. Check console for errors
5. Verify responsive behavior
6. Run `npm run build` to catch build errors
7. Commit and push — GitHub Actions deploys to gh-pages
8. Verify on production site

---

*Testing analysis: 2026-02-08*
*Update when test patterns change*
