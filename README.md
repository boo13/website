# RandyCounsman.com

Static portfolio site for Randy Counsman. Pages live at the repo root (`index.html`, `work.html`, `contact.html`, plus archival `index_old.html`/`index2.html`). Scripts (`Slider.js`, `Video.js`, `script.js`) and styles (`styles.css`, `styles_contact.css`, `fadein.css`) are plain browser files.

## Running locally
- No build step is required. Open `index.html` directly or serve the root to avoid CORS issues for media.
- Example local server:
  ```sh
  # from repo root
  python -m http.server 4000
  # or
  npx serve .
  ```
- Ensure network access for CDN-loaded GSAP if testing offline.

## Development notes
- Scripts are loaded as deferred globals (no bundler). Keep new JS in the same pattern unless you add a build step.
- Assets live in `images/`, `video/`, and `favicon/`; optimize media before committing.
- `codepen_examples/` contains standalone experiments; `SDE_Web/website/` is legacy. Avoid mixing those with production page changes.

## Contributing
- Use small, focused commits with imperative messages (e.g., `update hero video`, `tweak contact form spacing`).
- For visual changes, include a brief note on tested browsers/devices and, if possible, before/after screenshots.
