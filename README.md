# RandyCounsman.com

Portfolio site for Randy Counsman, a nonfiction video producer. The site is heavy on scroll-driven animations — they're a core part of the experience, not just decoration.

## Pages

The site is a multi-page static site. Each HTML file lives at the repo root:

- **index.html** — The primary portfolio page. Hero zoom, parallax rack-focus, horizontal scroll gallery, credits table, and stats section.
- **index-legacy.html** — Archived legacy version with a full-screen video and image slider.
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

## Deployment

The live site at `www.randycounsman.com` currently sits behind Cloudflare, but it does not appear to be fully hosted on Cloudflare Pages yet.

- DNS for `www.randycounsman.com` resolves to Cloudflare IPs, so Cloudflare is the edge layer.
- The live HTTP response still exposes GitHub Pages / Fastly headers such as `x-github-request-id`, `x-served-by`, `x-fastly-request-id`, and `via: 1.1 varnish`.
- In practical terms: Cloudflare is proxying the site, while GitHub Pages still appears to be the origin.

Until that changes, treat `gh-pages` as the current production origin branch rather than assuming Cloudflare Pages is the deploy target.

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

## Password-protected portfolio variants

Portfolio variants live under `portfolio/<slug>/`. For example, the June 2026 portfolio shell is `portfolio/0626/index.html`, and the page sets its data slug with:

```html
<body data-portfolio-slug="0626">
```

At runtime, the password gate fetches `/data/portfolios/<slug>.enc.json`. For `0626`, the committed production payload is:

```text
public/data/portfolios/0626.enc.json
```

Do not hand-edit that encrypted file. Edit the plaintext source file instead:

```text
portfolio-data/0626.json
```

`portfolio-data/` is gitignored intentionally. Keep plaintext client-specific portfolio data and real passwords out of git. The encrypted JSON is committed so the static site can serve it, but this is client-side encryption: anyone can download the ciphertext and attempt an offline password attack. Use a strong password, and do not treat this as a secure vault for material that cannot be publicly exposed under any circumstance.

Portfolio data uses this shape:

```json
{
  "projects": [
    {
      "id": "my-project",
      "title": "My Project",
      "portfolioSection": "short-form",
      "tag": "Producer / Editor",
      "videoUrl": "https://example.com/video.mp4",
      "liveUrl": "https://example.com",
      "screenshots": [
        "images/portfolio/my-project-01.jpg",
        "images/portfolio/my-project-02.jpg"
      ]
    }
  ]
}
```

Common fields:

- `title` — row title
- `tag` — small right-side label
- `portfolioSection` — section placement; use `short-form`, `long-form`, `pitch decks`, or `websites`
- `screenshots` — image strip paths relative to `public/`
- `videoUrl` — makes the `View` pill open a video lightbox
- `liveUrl` — makes the `View ↗` pill open an external page

To add or change entries:

```sh
mkdir -p portfolio-data
# edit portfolio-data/0626.json
just portfolio-encrypt 0626
npm run build
```

Encryption reads `PORTFOLIO_<SLUG>_PASSWORD` from `.env`; for `0626`, set `PORTFOLIO_0626_PASSWORD=...`. During local development, Vite serves `portfolio-data/<slug>.json` directly and any non-empty password unlocks the gate. If edits do not appear after unlocking once, clear session storage or close and reopen the tab because unlocked data is cached in `sessionStorage`.

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
- Accordian with bkg transition - [MB Studio](https://www.mb.studio)
