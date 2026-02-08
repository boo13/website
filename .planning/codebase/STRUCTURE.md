# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
website/
├── index.html              # Legacy landing page (Slider + ResponsiveVideo)
├── index2.html             # New primary GSAP-animated single-page portfolio
├── contact.html            # Contact form (Formspree)
├── resume.html             # Resume page
├── examples_mockup.html    # Image sequence demo
├── sandbox.html            # Development sandbox
│
├── src/                    # All source code (Vite-bundled)
│   ├── sections/           # One file per scroll section
│   │   ├── landing.js
│   │   ├── featured-work.js
│   │   ├── gallery.js
│   │   ├── credits.js
│   │   └── about.js
│   ├── animations/         # Shared animation utilities
│   │   ├── scroll-defaults.js   # Registers GSAP + ScrollTrigger
│   │   └── text-mask-rise.js    # Text reveal animation
│   ├── components/         # Reusable DOM components
│   │   ├── slider.js
│   │   └── responsive-video.js
│   ├── styles/             # CSS per page (imported from JS entry points)
│   │   ├── index.css
│   │   ├── index2.css
│   │   ├── contact.css
│   │   ├── credits.css
│   │   ├── resume.css
│   │   ├── work.css
│   │   └── examples-mockup.css
│   ├── config.js           # Shared breakpoints, timing values
│   ├── main.js             # Entry for index2.html
│   ├── main-index.js       # Entry for index.html (legacy)
│   ├── main-contact.js     # Entry for contact.html
│   ├── main-credits.js     # Entry for credits.html (standalone CreditsTable)
│   ├── main-resume.js      # Entry for resume.html
│   ├── main-work.js        # Entry for work.html
│   └── main-examples-mockup.js  # Entry for examples_mockup.html
│
├── public/                 # Static assets (copied as-is by Vite)
│   ├── data/               # JSON data files (projects.json)
│   ├── favicon/            # Favicon suite
│   ├── images/             # Image assets
│   ├── video/              # Video assets (WebM)
│   └── CNAME               # Custom domain config
│
├── dist/                   # Vite build output (gitignored)
├── .github/                # CI/CD
│   ├── workflows/
│   │   ├── deploy.yml      # Build + deploy to GitHub Pages
│   │   └── site-monitor.yml
│   ├── scripts/
│   └── lighthouserc.json
├── .planning/              # Documentation
│   └── codebase/           # This documentation
├── tasks/                  # Planning documents
├── screenshots/            # Development screenshots
├── logs/                   # Log files
│
├── vite.config.js          # Multi-page Vite config
├── eslint.config.js        # ESLint flat config
├── .prettierrc             # Prettier config
├── package.json            # npm config
├── package-lock.json       # npm lockfile
├── CLAUDE.md               # Project instructions
├── DECISIONS.md            # Design rationale
├── ROADMAP.md              # Project roadmap
├── README.md               # Quick start
└── CNAME                   # Custom domain
```

## Directory Purposes

**src/**
- Purpose: All application source code, bundled by Vite
- Contains: JS entry points, sections, animations, components, styles
- Organization: By concern (sections, animations, components, styles)

**src/sections/**
- Purpose: One file per scroll section of the single-page portfolio (index2.html)
- Contains: Each file exports an `initSectionName()` function called from `main.js`
- Key files: `landing.js`, `featured-work.js`, `gallery.js`, `credits.js`, `about.js`

**src/animations/**
- Purpose: Shared GSAP animation utilities
- Contains: Plugin registration, reusable animation patterns
- Key files: `scroll-defaults.js` (registers GSAP + ScrollTrigger), `text-mask-rise.js`

**src/components/**
- Purpose: Reusable DOM components
- Contains: ES module classes for interactive elements
- Key files: `slider.js`, `responsive-video.js`

**src/styles/**
- Purpose: CSS per page, imported from JS entry points (Vite handles bundling)
- Contains: Page-specific stylesheets
- Key files: `index2.css` (primary portfolio), `index.css` (legacy)

**public/**
- Purpose: Static assets copied as-is by Vite to build output
- Contains: Images, video, favicon suite, JSON data, CNAME
- Subdirectories: `data/`, `favicon/`, `images/`, `video/`

**dist/**
- Purpose: Vite production build output
- Source: `npm run build`
- Committed: No (in `.gitignore`)

**.github/**
- Purpose: CI/CD workflows and tooling
- Contains: GitHub Actions deploy workflow, Lighthouse config
- Key files: `workflows/deploy.yml`

## Key File Locations

**Entry Points:**
- `index2.html` → `src/main.js` — Primary GSAP-animated portfolio
- `index.html` → `src/main-index.js` — Legacy landing page
- `contact.html` → `src/main-contact.js` — Contact form
- `resume.html` → `src/main-resume.js` — Resume page
- `examples_mockup.html` → `src/main-examples-mockup.js` — Image sequence demo

**Configuration:**
- `vite.config.js` — Multi-page Vite build config
- `eslint.config.js` — ESLint flat config
- `.prettierrc` — Prettier config
- `package.json` — npm dependencies and scripts
- `CNAME` — Custom domain (randycounsman.com)

**Core Logic:**
- `src/config.js` — Shared breakpoints, timing values
- `src/animations/scroll-defaults.js` — GSAP plugin registration + ScrollTrigger defaults
- `src/sections/*.js` — Section init functions for index2.html
- `src/components/slider.js` — Portfolio carousel (legacy)
- `src/components/responsive-video.js` — Responsive video handling (legacy)

**Testing:**
- None (no test files)

**Documentation:**
- `CLAUDE.md` — Project architecture and conventions
- `DECISIONS.md` — Design rationale
- `ROADMAP.md` — Project roadmap
- `README.md` — Quick start guide

## Naming Conventions

**Files:**
- kebab-case: `featured-work.js`, `scroll-defaults.js`, `responsive-video.js`
- UPPERCASE: `README.md`, `CLAUDE.md`, `DECISIONS.md`, `ROADMAP.md`, `CNAME`
- `main-*.js` prefix: Page-specific entry points

**Directories:**
- lowercase: `src/`, `sections/`, `animations/`, `components/`, `styles/`, `public/`
- Plural for collections: `images/`, `styles/`, `sections/`

**Special Patterns:**
- Section files map 1:1 to scroll sections in `index2.html`
- Entry point naming: `main-{page}.js` corresponds to `{page}.html`
- CSS naming: matches the HTML page it styles (e.g., `contact.css` for `contact.html`)

## Where to Add New Code

**New Scroll Section:**
- Implementation: `src/sections/{section-name}.js`
- Export: `initSectionName()` function
- Registration: Import and call from `src/main.js`
- Styles: Add to `src/styles/index2.css` or create section-specific partial

**New Animation Utility:**
- Implementation: `src/animations/{utility-name}.js`
- Pattern: Export a reusable function, import where needed

**New Reusable Component:**
- Implementation: `src/components/{component-name}.js`
- Pattern: Follow `slider.js` or `responsive-video.js` structure

**New CSS Styles:**
- Page-specific: `src/styles/{page}.css`, imported from the page's entry point
- Shared variables: Add to existing CSS or `src/config.js` for JS-accessible values

**New HTML Page:**
- HTML file: Root directory `{page}.html`
- Entry point: `src/main-{page}.js` (imports styles + initializes components)
- Vite config: Add to `input` in `vite.config.js`
- Styles: `src/styles/{page}.css`

**New Static Assets:**
- Images: `public/images/` (optimize before commit)
- Video: `public/video/` (WebM format preferred)
- Data: `public/data/`

## Special Directories

**.planning/**
- Purpose: Codebase documentation and analysis
- Source: Maintained manually
- Committed: Yes

**dist/**
- Purpose: Vite production build output
- Source: `npm run build`
- Committed: No (in `.gitignore`)

**node_modules/**
- Purpose: npm dependencies (GSAP, Vite, ESLint, Prettier)
- Source: `npm install`
- Committed: No (in `.gitignore`)

**tasks/**
- Purpose: Planning and task tracking documents
- Committed: Yes

**logs/**
- Purpose: Development log files
- Committed: Varies

**screenshots/**
- Purpose: Development screenshots for reference
- Committed: Yes

---

*Structure analysis: 2026-02-08*
*Update when directory structure changes*
