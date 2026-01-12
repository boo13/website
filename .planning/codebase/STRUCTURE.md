# Codebase Structure

**Analysis Date:** 2026-01-12

## Directory Layout

```
website/
├── index.html              # Production landing page
├── work.html               # Portfolio grid
├── contact.html            # Contact form (Formspree)
├── credits.html            # Full filmography
├── 404.html                # GitHub Pages 404 fallback
├── index_old.html          # Archived version
├── index3.html             # Experimental prototype
│
├── css/                    # Stylesheets
│   ├── styles.css          # Primary global styles
│   ├── styles_contact.css  # Contact page specific
│   ├── fadein.css          # Animation utilities
│   ├── styles2.css         # Legacy (work.html)
│   ├── styles3.css         # index3 variant
│   └── styles3-v2.css      # index3 variant v2
│
├── js/                     # Production JavaScript
│   ├── script.js           # DOMContentLoaded orchestrator
│   ├── Slider.js           # Slider carousel class
│   └── Video.js            # Responsive video class
│
├── v2/                     # Previous iteration (archived)
│   ├── index3-animations.js
│   ├── menu.js
│   ├── scripts.js
│   ├── styles.css
│   ├── video.js
│   └── zoom-transition.js
│
├── v4/                     # Next generation (active development)
│   ├── index.html          # Cinematic zoom landing
│   ├── CinematicZoom.js    # Main animation controller
│   ├── animations.js       # Scroll orchestration
│   ├── styles.css          # v4-specific styles
│   ├── newsletter.js       # Email signup
│   ├── parallax-test.html  # Experimental variant
│   └── README.md           # v4 documentation
│
├── images/                 # Image assets
│   ├── portfolio-{1-5}.jpg # Slider images
│   ├── portfolio/          # Portfolio subfolder
│   ├── icons/              # SVG social icons
│   ├── logos/              # Brand assets
│   └── unused/             # Archived images
│
├── video/                  # Video assets
│   ├── LandingPageMontagev04.2.webm    # 16:9 standard
│   ├── LandingPageMontagev05_9x16.webm # 9:16 vertical
│   └── [project reels]                  # Individual project clips
│
├── data/                   # Structured data
│   └── Projects.json       # Filmography metadata
│
├── favicon/                # Favicon suite
│   ├── apple-touch-icon.png
│   ├── favicon-*.png
│   ├── favicon.ico
│   └── site.webmanifest
│
├── screenshots/            # Prototype screenshots
├── scripts/                # Utility scripts
├── tasks/                  # Planning documents
│
├── .planning/              # GSD workflow
│   └── codebase/           # This documentation
│
├── package.json            # npm configuration
├── package-lock.json       # npm lockfile
├── CLAUDE.md               # Project instructions
├── README.md               # Quick start guide
├── CNAME                   # Custom domain config
└── .gitignore              # VCS ignore rules
```

## Directory Purposes

**css/**
- Purpose: All stylesheets
- Contains: Global styles, page-specific styles, animation utilities
- Key files: `styles.css` (primary, 745 lines)
- Subdirectories: None

**js/**
- Purpose: Production JavaScript classes
- Contains: ES6 class definitions, initialization script
- Key files: `Slider.js` (155 lines), `Video.js` (63 lines), `script.js` (4 lines)
- Subdirectories: None

**v4/**
- Purpose: Next-generation cinematic zoom prototype
- Contains: Complete v4 implementation (not yet deployed to main)
- Key files: `CinematicZoom.js` (622 lines), `animations.js` (519 lines)
- Note: Active development, not production

**images/**
- Purpose: All image assets
- Contains: Portfolio images, icons, logos, profile photos
- Key files: `portfolio-{1-5}.jpg` (slider images)
- Subdirectories: `icons/`, `logos/`, `portfolio/`, `unused/`

**video/**
- Purpose: Video assets
- Contains: WebM video files in multiple aspect ratios
- Key files: `LandingPageMontagev04.2.webm` (16:9), `LandingPageMontagev05_9x16.webm` (9:16)
- Subdirectories: None

**data/**
- Purpose: Structured content data
- Contains: JSON metadata for filmography
- Key files: `Projects.json` (25+ projects)
- Note: Not yet used in production (prepared for dynamic rendering)

**favicon/**
- Purpose: Browser and device icons
- Contains: Full favicon suite for all platforms
- Key files: `site.webmanifest`, `apple-touch-icon.png`

## Key File Locations

**Entry Points:**
- `index.html` - Main landing page
- `v4/index.html` - Cinematic zoom prototype
- `js/script.js` - JavaScript initialization

**Configuration:**
- `package.json` - npm dependencies
- `CNAME` - Custom domain
- `.gitignore` - Git ignore rules

**Core Logic:**
- `js/Slider.js` - Portfolio carousel
- `js/Video.js` - Responsive video handling
- `v4/CinematicZoom.js` - Cinematic zoom controller

**Testing:**
- None (no test files)

**Documentation:**
- `CLAUDE.md` - Project architecture and conventions
- `README.md` - Quick start guide
- `v4/README.md` - v4 implementation notes

## Naming Conventions

**Files:**
- kebab-case: `styles_contact.css`, `portfolio-1.jpg`
- PascalCase: `Slider.js`, `Video.js`, `CinematicZoom.js` (class files)
- UPPERCASE: `README.md`, `CLAUDE.md`, `CNAME`

**Directories:**
- lowercase: `css/`, `js/`, `images/`, `video/`
- Version prefixes: `v2/`, `v4/`
- Plural for collections: `images/`, `scripts/`

**Special Patterns:**
- Version suffixes: `styles3-v2.css`, `LandingPageMontagev04.2.webm`
- Aspect ratio indicators: `_9x16` suffix for vertical videos

## Where to Add New Code

**New JavaScript Component:**
- Implementation: `js/{ComponentName}.js`
- Registration: Add conditional instantiation to `js/script.js`
- Pattern: Follow `Slider.js` or `Video.js` structure

**New CSS Styles:**
- Global: Extend `css/styles.css`
- Page-specific: Create `css/styles_{page}.css`
- Variables: Add to `:root` in `css/styles.css`

**New HTML Page:**
- Implementation: Root directory `{page}.html`
- Styles: Link to `css/styles.css` + page-specific
- Scripts: Include deferred GSAP + component scripts

**New Assets:**
- Images: `images/` (optimize before commit)
- Video: `video/` (WebM format preferred)
- Icons: `images/icons/`

**v4 Development:**
- All v4 code: `v4/` directory
- Isolated from production until ready

## Special Directories

**.planning/**
- Purpose: GSD workflow documentation
- Source: Generated by codebase mapping
- Committed: Yes

**v2/**
- Purpose: Archived previous iteration
- Source: Historical code
- Status: Not in active use

**v4/**
- Purpose: Next-generation prototype
- Source: Active development
- Status: Not yet deployed to production

**node_modules/**
- Purpose: npm dependencies (dev tools only)
- Source: `npm install`
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-01-12*
*Update when directory structure changes*
