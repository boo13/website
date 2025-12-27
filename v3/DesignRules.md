# Design Rules & Guidelines
**Randy Counsman - Documentary Producer Portfolio**

## Design Philosophy

**Cinematic Noir** - Dark, elegant, understated sophistication with warm amber accents. Think A24 films, prestige documentaries, and luxury cinema experiences. The aesthetic should feel like browsing a high-end film production company, not a corporate website.

---

## Core Principles

### 1. Cinematic, Not Corporate
- Avoid sterile, business-like language and aesthetics
- Prioritize warmth, humanity, and artistic sensibility
- Think independent film studio, not Fortune 500
- Embrace film-inspired visual language (grain, parallax, dramatic lighting)

### 2. Dark & Understated
- Deep blacks (#0A0A0A, #121212) as primary background
- Warm amber accents (#D4A574, #E6C18E) for highlights
- Dimmed whites for comfortable reading
- Generous negative space
- Subtle over flashy

### 3. Elegant Restraint
- Less is more - don't overcomplicate
- Smooth, subtle animations (nothing jarring)
- Clean typography hierarchy
- Let the work speak for itself
- Quality over quantity in every detail

---

## Language Rules

### ❌ AVOID These Words/Phrases
- "Storyteller" (overused, cliché)
- "Passionate about" (generic)
- "Leverage" (corporate jargon)
- "Solutions" (business-speak)
- "Synergy" (corporate nonsense)
- "Cutting-edge" (dated tech-speak)
- Generic phrases like "Think outside the box"

### ✅ USE This Tone Instead
- Direct, confident, warm
- "Documentary producer" over "storyteller"
- "Crafting narratives" over "telling stories"
- "Bringing [X] to life" over "creating content"
- Focus on specifics: "American history", "business titans", "innovation"
- Conversational but professional
- Show expertise through clarity, not buzzwords

### Writing Style
- Short, punchy sentences
- Active voice
- Concrete over abstract
- Warm but not overly casual
- Professional without being stiff

---

## Visual Design Rules

### Typography
- **Primary Serif**: Libre Baskerville (headlines, elegant moments)
- **Primary Sans**: Manrope (body text, UI elements)
- Never mix more than 2 font families
- Maintain clear hierarchy: titles → subtitles → body
- Letter-spacing for uppercase labels: 0.05-0.15em

### Color Palette
```
Backgrounds:
--black: #0A0A0A (primary background)
--black-light: #121212 (section variation)
--black-lighter: #1A1A1A (cards, containers)

Accents:
--amber: #D4A574 (primary accent)
--amber-light: #E6C18E (hover states, highlights)
--amber-dark: #C9A55F (depth)

Text:
--white: #FAFAF8 (headings)
--white-dimmer: rgba(250, 250, 248, 0.7) (body text)
--white-dimmest: rgba(250, 250, 248, 0.5) (labels)
```

**Rules**:
- Amber for interactive elements, accents, CTAs
- Never use pure white (#FFFFFF) - too harsh
- Maintain 4.5:1 contrast ratio minimum for accessibility
- Dark backgrounds only - no light mode

### Spacing & Layout
- Container max-width: 1400px
- Generous gutters: clamp(1.5rem, 5vw, 4rem)
- Section padding: clamp(4rem, 12vh, 10rem)
- Let content breathe - don't pack things tight
- Asymmetric layouts preferred over centered grids

### Images & Media
- Always use aspect ratios (16:10 for work, 4:5 for portraits)
- Subtle parallax on scroll (10-15% movement)
- Hover effects: scale(1.05), slow transition (0.7s)
- Film grain overlay at 4% opacity
- Video: 50% opacity, radial gradient overlay

---

## Animation Guidelines

### GSAP Principles
- Subtle, elegant, understated
- Duration: 1-1.6s for major reveals
- Easing: power3.out, power4.out (smooth, cinematic)
- Stagger: 0.15-0.3s for sequential reveals
- Parallax scrub: 1.5 (slow, smooth)

### What to Animate
✅ **DO Animate**:
- Hero title reveal (stagger lines)
- Scroll-triggered section reveals
- Image parallax on scroll
- Subtle hover states
- Navigation hide/show

❌ **DON'T Animate**:
- Everything on the page
- Rapid, jarring movements
- Constant motion (distracting)
- Excessive hover effects

### Performance
- Use `will-change` sparingly
- Prefer transforms over position changes
- Debounce resize events (250ms)
- Pause video when out of viewport
- One-time reveals (don't repeat on scroll up)

---

## User Experience Goals

### Primary Goals (in order)
1. **Showcase work quality** - Visitors should be impressed by project portfolio
2. **Drive contact/newsletter** - Encourage reaching out or subscribing
3. **Establish credibility** - 15+ years, major networks, quality productions
4. **Communicate specialties** - History, business, innovation intersection

### Calls to Action

**Priority CTAs**:
1. Contact form / email
2. Newsletter signup (future)
3. View specific projects
4. Social links (LinkedIn, Vimeo)

**CTA Placement**:
- Hero: Subtle scroll indicator (not aggressive)
- Work section: Each project card is clickable/hoverable
- About: Passive credibility building
- Contact: Clear, warm invitation ("Let's Create Something Extraordinary")

**CTA Language Examples**:
- ✅ "Let's Work Together"
- ✅ "Discuss Your Project"
- ✅ "Get in Touch"
- ❌ "Contact Us Today!" (too pushy)
- ❌ "Submit a Form" (too transactional)

---

## Content Strategy

### Work Section
- Show 6-8 projects maximum (quality over quantity)
- Lead with strongest/most recent work
- Include network badge on hover
- Brief, compelling descriptions (1 sentence)
- Tags for specialty areas (History, Business, Innovation)

### About Section
- Lead with expertise angle: "focused on stories that explore..."
- Mention 15+ years credibility early
- Highlight network partnerships (Netflix, History, PBS, AMC)
- Explain the unique intersection: history + business + innovation
- Keep it conversational, not boastful

### Contact Section
- Warm, inviting tone
- Clear location (New York, NY)
- Direct email (not just a form)
- Social proof (networks if needed)
- No friction - make it easy to reach out

---

## Technical Guidelines

### Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total page weight: < 3MB
- Lighthouse score: 90+ (Performance, Accessibility)

### Accessibility
- WCAG 2.1 AA minimum
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all images
- Keyboard navigation support
- Focus states on interactive elements
- Reduced motion support (`prefers-reduced-motion`)

### Responsive Breakpoints
```
Mobile: < 480px
Tablet: 481px - 768px
Desktop: 769px - 1024px
Large: > 1024px
```

### SEO Considerations
- Semantic HTML5 structure
- Descriptive title tags
- Meta descriptions (155 characters)
- Schema.org markup for Person/Organization
- Proper image compression (WebP where possible)

---

## Component Standards

### Navigation
- Fixed position, auto-hide on scroll down
- Serif logo (Randy Counsman)
- Sans-serif menu items (uppercase, 0.05em spacing)
- Glass morphism background: rgba(10, 10, 10, 0.6) + blur(20px)
- Amber underline on hover

### Project Cards
- Aspect ratio: 16:10
- Hover: scale image, show network badge
- Network badge: amber background, white text
- Title: Serif, 1.5rem
- Description: Sans, 0.95rem, dimmed white
- Info starts hidden, reveals with card

### Section Titles
- Serif font (Libre Baskerville)
- Size: clamp(2rem, 5vw, 3.5rem)
- Amber accent bar underneath (60px × 2px)
- Left-aligned, never centered

### Buttons/Links
- Primary CTA: Amber background, white text
- Secondary: Transparent with amber border
- Hover: Slight lift (translateY(-2px))
- Transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1)

---

## Lessons Learned From Design Iterations

### What Didn't Work
❌ **Too Corporate** (v1)
- Felt like business consulting site
- Light backgrounds looked generic
- Stats boxes too formal
- Lost cinematic quality

❌ **Too Busy** (v2)
- Film strips, date stamps, excessive decoration
- Overwrought animations
- Lost focus on the work itself
- Felt like trying too hard

❌ **Word "Storyteller"**
- Overused in creative industry
- Lacks specificity
- "Documentary producer" is clearer, more professional

### What Works
✅ **Dark Backgrounds**
- Cinematic, sophisticated
- Amber accents pop beautifully
- Easy on eyes, premium feel

✅ **Film Grain Texture**
- Subtle (4% opacity)
- Adds authenticity without distraction
- Reinforces documentary aesthetic

✅ **Warm Language**
- "Crafting narratives where history, business, and innovation converge"
- "Let's Create Something Extraordinary"
- Conversational but professional

✅ **Generous Spacing**
- Lets content breathe
- Feels premium, not cramped
- Easier to focus on what matters

✅ **Subtle Parallax**
- Adds depth and sophistication
- Keeps things dynamic without being distracting
- Reinforces cinematic quality

---

## Future Enhancements to Consider

### Phase 2 Features
- Newsletter signup form with embedded component
- Case studies for select projects (detailed breakdowns)
- Video showreel on About page
- Filterable work grid (by network, topic, year)
- Testimonials from network partners
- Blog/insights section (optional)

### Nice-to-Haves
- Custom cursor (subtle dot following mouse)
- Sound toggle for ambient background audio
- Easter eggs for dedicated explorers
- Behind-the-scenes content
- Timeline visualization of career highlights

---

## Brand Voice Examples

### Hero Section
✅ "Documentary Storytelling"
✅ "Crafting narratives where history, business, and innovation converge"
❌ "Your Storytelling Partner"
❌ "Passionate filmmaker dedicated to your vision"

### About Section
✅ "Documentary producer focused on stories that explore the pivotal moments where history, commerce, and human ambition intersect"
✅ "Over fifteen years bringing complex narratives to life"
❌ "Award-winning storyteller with a passion for excellence"
❌ "Leveraging cutting-edge techniques to deliver impactful content"

### Contact Section
✅ "Let's Create Something Extraordinary"
✅ "Have a story that demands to be told?"
❌ "Ready to bring your vision to life?"
❌ "Contact us today for a free consultation!"

---

## File Structure

```
v3/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styling
├── animations.js       # GSAP animations
└── DesignRules.md     # This file
```

---

## Maintenance Guidelines

### When Adding New Projects
1. Maintain 6-8 project maximum
2. Replace older/weaker work
3. Ensure high-quality images (min 1600px wide)
4. Write compelling 1-sentence descriptions
5. Add appropriate network badge
6. Test hover states and parallax

### When Updating Copy
1. Read aloud - does it sound natural?
2. Avoid buzzwords and clichés
3. Keep sentences short and clear
4. Maintain warm but professional tone
5. Spell check everything
6. Have someone else review

### When Making Design Changes
1. Refer back to Core Principles
2. Test on mobile first
3. Check accessibility (contrast, focus states)
4. Ensure animations remain subtle
5. Verify performance hasn't degraded
6. Test across browsers (Chrome, Firefox, Safari)

---

## Version History

**v3.0 - Cinematic Noir** (Current)
- Dark mode throughout
- Warm amber accents
- Film grain texture
- Subtle GSAP animations
- Clean, understated layout
- Focus on the work

**v2.0 - Archival Cinematic** (Rejected - too busy)
- Film strips, date stamps
- Heavy decoration
- Lost focus

**v1.0 - Contemporary Heritage** (Rejected - too corporate)
- Light backgrounds
- Business-like aesthetic
- Stats boxes
- Lost cinematic quality

---

## Questions to Ask Before Changes

1. **Does this feel cinematic?** (Not corporate, not generic)
2. **Is it understated?** (Elegant restraint over flashy)
3. **Does amber accent add warmth?** (Not just decoration)
4. **Will visitors want to contact?** (Clear value, inviting)
5. **Does it showcase the work?** (Not overshadow it)
6. **Is the animation subtle?** (Enhances, doesn't distract)
7. **Would this impress a Netflix exec?** (Premium quality)

---

**Last Updated**: December 2024
**Maintained By**: Design iterations with Claude Code
**Review Frequency**: Before major updates or new project launches
