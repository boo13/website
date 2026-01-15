# Portfolio Homepage Redesign PRD

A cinematic, scroll-driven portfolio for Randy Counsman—a video producer and Creative Director specializing in nonfiction content across television, streaming, news, and social.

---

## Design Philosophy

**Goal**: Create a "this is clearly custom-built" experience that showcases video production craft through the website itself. The site should feel like a cinematic journey, not a static portfolio.

**Core Techniques**:
- Z-depth zoom transitions (performant 3D transforms)
- Parallax rack-focus effect (layered image blur/movement)
- Horizontal scroll gallery
- Scroll-triggered animations via GSAP

---

## User Journey

```
┌─────────────────────────────────────────────────────────┐
│  1. HERO                                                │
│     "Randy Counsman" + "Nonfiction Video Development    │
│     & Production" over looping montage video            │
│     ↓ scroll triggers z-zoom "push through"             │
├─────────────────────────────────────────────────────────┤
│  2. SIGNATURE PROJECT: Wyatt Earp                       │
│     Full parallax rack-focus with layered PNGs          │
│     BG blurs → sharpens, FG sharpens → blurs            │
│     Title, Netflix logo, pull quotes fade in            │
│     ↓ fades to black, transitions to next section       │
├─────────────────────────────────────────────────────────┤
│  3. FEATURED WORKS (4 total)                            │
│     Horizontal scroll gallery                           │
│     Video reels play on hover/focus                     │
│     Network logos + titles visible                      │
├─────────────────────────────────────────────────────────┤
│  4. ADDITIONAL CREDITS                                  │
│     Table/list with hover-preview images                │
│     (Resume.html style interaction)                     │
├─────────────────────────────────────────────────────────┤
│  5. ABOUT                                               │
│     Split stats with scroll-reveal animations           │
│     Network logo marquee                                │
│     Single-line summary + "Full Resume →" link          │
├─────────────────────────────────────────────────────────┤
│  6. CONTACT                                             │
│     Location, email, LinkedIn, Vimeo                    │
│     CTA: "Let's make something"                         │
└─────────────────────────────────────────────────────────┘
```

---

## Section Specifications

### 1. Hero Section

| Property | Value |
|----------|-------|
| Background | `LandingPageMontagev04.2.webm` (existing) |
| Headline | "Randy Counsman" |
| Subtitle | "Nonfiction Video Development & Production" |
| Icons | LinkedIn, Vimeo, Email (existing) |
| Transition | Z-zoom: name/text recedes into distance, video "opens up" revealing Section 2 |

**Scroll Behavior**: Pinned until scroll progress reaches threshold, then z-translate moves hero layer backward while next layer approaches.

---

### 2. Signature Project: Wyatt Earp

| Property | Value |
|----------|-------|
| Layers | `Wyatt_Layer01_v01.png` (BG), `Wyatt_Layer02_v01.png` (FG) |
| Effect | Parallax rack-focus (existing v4/parallax-test.html logic) |
| Content | Netflix logo, "Wyatt Earp and The Cowboy War" title |
| Quotes | Wall Street Journal, The Spectator, Decider |

**Animation Timeline** (scroll-driven):
1. 0-25%: BG sharpens (blur 6px → 0), FG stays sharp
2. 25-75%: Text layer readable, both layers parallax-move
3. 75-100%: Both layers fade to black, transition to Section 3

---

### 3. Featured Works Gallery

| Property | Value |
|----------|-------|
| Layout | Horizontal scroll (cards shift left as user scrolls vertically) |
| Projects | 4 total (Wyatt Earp included OR 3 additional) |
| Card Size | ~60vw width, 70vh height |
| Media | Video reel plays on hover (muted, autoplay) |

**Candidate Projects** (select 3-4):
- The Men Who Built America (History, Emmy-nominated)
- Pope: The Most Powerful Man in History (CNN)
- Human: The World Within (Netflix/PBS)
- upNEXT News (Creative Director role)
- Sons of Liberty (History)
- Capsized: Blood in the Water (Discovery Shark Week)

**Card Content**:
- Network logo (top corner)
- Video thumbnail → video on hover
- Project title
- Role + year

> [!IMPORTANT]
> **Decision needed**: Should Wyatt Earp also appear in this gallery (as first card), or should the parallax section BE its gallery moment? I recommend **3 additional projects** here since Wyatt already has a showpiece moment.

---

### 4. Additional Credits

| Property | Value |
|----------|-------|
| Layout | Table with 2 columns: Title, Network |
| Interaction | Hover triggers image preview (resume.html pattern) |
| Preview Position | Fixed left side, follows cursor Y position |

**Credits to include** (from resume.html):
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

---

### 5. About Section

**Split Stats** (reveal on scroll):

| Stat | Context |
|------|---------|
| 15+ years | Bringing nonfiction stories to major networks |
| 20M+ views | Low-cost interview series featuring MrBeast |
| Netflix Top 3 | Wyatt Earp & The Cowboy War global ranking |
| Emmy-nominated | The World Wars, The Men Who Built America |

**Network Logo Parade**:
Horizontal auto-scroll marquee (subtle, slow) featuring:
Netflix, History, PBS, AMC, Amazon, Nat Geo, Discovery, CNN, CNBC, Fox Nation

**Summary Line**:
> "Hands-on producer translating strategic direction into premium television, streaming, and social content."

**CTA**: "Full Resume →" linking to `/resume.html`

---

### 6. Contact Section

| Element | Value |
|---------|-------|
| Location | New York, NY |
| Email | RandyCounsman@gmail.com |
| LinkedIn | linkedin.com/in/randycounsman |
| Vimeo | vimeo.com/randycounsman |
| CTA | "Let's make something" or "Go ahead, say hi" |

---

## Technical Approach

### Animation Library
- **GSAP 3.12+** with ScrollTrigger plugin
- Leverage existing `CinematicZoom.js` patterns from v4

### Performance Considerations
- Z-transforms are GPU-accelerated (avoid `top`/`left` animation)
- Lazy-load video reels (play only on hover or when in viewport)
- Use `will-change: transform` sparingly
- Preload hero video; defer gallery videos

### Responsive Strategy
- Desktop: Full experience with all effects
- Tablet: Horizontal scroll converts to vertical swipe gallery
- Mobile: Simplified transitions, video thumbnails instead of autoplay

---

## Asset Requirements

### Existing Assets ✓
- [x] `LandingPageMontagev04.2.webm` (hero video)
- [x] `Wyatt_Layer01_v01.png`, `Wyatt_Layer02_v01.png` (parallax layers)
- [x] `Cowboy.War.10secReel.v01_1920x1080.webm` (Wyatt reel)
- [x] `Capsized.10secReel.v01_1920x1080.webm`
- [x] Network logos (various)
- [x] Portfolio key art images

### Assets Needed
- [ ] 10-second video reels for remaining featured projects (MWBA, Pope, etc.)
- [ ] Layered PNGs for additional projects (optional, for future parallax)
- [ ] Network logos in consistent format (white SVG preferred)

---

## File Structure

```
website/
├── index2.html          ← New homepage (rebuild)
├── css/
│   └── styles.css      ← Updated styles
├── js/
│   ├── hero-zoom.js    ← Z-depth hero transition
│   ├── parallax.js     ← Wyatt Earp rack-focus
│   ├── gallery.js      ← Horizontal scroll gallery
│   └── credits.js      ← Hover preview interaction
├── video/              ← Existing reels
├── images/
│   ├── portfolio/      ← Key art
│   └── logos/          ← Network logos
└── resume.html         ← Existing (linked from About)
```

---

## Verification Plan

### Browser Testing
- Chrome, Safari, Firefox (latest)
- iOS Safari, Android Chrome

### Performance Targets
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Smooth 60fps scroll animations

### Manual Checks
- [ ] Hero z-zoom feels smooth, not jarring
- [ ] Wyatt Earp parallax focus effect is cinematic
- [ ] Horizontal gallery responds correctly to scroll
- [ ] Hover previews appear without lag
- [ ] About stats animate in on scroll
- [ ] All links functional (resume, Vimeo, LinkedIn, email)
- [ ] Mobile layout is usable (no broken interactions)
