# Repository Guidelines

## Project Structure & Module Organization
- Primary pages live at the repo root (`index.html`, `work.html`, `contact.html`, plus archived `index_old.html`/`index2.html`).
- Shared styling is in `css/styles.css`, with page-specific variants such as `css/styles_contact.css` and `css/fadein.css`; global scripts sit in `js/script.js`, `js/Slider.js`, and `js/Video.js`.
- Assets are in `images/`, `video/`, and `favicon/`; keep new media there and prefer existing naming patterns.
- `codepen_examples/` holds standalone experiments and should not be bundled into the main site; `SDE_Web/website/` is an older prototype—touch only when explicitly needed.

## Build, Test, and Development Commands
- The site is static; no build step is required. Open `index.html` directly or serve locally to avoid CORS issues.
- Example local server: `npx serve .` or `python -m http.server 4000` from the repo root.
- If you add tooling, keep commands simple and document them in `README.md`.

## Coding Style & Naming Conventions
- Match surrounding indentation when editing (current files lean toward 2 spaces); keep semicolons.
- Browser scripts are plain JS loaded via deferred tags; avoid adding new ES module imports unless there’s a clear benefit.
- Use descriptive, lowercase, kebab-case filenames for assets and CSS classes; use PascalCase for JS classes and camelCase for functions/variables.
- Keep inline styles minimal; prefer class-based styling in the shared CSS. Co-locate page-specific tweaks near related sections with brief comments when non-obvious.

## Testing Guidelines
- No automated test suite yet; perform manual checks in modern Chrome/Firefox/Safari.
- Validate responsive behavior (header, slider, video embeds), run through navigation on desktop and mobile breakpoints, and ensure the console stays clean.
- For content changes, spot-check `contact.html` form interactions and any embedded media.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages similar to existing history (e.g., `update hero typography`, `fix slider autoplay pause`).
- For PRs, include: purpose/summary, affected pages/components, before/after screenshots for visual changes, and a short testing note (browsers/devices checked).
- Keep changes scoped; avoid mixing experimental `codepen_examples` updates with production page edits in the same PR.

## Assets & Performance
- Optimize images/video before committing (prefer compressed PNG/JPEG/MP4/WebM and web-ready dimensions).
- Remove unused media and references to keep payloads light; verify new assets load with appropriate `alt` text and fallback colors/backgrounds.
