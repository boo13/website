# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**Contact Form:**
- Formspree - Email form submission backend
  - Endpoint: `https://formspree.io/f/xyzyzvyn`
  - Location: `contact.html` (form action attribute)
  - Auth: None required (public form endpoint)
  - Form fields: name, email (`_replyto`), message, subject

**Newsletter:**
- None — Buttondown integration removed (was in `v4/` which no longer exists)

## Data Storage

**Databases:**
- None — Static site with no backend database

**File Storage:**
- Local assets only
  - Videos: `public/video/` directory
  - Images: `public/images/` directory
  - No external CDN for media

**Caching:**
- Browser caching only (no service worker)

## Authentication & Identity

- None — Public portfolio site with no authentication or OAuth

## Monitoring & Observability

**Site Monitoring:**
- GitHub Actions workflow: `.github/workflows/site-monitor.yml`
- Lighthouse CI config: `lighthouserc.json`

**Error Tracking:**
- None — No Sentry, Bugsnag, or similar

**Analytics:**
- None — No Google Analytics, Mixpanel, or similar tracking

## CI/CD & Deployment

**Hosting:**
- GitHub Pages via GitHub Actions
  - Workflow: `.github/workflows/deploy.yml`
  - Trigger: push to `gh-pages` branch or manual dispatch
  - Process: checkout → setup Node 20 → `npm ci` → `npm run build` → upload `dist/` → deploy
  - Custom domain: configured via `CNAME` file (also in `public/CNAME`)

## Environment Configuration

**Development:**
- No environment variables required
- `npm run dev` — Vite dev server with HMR
- Typekit font CDN requires network access

**Staging:**
- None — Direct to production workflow

**Production:**
- Static files served from GitHub Pages
- No secrets management needed (all third-party services are public-facing)

## External Resources

**GSAP (Animation):**
- Installed via npm (`gsap` package) — no CDN dependency
- Plugins: ScrollTrigger, CustomEase, Observer

**Fonts:**
- Adobe Typekit: `use.typekit.net` (web fonts loaded via CSS link in HTML)
- No Google Fonts in current pages

**jQuery:**
- Removed entirely — no jQuery dependency

## Webhooks & Callbacks

- None (incoming or outgoing)

## Social Media Links (Non-API)

Direct links only, no API integration:
- LinkedIn: `linkedin.com/in/randycounsman/`
- Vimeo: `vimeo.com/randycounsman`
- IMDB: `imdb.com/name/nm3442225/`
- Email

---

*Integration audit: 2026-02-08*
*Update when adding/removing external services*
