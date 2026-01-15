# Ralph Fix Plan

## High Priority

### Phase 1: Foundation
- [ ] Create `index6.html` base structure with all 6 section containers
- [ ] Set up GSAP 3.12+ with ScrollTrigger CDN imports
- [ ] Create base `css/styles6.css` with reset, variables, and section scaffolding
- [ ] Implement responsive breakpoints (desktop, tablet, mobile)

### Phase 2: Hero Section
- [ ] Implement hero section with video background (`LandingPageMontagev04.2.webm`)
- [ ] Add headline "Randy Counsman" and subtitle "Nonfiction Video Development & Production"
- [ ] Add social icons (LinkedIn, Vimeo, Email)
- [ ] Create `js/hero-zoom.js` with z-depth zoom transition
- [ ] Pin hero section until scroll threshold, then z-translate backward

### Phase 3: Wyatt Earp Signature Section
- [ ] Implement parallax section with layered PNGs (`Wyatt_Layer01_v01.png`, `Wyatt_Layer02_v01.png`)
- [ ] Create `js/parallax.js` with rack-focus blur effect (BG blur 6px → 0, FG inverse)
- [ ] Add Netflix logo and "Wyatt Earp and The Cowboy War" title
- [ ] Add pull quotes (Wall Street Journal, The Spectator, Decider)
- [ ] Implement scroll-driven animation timeline (0-25% sharpen, 25-75% parallax, 75-100% fade)

## Medium Priority

### Phase 4: Featured Works Gallery
- [ ] Create `js/gallery.js` for horizontal scroll behavior
- [ ] Build gallery cards (~60vw × 70vh)
- [ ] Implement vertical-scroll-to-horizontal-scroll conversion
- [ ] Add video hover playback (muted, autoplay)
- [ ] Populate with 3 featured projects:
  - The Men Who Built America (History, Emmy-nominated)
  - Pope: The Most Powerful Man in History (CNN)
  - Capsized: Blood in the Water (Discovery)
- [ ] Add network logos, titles, roles, years to cards

### Phase 5: Additional Credits
- [ ] Create `js/credits.js` for hover preview interaction
- [ ] Build credits table (Title, Network columns)
- [ ] Implement hover image preview (fixed left, cursor Y follow)
- [ ] Populate with 10 credits:
  - Roman Empire (Netflix)
  - Making of the Mob (AMC)
  - The American West (AMC)
  - American Genius (Nat Geo)
  - American Playboy (Amazon)
  - The World Wars (History)
  - Hamilton: Building America (History)
  - Sitting Bull (History)
  - The Interrogator (Investigation Discovery)
  - Secrets to Success with Daymond John (CNBC)

### Phase 6: About Section
- [ ] Implement split stats with scroll-reveal animations
- [ ] Add 4 stats: 15+ years, 20M+ views, Netflix Top 3, Emmy-nominated
- [ ] Create network logo marquee (auto-scroll, subtle)
- [ ] Add logos: Netflix, History, PBS, AMC, Amazon, Nat Geo, Discovery, CNN, CNBC, Fox Nation
- [ ] Add summary line and "Full Resume →" CTA

## Low Priority

### Phase 7: Contact Section
- [ ] Build contact section layout
- [ ] Add location (New York, NY), email, LinkedIn, Vimeo links
- [ ] Style CTA: "Let's make something"

### Phase 8: Polish & Optimization
- [ ] Optimize performance (lazy-load videos, preload hero)
- [ ] Add `will-change` hints sparingly
- [ ] Test and fix tablet responsive layout (horizontal → vertical gallery)
- [ ] Test and fix mobile responsive layout (simplified transitions)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile browser testing (iOS Safari, Android Chrome)
- [ ] Performance audit (FCP <1.5s, LCP <2.5s, CLS <0.1, 60fps)

## Completed
- [x] Project initialization
- [x] PRD analysis and planning

## Notes

### Existing Assets Available
- `LandingPageMontagev04.2.webm` - Hero video
- `Wyatt_Layer01_v01.png`, `Wyatt_Layer02_v01.png` - Parallax layers
- `Cowboy.War.10secReel.v01_1920x1080.webm` - Wyatt reel
- `Capsized.10secReel.v01_1920x1080.webm` - Capsized reel
- Network logos (various)
- Portfolio key art images

### Assets Still Needed (from client)
- 10-second video reels for: MWBA, Pope
- Network logos in white SVG format (optional)

### Key References
- Existing `CinematicZoom.js` patterns in v4 folder
- Existing parallax logic in `v4/parallax-test.html`
- Hover preview pattern in `resume.html`

### Design Decision (from PRD)
Use 3 additional projects in gallery (not Wyatt Earp) since Wyatt already has dedicated parallax showpiece section.
