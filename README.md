# RandyCounsman.com

Portfolio site for Randy Counsman, a nonfiction video producer. The site is heavy on scroll-driven animations — they're a core part of the experience, not just decoration.

## Pages

The site is a multi-page static site. Each HTML file lives at the repo root:

- **index2.html** — The primary portfolio page. Hero zoom, parallax rack-focus, horizontal scroll gallery, credits table, and stats section.
- **index.html** — An alternate landing with a full-screen video and image slider.
- **contact.html** — Contact form powered by Formspree.
- **resume.html** — Printable resume layout built to match the site's typography.
- **examples_mockup.html** — Static comps that showcase layout explorations.
- **sandbox.html** — A GSAP demo playground for text animation timing/easing experiments.

## How it's built

The site uses [Vite](https://vite.dev/) for bundling and [GSAP](https://gsap.com/) (installed via npm) for animations. Each page has its own JavaScript entry point in `src/` that imports its CSS and wires up any interactive behavior.

```
src/
  main.js                 # index2.html entry — imports all scroll sections
  main-index.js           # index.html entry — Slider + ResponsiveVideo
  main-contact.js         # contact.html entry — form handler
  main-resume.js          # resume.html entry — typography + layout tweaks
  main-examples-mockup.js # examples_mockup.html entry — grabs static styles
  sections/               # one file per scroll section (landing, featured-work, gallery, credits, about)
  animations/             # shared GSAP setup (plugin registration)
  components/             # reusable DOM components (Slider, ResponsiveVideo)
  styles/                 # CSS per page, imported from each entry point
  config.js               # shared breakpoints and timing values
```

Static assets (images, video, data, favicon) live in `public/` and get copied as-is to the build output.

## Running locally

```sh
npm install
npm run dev
```

This starts the Vite dev server with hot module replacement. Open the URL it prints (usually `http://localhost:5173`).

Other commands:

- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint on `src/`
- `npm run format` — run Prettier on `src/`

## How the animations work

Each section on the main page (index2.html) exports an `init` function that sets up its GSAP animations inside a `gsap.context()` scoped to that section's DOM element. The entry point (`src/main.js`) calls each init function on page load.

GSAP's ScrollTrigger plugin drives most of the effects — pinning sections, scrubbing timelines based on scroll position, and triggering horizontal movement in the gallery. All sections respect `prefers-reduced-motion` and fall back to static layouts on mobile.

## Contributing

- Use small, focused commits with imperative messages (e.g., `update hero video`, `tweak contact form spacing`).
- For visual changes, include a brief note on tested browsers/devices and, if possible, before/after screenshots.
- Optimize media before committing — video and image files are large.
