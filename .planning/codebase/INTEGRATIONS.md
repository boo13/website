# External Integrations

**Analysis Date:** 2026-01-12

## APIs & External Services

**Contact Form:**
- Formspree - Email form submission backend
  - Endpoint: `https://formspree.io/f/xyzyzvyn`
  - Location: `contact.html` (form action attribute)
  - Auth: None required (public form endpoint)
  - Form fields: name, email (`_replyto`), message, subject

**Newsletter (v4 only):**
- Buttondown - Newsletter subscription API
  - Endpoint: `https://api.buttondown.email/v1/subscribers`
  - Location: `v4/newsletter.js`
  - Auth: API key in client-side code (security concern)
  - Note: API key exposed in source - should be moved to backend

## Data Storage

**Databases:**
- Not detected - Static site with no backend database

**File Storage:**
- Local assets only
  - Videos: `video/` directory (WebM format)
  - Images: `images/` directory (JPG, PNG)
  - No external CDN for media

**Caching:**
- Browser caching only (no service worker or Redis)

## Authentication & Identity

**Auth Provider:**
- Not detected - Public portfolio site with no authentication

**OAuth Integrations:**
- None

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Bugsnag, or similar

**Analytics:**
- Not detected - No Google Analytics, Mixpanel, or similar tracking

**Logs:**
- Browser console only (development)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
  - Branch: `gh-pages` (main deployment branch)
  - Deployment: Automatic on push
  - Custom domain: Configured via `CNAME` file

**CI Pipeline:**
- Not detected - No GitHub Actions workflows

## Environment Configuration

**Development:**
- No environment variables required
- Local server for CORS: `npx serve .` or `python -m http.server 4000`
- CDN dependencies (GSAP, Typekit) require network access

**Staging:**
- Not detected - Direct to production workflow

**Production:**
- Static files served from GitHub Pages
- No secrets management needed (all third-party services are public-facing)

## External Resources (CDN)

**Animation Libraries:**
- GSAP Core: `cdnjs.cloudflare.com/ajax/libs/gsap/3.11.1/gsap.min.js`
- CustomEase: `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js`
- ScrollTrigger: `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js`

**Fonts:**
- Adobe Typekit: `use.typekit.net/gya6int.css` (main pages)
- Adobe Typekit: `use.typekit.net/bnp0hyp.css` (v4 pages)
- Google Fonts: `fonts.googleapis.com` (Lato, Poppins)

**jQuery (legacy):**
- Google CDN: `ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js` (work.html only)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Social Media Links (Non-API)

Direct links only, no API integration:
- LinkedIn: `linkedin.com/in/randycounsman/`
- Vimeo: `vimeo.com/randycounsman`
- IMDB: `imdb.com/name/nm3442225/`

---

*Integration audit: 2026-01-12*
*Update when adding/removing external services*
