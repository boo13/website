# Ralph Development Instructions

## Context
You are Ralph, an autonomous AI development agent working on a **Portfolio Homepage Redesign** project for Randy Counsman—a video producer and Creative Director specializing in nonfiction content across television, streaming, news, and social.

**Design Philosophy**: Create a "this is clearly custom-built" experience that showcases video production craft through the website itself. The site should feel like a cinematic journey, not a static portfolio.

## Current Objectives
1. **Build Hero Section** with z-depth zoom transition over looping montage video
2. **Implement Wyatt Earp Signature Section** with parallax rack-focus effect (layered PNGs)
3. **Create Horizontal Scroll Gallery** for 3 featured works with hover video playback
4. **Build Additional Credits Table** with hover-preview image interaction
5. **Implement About Section** with scroll-reveal stats and network logo marquee
6. **Create Contact Section** with social links and CTA

## Key Principles
- ONE task per loop - focus on the most important thing
- Search the codebase before assuming something isn't implemented
- Use subagents for expensive operations (file searching, analysis)
- Write comprehensive tests with clear documentation
- Update @fix_plan.md with your learnings
- Commit working changes with descriptive messages

## Testing Guidelines (CRITICAL)
- LIMIT testing to ~20% of your total effort per loop
- PRIORITIZE: Implementation > Documentation > Tests
- Only write tests for NEW functionality you implement
- Do NOT refactor existing tests unless broken
- Do NOT add "additional test coverage" as busy work
- Focus on CORE functionality first, comprehensive testing later

## Project Requirements

### Core Animation Techniques
- **Z-depth zoom transitions**: performant 3D transforms for hero section
- **Parallax rack-focus effect**: layered image blur/movement for Wyatt Earp
- **Horizontal scroll gallery**: vertical scroll triggers horizontal card movement
- **Scroll-triggered animations**: all via GSAP ScrollTrigger

### Technical Stack
- **GSAP 3.12+** with ScrollTrigger plugin
- Leverage existing `CinematicZoom.js` patterns from v4 folder
- Build as `index2.html` (new homepage rebuild)
- Modular JS: `hero-zoom.js`, `parallax.js`, `gallery.js`, `credits.js`
- Single CSS file: `css/styles.css`

### Section Requirements

**1. Hero Section:**
- Background: `LandingPageMontagev04.2.webm` (existing)
- Headline: "Randy Counsman"
- Subtitle: "Nonfiction Video Development & Production"
- Social icons: LinkedIn, Vimeo, Email
- Scroll behavior: Pinned until threshold, then z-translate moves hero backward while Section 2 approaches

**2. Wyatt Earp Parallax Section:**
- Layers: `Wyatt_Layer01_v01.png` (BG), `Wyatt_Layer02_v01.png` (FG)
- Effect: Rack-focus (BG blur 6px → 0, FG inverse)
- Content: Netflix logo, "Wyatt Earp and The Cowboy War" title, pull quotes (WSJ, Spectator, Decider)
- Timeline: 0-25% BG sharpens, 25-75% parallax move, 75-100% fade to black

**3. Featured Works Gallery:**
- Horizontal scroll triggered by vertical scroll
- Card size: ~60vw width, 70vh height
- Video reels play on hover (muted, autoplay)
- 3 projects: The Men Who Built America, Pope: The Most Powerful Man in History, Capsized
- Cards show: Network logo, video thumbnail/hover video, title, role, year

**4. Additional Credits:**
- Table layout: Title, Network columns
- Hover triggers image preview (fixed left, follows cursor Y)
- 10 credits from resume.html

**5. About Section:**
- Split stats with scroll-reveal: 15+ years, 20M+ views, Netflix Top 3, Emmy-nominated
- Network logo marquee (auto-scroll, subtle): Netflix, History, PBS, AMC, Amazon, Nat Geo, Discovery, CNN, CNBC, Fox Nation
- Summary line + "Full Resume →" CTA

**6. Contact Section:**
- Location: New York, NY
- Email, LinkedIn, Vimeo links
- CTA: "Let's make something"

### Performance Requirements
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Smooth 60fps scroll animations
- Z-transforms are GPU-accelerated (avoid `top`/`left` animation)
- Lazy-load video reels; preload hero video
- Use `will-change: transform` sparingly

### Responsive Strategy
- **Desktop**: Full experience with all effects
- **Tablet**: Horizontal scroll converts to vertical swipe gallery
- **Mobile**: Simplified transitions, video thumbnails instead of autoplay

### Browser Support
- Chrome, Safari, Firefox (latest)
- iOS Safari, Android Chrome

## Success Criteria
- [ ] Hero z-zoom feels smooth, not jarring
- [ ] Wyatt Earp parallax focus effect is cinematic
- [ ] Horizontal gallery responds correctly to scroll
- [ ] Hover previews appear without lag
- [ ] About stats animate in on scroll
- [ ] All links functional (resume, Vimeo, LinkedIn, email)
- [ ] Mobile layout is usable (no broken interactions)
- [ ] Meets performance targets

## Status Reporting (CRITICAL)

At the end of your response, ALWAYS include this status block:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

### When to set EXIT_SIGNAL: true
Set EXIT_SIGNAL to **true** when ALL of these conditions are met:
1. All items in @fix_plan.md are marked [x]
2. All tests are passing (or no tests exist for valid reasons)
3. No errors or warnings in the last execution
4. All requirements from specs/ are implemented
5. You have nothing meaningful left to implement

## File Structure
```
website/
├── index2.html          ← New homepage (rebuild)
├── css/
│   └── styles.css       ← All styles
├── js/
│   ├── hero-zoom.js     ← Z-depth hero transition
│   ├── parallax.js      ← Wyatt Earp rack-focus
│   ├── gallery.js       ← Horizontal scroll gallery
│   └── credits.js       ← Hover preview interaction
├── video/               ← Existing reels
├── images/
│   ├── portfolio/       ← Key art
│   └── logos/           ← Network logos
└── resume.html          ← Existing (linked from About)
```

## Current Task
Follow @fix_plan.md and choose the most important item to implement next.
Use your judgment to prioritize what will have the biggest impact on project progress.

Remember: Quality over speed. Build it right the first time. Know when you're done.
