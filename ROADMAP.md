# Portfolio Website Roadmap

## Current Status

**Transitioning:** index.html → index2.html as primary page

index2.html is the new GSAP-animated single-page portfolio. index.html (legacy slider version) will be archived once index2 is ready to ship.

---

## Tech Stack

- **Vite** — bundler, dev server, HMR
- **GSAP 3.14** — ScrollTrigger, CustomEase, SplitText
- **Vanilla JS** — section-based architecture in `src/sections/`
- **GitHub Pages** — deployed at randycounsman.com

---

## Completed ✅

### Structure & Setup
- [x] Vite build system configured
- [x] Section-based JS architecture (`src/sections/`)
- [x] Dark cinematic design with Typekit fonts
- [x] Loading screen with spinner
- [x] Deployed to GitHub Pages

### Hero Section
- [x] Hero with looping background video montage
- [x] Name + tagline with mask-rise text animation
- [x] Social links (LinkedIn, Vimeo, Email)

### Featured Work: Wyatt Earp
- [x] Parallax rack-focus effect (layered PNGs)
- [x] Netflix logo + press quotes
- [x] ScrollTrigger-driven blur transitions

### Gallery Section
- [x] Horizontal scroll triggered by vertical scroll
- [x] 3 project cards with hover video preview
- [x] Network logos, titles, roles, years
- [x] Progress indicator (1/3)

### Credits Section
- [x] Table layout structure
- [x] Cursor-tracking preview image (wired)
- [x] Data loading placeholder

### About Section
- [x] Stats display (15+ years, 20M+ views, Top 3 Netflix, Emmy Nominated)
- [x] Network marquee (Netflix, History, PBS, etc.)
- [x] Summary tagline
- [x] Resume link

### Contact Section
- [x] Location display
- [x] Email, LinkedIn, Vimeo links
- [x] Footer with copyright

---

## Remaining Work

### Content & Polish
- [ ] Add real video clips for gallery cards (currently using placeholder)
- [ ] Populate credits table with actual data
- [ ] Review/finalize all copy
- [ ] Add project-specific videos to each gallery card

### Animation Refinement
- [ ] About section scroll-reveal animations
- [ ] Credits table hover-preview behavior
- [ ] Gallery card entrance animations
- [ ] Contact section animations

### Testing & QA
- [ ] Test on Chrome, Safari, Firefox (desktop)
- [ ] Test on iPhone and Android
- [ ] Verify video playback across platforms
- [ ] Check load time / performance

### Final Polish
- [ ] Add favicon and meta tags (OG image, etc.)
- [ ] Proofread all copy
- [ ] Remove console logs / dead code
- [ ] Test contact links work

---

## Pages

| Page | Entry | Status |
|------|-------|--------|
| index2.html | main.js | **New primary** — in development |
| contact.html | main-contact.js | Form handler |
| resume.html | main-resume.js | Resume page |
| index.html | main-index.js | Legacy — to be archived/renamed |

### Transition Plan
- [ ] Finish index2.html
- [ ] Rename index.html → index-legacy.html (or delete)
- [ ] Rename index2.html → index.html

---

## Ship Criteria

- Hiring manager understands who you are in 10 seconds
- Can watch compelling clips of best work
- Shows leadership and range (TV, news, streaming)
- Feels cinematic, not generic
- Actually ships — done beats perfect
