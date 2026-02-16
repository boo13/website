# RandyCounsman.com

Portfolio site for Randy Counsman, a nonfiction video producer. The site is heavy on scroll-driven animations — they're a core part of the experience, not just decoration.

## Pages

The site is a multi-page static site. Each HTML file lives at the repo root:

- **index.html** — The primary portfolio page. Hero zoom, parallax rack-focus, horizontal scroll gallery, credits table, and stats section.
- **index-legacy.html** — Archived legacy version with a full-screen video and image slider.
- **index2.html** — Temporary redirect shim to `/` for stale bookmarks.
- **contact.html** — Contact form powered by Formspree.
- **resume.html** — Printable resume layout built to match the site's typography.
- **sandbox.html** — A GSAP demo playground for text animation timing/easing experiments.

## How it's built

The site uses [Vite](https://vite.dev/) for bundling and [GSAP](https://gsap.com/) (installed via npm) for animations. Each page has its own JavaScript entry point in `src/` that imports its CSS and wires up any interactive behavior.

```
src/
  main.js                 # index.html entry — imports all scroll sections
  main-index.js           # index-legacy.html entry — Slider + ResponsiveVideo
  main-contact.js         # contact.html entry — form handler
  main-resume.js          # resume.html entry — typography + layout tweaks
  sections/               # one file per scroll section (hero, featured-work, gallery, credits, about)
  animations/             # shared GSAP setup (plugin registration)
  components/             # reusable DOM components (Slider, ResponsiveVideo)
  styles/                 # CSS per page, imported from each entry point
  config.js               # shared breakpoints, timing values, CDN base URL
```

Static assets (images, data, favicon) live in `public/` and get copied as-is to the build output. Video files are hosted on [Cloudflare R2](https://developers.cloudflare.com/r2/) and referenced via CDN URLs — they are not stored in the git repository.

## Running locally

```sh
npm install
npm run dev
```

This starts the Vite dev server with hot module replacement. Open the URL it prints (usually `http://localhost:5173`).
`npm install` also runs hook setup (`postinstall`), which configures `core.hooksPath=.githooks` and repairs `CLAUDE.md`/`GEMINI.md` symlinks to `AGENTS.md`.
If you skipped install scripts, run `npm run setup-hooks` manually.

Other commands:

- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint on `src/`
- `npm run format` — run Prettier on `src/`

## How the animations work

Each section on the main page (index.html) exports an `init` function that sets up its GSAP animations inside a `gsap.context()` scoped to that section's DOM element. The entry point (`src/main.js`) calls each init function on page load.

GSAP's ScrollTrigger plugin drives most of the effects — pinning sections, scrubbing timelines based on scroll position, and triggering horizontal movement in the gallery. All sections respect `prefers-reduced-motion` and fall back to static layouts on mobile.

## Video assets

Videos are hosted on a Cloudflare R2 bucket (`portfolio-assets`) and served via CDN. They are **not** committed to the git repo — `public/video/` is gitignored.

- **CDN base URL** is defined in `src/config.js` as `CDN_BASE`
- **Upload new/optimized videos** with `npx wrangler r2 object put portfolio-assets/video/FILENAME --file public/video/FILENAME --content-type video/webm --remote`
- **Optimize before uploading** with `bash scripts/optimize-videos.sh INPUT_FILE [--suffix 360p] [--max-width 1920] [--max-height 1080]` (outputs both `.webm` VP9 + `.mp4` H.264 into `public/video/`)

## Contributing

- Use small, focused commits with imperative messages (e.g., `update hero video`, `tweak contact form spacing`).
- For visual changes, include a brief note on tested browsers/devices and, if possible, before/after screenshots.
- Optimize images before committing. Video files go to R2, not the repo.

## Credit where due...
- [GSAP - Flip Hero/Footer Toggle](https://codepen.io/GreenSock/pen/ByzPBmd)
- [GSAP - Staggered Text Effect](https://codepen.io/GreenSock/pen/podRjbe)
- playwright-cli > playwright-mcp - [Playwright CLI vs MCP - a new tool for your coding agent](https://youtu.be/Be0ceKN81S8?si=04om80p0jWT96KDO)
- Footer design/transition - [1820Productions](https://www.1820productions.com/)
- Screensaver animation - [JasonBergh](https://www.JasonBergh.com/)
- Cursor effect - [Sileent](https://www.sileent.com/)
