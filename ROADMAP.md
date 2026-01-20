# Portfolio Website Roadmap

## Goals & Success Criteria

**Primary Goal:** Launch a polished single-page portfolio within 6 weeks that showcases 3-5 video projects, positions you as a creative leader, and supports your job search.

**Success looks like:**
- A hiring manager can understand who you are and what you do in 10 seconds
- They can watch compelling clips of your best work
- They see evidence of leadership and range (TV, news, social)
- The site feels cinematic and professional, not generic
- It actually ships — done beats perfect

---

## Tech Stack

Static HTML/CSS/JS — no framework needed. Keep it simple, focus on content and design.

---

## Site Structure

Single page with sections:
1. **Landing** — hero with name, tagline, optional background video
2. **About** — who you are, what you lead, your approach
3. **Featured Projects** — 3-5 curated pieces with video
4. **Past Work** — additional credits, simpler format
5. **Contact** — email, LinkedIn, etc.

---

## Design Direction

- **Cinematic/dark** — moody backdrop, video takes center stage
- **Bold/editorial** — strong typography, dynamic moments
- **Warm/approachable** — personal, not cold or corporate

---

## Phase 1: Content First (Week 1-2)

### Project Selection
- [ ] List all projects you could potentially feature
- [ ] Score each on: visual impact, your role/leadership, format diversity
- [ ] Pick top 3-5 that show range (ideally mix of TV, news, social)

### Video Preparation
- [ ] For each project: identify best 30-90 second clip or sizzle reel
- [ ] Edit/export clips in web-friendly format (MP4 H.264 or use YouTube/Vimeo embeds)
- [ ] Create or select a thumbnail for each

### Written Content
- [ ] Write project one-liners: "Title — Your role. One sentence on what it is and impact."
- [ ] Draft About section (~100 words): who you are, what you lead, your approach
- [ ] Prepare contact info / links (email, LinkedIn, etc.)

---

## Phase 2: Design Foundation (Week 2-3)

### Visual System
- [ ] Choose color palette: dark base + 1-2 accent colors
- [ ] Select typography: 1 heading font (bold/editorial), 1 body font (readable)
- [ ] Define spacing scale and max content width

### Layout Planning
- [ ] Sketch section flow: Landing → About → Featured Projects → Past Work → Contact
- [ ] Decide: full-screen video hero or static image with scroll cue?
- [ ] Plan project cards: thumbnail + title + role, click to expand or play inline?

### Reference/Moodboard
- [ ] Collect 3-5 portfolio sites you admire as reference
- [ ] Note what specifically works about each (layout, motion, typography)

---

## Phase 3: Build (Week 3-5)

### Setup
- [ ] Create clean working branch (archive v2/v4/v5, don't delete)
- [ ] Set up base HTML structure with semantic sections
- [ ] Create CSS with your design system variables (colors, fonts, spacing)

### Section-by-Section Build
- [ ] Landing: hero area with name, tagline, optional background video/image
- [ ] About: photo + bio text, keep it concise
- [ ] Featured Projects: 3-5 cards with video embeds or modals
- [ ] Past Work: simpler list or smaller cards for additional credits
- [ ] Contact: email link, LinkedIn, optional form

### Video Integration
- [ ] Decide hosting: self-hosted MP4 vs YouTube/Vimeo embeds
- [ ] Implement lazy loading for performance
- [ ] Test autoplay behavior (muted autoplay for hero, click-to-play for projects)

### Responsive
- [ ] Build mobile-first, then enhance for tablet/desktop
- [ ] Test video scaling and touch interactions

---

## Phase 4: Polish & Ship (Week 5-6)

### Testing
- [ ] Test on Chrome, Safari, Firefox (desktop)
- [ ] Test on iPhone and Android (real devices if possible)
- [ ] Check video playback on all platforms
- [ ] Verify load time is acceptable (<5 seconds)

### Final Polish
- [ ] Proofread all copy
- [ ] Add favicon and meta tags (title, description, social preview image)
- [ ] Ensure contact links work
- [ ] Remove any dead code or console logs

### Deploy
- [ ] Push to GitHub Pages (CNAME already configured)
- [ ] Verify live site at randycounsman.com
- [ ] Test contact method works end-to-end

### Share
- [ ] Update LinkedIn with new portfolio link
- [ ] Send to a few trusted people for feedback before major outreach

---

## Anti-Scope-Creep Rules

- No new features until v1 ships
- 3-5 projects max, not 10+
- No custom animations until core content works
- No blog, no CMS, no backend
- If it's not in this roadmap, it's not in v1
