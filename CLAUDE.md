# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static portfolio website for Randy Counsman (Documentary Producer) deployed via GitHub Pages. The site features responsive video backgrounds, an image slider component, and a minimalist design using vanilla JavaScript with GSAP animations.

## Architecture & Key Components

### Page Structure
- **Root pages**: `index.html` (main landing), `work.html`, `contact.html`
- **Archived versions**: `index_old.html`, `index2.html` (reference only)
- **Legacy prototype**: `SDE_Web/website/` (separate older implementation; avoid unless explicitly needed)
- **Experiments**: `codepen_examples/` (isolated demos; not integrated into main site)

### JavaScript Architecture
The site uses a modular class-based approach with deferred script loading:

1. **ResponsiveVideo** (`js/Video.js`): Handles video loading overlays and responsive source switching based on aspect ratio. Automatically switches between standard (16:9) and vertical (9:16) video sources. Manages the loading spinner that displays while video loads (5s timeout).

2. **Slider** (`js/Slider.js`): Portfolio image carousel with GSAP-powered transitions. Uses custom "hop" easing curve for smooth animations. Handles click-based navigation (left/right half clicks), preview thumbnails, and slide counter/title synchronization.

3. **Main initialization** (`js/script.js`): DOMContentLoaded orchestrator that instantiates ResponsiveVideo and Slider if their respective DOM elements exist.

All classes are exposed on `window` object and initialized conditionally based on DOM presence, allowing shared scripts across pages with different features.

### Styling System
- **Global**: `styles.css` (typography, layout grid, slider, video sections)
- **Page-specific**: `styles_contact.css` (contact form), `fadein.css` (animation utilities)
- **CSS Variables**: Root-level design tokens for fonts (`--ff-ivy`, `--ff-bebas`) and colors (`--clr-offwhite`, `--clr-nearblack`)
- **Layout**: CSS Grid with snap-scrolling sections; 2-space indentation standard

### External Dependencies
- **GSAP 3.x**: Core animation library (loaded from CDN)
- **CustomEase**: GSAP plugin for custom easing curves
- **Adobe Fonts (Typekit)**: `ivypresto-display` serif font family

## Development Workflow

### Local Development
```sh
# No build step required - static HTML/CSS/JS
# Serve locally to avoid CORS issues with video/assets:
npx serve .
# or
python -m http.server 4000
```

### Testing
- No automated test framework
- Manual cross-browser validation required: Chrome, Firefox, Safari
- Check responsive behavior at mobile/tablet/desktop breakpoints
- Verify video autoplay/loading, slider navigation, form interactions
- Ensure console is error-free

### Git Workflow
- **Branch**: `gh-pages` (main branch for GitHub Pages deployment)
- **Commit style**: Imperative mood, concise (e.g., `"fix slider autoplay pause"`, `"update hero typography"`)
- **Pre-commit**: Optimize images/video before committing; remove unused assets

## Code Conventions

### JavaScript
- **Classes**: PascalCase (e.g., `ResponsiveVideo`, `Slider`)
- **Functions/variables**: camelCase
- **GSAP usage**: Register plugins before use; prefer named easing functions

### HTML/CSS
- **Files**: kebab-case for assets and CSS classes
- **Inline styles**: Minimize; prefer class-based styling
- **Comments**: Add brief context for non-obvious CSS sections or complex selectors
- **Images**: Include descriptive `alt` attributes; use poster images for video fallbacks

### Asset Management
- **Images**: `images/` directory; optimize before commit (compressed PNG/JPEG, web dimensions)
- **Video**: `video/` directory; provide WebM format with fallback messaging
- **Icons**: `images/icons/` for SVG social icons
- **Favicon**: `favicon/` with full suite (apple-touch-icon, manifest, etc.)

## Common Patterns

### Adding a New Page
1. Create HTML file in root (e.g., `newpage.html`)
2. Link to `styles.css` and relevant page-specific CSS
3. Include deferred scripts: GSAP, CustomEase, then `js/Slider.js`, `js/Video.js`, `js/script.js`
4. Use `.snap-sections` container for scroll-snap layout if needed
5. Test responsive video/slider components if used

### Modifying Slider
- Images expected at `./images/portfolio-{1-5}.jpg`
- Update `totalSlides` property if changing slide count
- Sync counter/title arrays in HTML with image count
- Custom easing registered in constructor; modify "hop" curve as needed

### Video Source Management
- Standard aspect ratio: `./video/LandingPageMontagev04.2.webm`
- Vertical (9:16): `./video/LandingPageMontagev05_9x16.webm`
- ResponsiveVideo switches sources on resize via `matchMedia('(max-aspect-ratio: 9/16)')`
- Always include `autoplay loop muted playsinline` attributes and poster image

## Deployment

Deployment is automatic via GitHub Pages from the `gh-pages` branch. Commits to this branch trigger rebuilds. No separate build/deploy commands needed.
