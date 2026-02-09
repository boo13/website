# Phase 3: Featured Work & Credits Rough Layout - Research

**Researched:** 2026-02-09
**Domain:** Existing codebase structures, data models, newsletter integration
**Confidence:** HIGH

## Summary

Phase 3 builds on existing gallery and credits infrastructure already present in index2.html. The codebase has a functional horizontal scroll gallery (`src/sections/gallery.js`) with 3 cards, a comprehensive credits table system (`src/sections/credits.js`) that loads from Projects.json, and complete CSS styling for both sections.

**Key discoveries:**
- Projects.json contains 23 projects with rich metadata (title, platform, year, role, description, preview images)
- Existing gallery section has horizontal scroll animation with GSAP ScrollTrigger, video hover previews, and progress indicator
- Credits section already fetches Projects.json and renders table with cursor-tracking preview images
- Network/client logos exist for 15 networks (History, CNN, Discovery, Netflix, PBS, etc.) but NOT for Fox Nation or CuriosityStream
- No newsletter integration currently exists - needs to be added from scratch
- Contact section exists with links but no inline newsletter form

**Primary recommendation:** Refactor existing gallery cards to display 3-5 curated "featured work" projects with network logos, reuse existing credits table system, and add new newsletter CTA section before final contact section.

## Standard Stack

The project uses an established GSAP-focused stack with Vite bundling. No new dependencies needed for Phase 3.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.14.2 | Animation engine with ScrollTrigger | Industry standard for scroll-driven animations |
| Vite | Latest | Build tool and dev server | Fast, ES module-native bundler |
| Vanilla JS | ES2020+ | Core logic | No framework overhead, direct DOM manipulation |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Buttondown | API/embed | Newsletter subscription | Email capture via HTML form or API |
| Projects.json | N/A | Static data source | Single source of truth for all projects |

### No New Dependencies Required

Phase 3 can be completed entirely with existing infrastructure:
- Gallery section already exists with horizontal scroll
- Credits table already loads Projects.json
- CSS styles already defined for both sections
- Network logos already available (with gaps noted below)

## Architecture Patterns

### Existing Project Structure (Already Implemented)

```
src/
  sections/
    gallery.js          # Horizontal scroll gallery with GSAP
    credits.js          # Credits table with cursor preview
    about.js            # Stats reveal animation
  styles/
    index2.css          # Complete styles for all sections
  animations/
    scroll-defaults.js  # GSAP plugin registration
  config.js             # Breakpoints (MOBILE_BREAKPOINT = 768)
public/
  data/
    Projects.json       # 23 projects with metadata
  images/
    portfolio/          # 22 project thumbnails
    logos/              # 15 network logos
```

### Pattern 1: Section Module Pattern (Existing)
**What:** Each section exports an `initSectionName()` function that returns cleanup function
**When to use:** All sections follow this pattern
**Example:**
```javascript
// src/sections/gallery.js
export function initGallery() {
  const section = document.querySelector('.gallery-section');
  const track = document.querySelector('.gallery-track');

  const ctx = gsap.context(() => {
    gsap.to(track, {
      x: () => -scrollDistance,
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1
      }
    });
  }, section);

  return ctx; // Returns cleanup function
}
```

### Pattern 2: Data-Driven Rendering (Existing)
**What:** Credits section fetches Projects.json and dynamically renders table rows
**When to use:** Any section displaying project data
**Example:**
```javascript
// src/sections/credits.js (existing pattern)
fetch('data/Projects.json')
  .then(response => response.json())
  .then(data => {
    data.projects.forEach(project => {
      const tr = document.createElement('tr');
      tr.className = 'credit-row';
      if (project.preview) {
        tr.setAttribute('data-preview', project.preview);
      }
      // Populate cells...
      tableBody.appendChild(tr);
    });
  });
```

### Pattern 3: Horizontal Scroll with GSAP (Existing)
**What:** Pin section, translate track based on scroll progress
**When to use:** Gallery section already implements this
**Example:**
```javascript
// Existing pattern in gallery.js
gsap.to(track, {
  x: () => -(track.scrollWidth - window.innerWidth + 200),
  ease: 'none',
  scrollTrigger: {
    trigger: section,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true
  }
});
```

### Pattern 4: Progressive Enhancement for Mobile
**What:** Detect mobile breakpoint, disable animations, convert to vertical layout
**When to use:** All scroll-heavy sections
**Example:**
```javascript
// From gallery.js
const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
if (prefersReducedMotion || isMobile) {
  track.style.flexDirection = 'column';
  track.style.gap = '2rem';
  // Skip GSAP setup
  return;
}
```

### Anti-Patterns to Avoid
- **Don't create new data structures:** Projects.json is the single source of truth
- **Don't bypass gsap.context():** Always wrap ScrollTriggers in context for cleanup
- **Don't hardcode project lists:** Gallery cards should reference Projects.json data
- **Don't duplicate CSS:** Reuse existing `.gallery-card`, `.credit-row` styles

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Newsletter signup | Custom API integration | Buttondown HTML form embed | Simple POST form, no backend needed, client-side only |
| Project data fetching | Multiple JSON files or hardcoded data | Existing Projects.json fetch pattern | Already implemented in credits.js, single source of truth |
| Horizontal scroll animation | Custom scroll listeners | Existing gallery.js pattern | Handles pinning, scrub, mobile fallback, cleanup |
| Image hover previews | JavaScript mouseover handlers | Existing cursor-preview pattern | Credits.js already implements cursor-tracking with edge detection |
| Responsive breakpoints | Media query listeners | config.js MOBILE_BREAKPOINT constant | Consistent across all sections |

**Key insight:** Phase 3 is primarily about **refactoring and composing existing patterns**, not building new systems. The gallery, credits table, and CSS are already functional. Work involves curating which projects to feature, adding missing network logos, and integrating a newsletter form.

## Common Pitfalls

### Pitfall 1: Assuming Gallery Needs Major Refactoring
**What goes wrong:** Gallery section looks like it needs rewriting to show "featured work"
**Why it happens:** Gallery currently shows 3 hardcoded cards (MWBA, Pope, Capsized)
**How to avoid:** Gallery structure is correct - just update the 3 cards to use Projects.json data and add network logos to `.card-content`
**Warning signs:** If you're rewriting gallery.js animation logic, you're doing too much

### Pitfall 2: Missing Network Logos for Featured Projects
**What goes wrong:** Featured project cards render without network logos
**Why it happens:** Fox Nation and CuriosityStream logos don't exist in `/public/images/logos/`
**How to avoid:** Audit featured projects against available logos FIRST, then either:
  - Choose projects with existing logos (History, CNN, Discovery, Netflix, PBS)
  - Create/obtain missing logos before implementing cards
**Warning signs:** `<img>` tags with broken src paths in card network slot

### Pitfall 3: Buttondown Form Integration Complexity
**What goes wrong:** Attempting server-side integration or API calls for newsletter signup
**Why it happens:** Assuming newsletter forms need backend logic
**How to avoid:** Buttondown provides simple HTML form with POST action to their endpoint:
```html
<form action="https://buttondown.com/api/emails/embed-subscribe/YOUR-USERNAME" method="post">
  <input type="email" name="email" required>
  <input type="hidden" name="embed" value="1">
  <button type="submit">Subscribe</button>
</form>
```
**Warning signs:** Import statements for fetch libraries, API key environment variables

### Pitfall 4: Overwriting Existing Credits Table
**What goes wrong:** Creating new credits rendering logic instead of reusing existing system
**Why it happens:** Not discovering that credits.js already loads Projects.json and renders table
**How to avoid:** `src/sections/credits.js` is feature-complete with:
  - Projects.json fetching
  - Table row generation
  - Cursor-tracking preview images
  - Staggered reveal animation
  - Error handling
**Warning signs:** Creating new fetch calls, new table rendering functions

### Pitfall 5: Not Checking Projects.json Data Structure
**What goes wrong:** Rendering fields that don't exist or are inconsistently populated
**Why it happens:** Assuming all projects have all fields
**How to avoid:** Projects.json has optional fields:
  - `platform` (network/client) - **always present**
  - `preview` (thumbnail image) - present for most (22/23)
  - `videoStandard` - only 3 projects have video
  - `imdbLink` - most but not all
  - `vimeoLink` - rarely used
**Warning signs:** Undefined errors in console, missing thumbnails

### Pitfall 6: Section Ordering Confusion
**What goes wrong:** Placing newsletter form in wrong section of page flow
**Why it happens:** index2.html has: Hero → About Slides → Gallery → Credits → About Stats → Contact
**How to avoid:** Requirements specify:
  - Featured work (Gallery) should show 3-5 curated cards
  - Credits table remains comprehensive (all 23 projects)
  - Newsletter form goes in CTA section (after Credits, before/with Contact)
**Warning signs:** Newsletter form inside gallery or credits sections

## Code Examples

Verified patterns from existing codebase:

### Loading Projects.json (Existing Pattern)
```javascript
// Source: src/sections/credits.js
fetch('data/Projects.json')
  .then((response) => response.json())
  .then((data) => {
    tableBody.innerHTML = '';
    data.projects.forEach((project) => {
      const tr = document.createElement('tr');
      tr.className = 'credit-row';

      // Use preview or poster for hover image
      if (project.preview) {
        tr.setAttribute('data-preview', project.preview);
      } else if (project.poster) {
        tr.setAttribute('data-preview', project.poster);
      }

      // Title cell
      const tdTitle = document.createElement('td');
      tdTitle.className = 'credit-title';
      tdTitle.textContent = project.title;
      tr.appendChild(tdTitle);

      // Network cell
      const tdNetwork = document.createElement('td');
      tdNetwork.className = 'credit-network';
      tdNetwork.textContent = project.platform || '';
      tr.appendChild(tdNetwork);

      tableBody.appendChild(tr);
    });
  });
```

### Gallery Card HTML Structure (Existing)
```html
<!-- Source: index2.html lines 223-251 -->
<article class="gallery-card" data-project="mwba">
  <div class="card-media">
    <img class="card-thumbnail"
         src="images/portfolio/MWBA.jpg"
         alt="The Men Who Built America"
         loading="lazy">
    <video class="card-video" muted loop playsinline preload="none">
      <source src="video/LandingPageMontage_Test_v01.webm" type="video/webm">
    </video>
  </div>
  <div class="card-content">
    <img class="card-network"
         src="images/logos/History.png"
         alt="History Channel">
    <h3 class="card-title">The Men Who Built America</h3>
    <p class="card-role">Producer</p>
    <span class="card-year">2012</span>
  </div>
</article>
```

### Buttondown Newsletter Form (Standard Pattern)
```html
<!-- Source: Buttondown documentation -->
<form action="https://buttondown.com/api/emails/embed-subscribe/YOUR-USERNAME"
      method="post"
      class="newsletter-form">
  <label for="newsletter-email">Get updates on new projects</label>
  <input type="email"
         name="email"
         id="newsletter-email"
         placeholder="your@email.com"
         required>
  <input type="hidden" name="embed" value="1">
  <button type="submit">Subscribe</button>
</form>
```

### GSAP Context Pattern (Existing)
```javascript
// Source: src/sections/gallery.js
export function initGallery() {
  const section = document.querySelector('.gallery-section');

  const ctx = gsap.context(() => {
    // All GSAP animations here
    gsap.to(track, { /* ... */ });
    ScrollTrigger.create({ /* ... */ });
  }, section); // Scoped to section element

  return ctx; // Returns cleanup function
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded gallery cards | Should load from Projects.json | Phase 3 | Dynamic featured work selection |
| No newsletter integration | Buttondown HTML form | Phase 3 | Email capture capability |
| Gallery = all projects | Featured work (3-5) + Credits table (all) | Phase 3 | Better content hierarchy |
| Single scrolling section | Distinct Featured Work and Credits sections | Current | Clearer information architecture |

**Current state (as of 2026-02-09):**
- Gallery section functional with 3 cards (MWBA, Pope, Capsized)
- Credits table loads all 23 projects from Projects.json
- No newsletter form exists
- No CTA section with prominent contact link
- 15 network logos available, 2+ missing (Fox Nation, potentially others)

## Open Questions

### 1. Which 3-5 Projects Should Be Featured?
**What we know:**
- Projects.json has 23 projects spanning 2005-2025
- Most recent: Sitting Bull (2025), Wyatt Earp (2024), George (2024)
- Highest-profile networks: History Channel, Netflix, CNN, PBS, Fox Nation
- 3 projects have video files available (Wyatt Earp, Capsized, Beyond the Spotlight)

**What's unclear:**
- User preference for chronological (recent first) vs. prestige (biggest networks)?
- Should featured cards prioritize projects with video files for hover previews?
- Does "Co-Executive Producer" role rank higher than "Writer"?

**Recommendation:**
- Default to 5 most recent projects with available network logos
- If video files exist for a project, prioritize it for better hover interaction
- Let user curate final selection during planning phase

### 2. Missing Network Logos Strategy
**What we know:**
- Fox Nation projects: 3 major projects (George, American Dynasty, Liberty or Death)
- CuriosityStream projects: 4 projects (Titans Hollywood, Titans Wall Street, Beyond the Spotlight)
- No Fox Nation or CuriosityStream logos exist in `/public/images/logos/`

**What's unclear:**
- Should Phase 3 include logo acquisition as a task?
- Can we use text-only fallback for missing logos?
- Are logo files available from official brand asset sites?

**Recommendation:**
- Phase 3 should include task to obtain/create missing logos OR
- Featured work selection should exclude projects without logos for now
- Credits table can display platform name as text (already does this)

### 3. Newsletter CTA Section Placement
**What we know:**
- Current structure: Hero → About Slides → Gallery → Credits → About Stats → Contact → Footer
- Requirements specify "inline newsletter signup form" and "CTA button linking to contact.html"

**What's unclear:**
- Does "inline" mean within another section or its own section?
- Should newsletter form be BEFORE or AFTER the about stats section?
- Does the contact.html CTA button go in the same section as the newsletter form?

**Recommendation:**
- Create new CTA section between Credits and About Stats
- Newsletter form + contact CTA button in same section for cohesive "next steps"
- Keeps about stats and contact links as final sections (portfolio close)

### 4. Buttondown Username/Account Setup
**What we know:**
- Buttondown form action requires: `https://buttondown.com/api/emails/embed-subscribe/YOUR-USERNAME`
- Client-side form POST, no API key needed
- No Buttondown account details visible in codebase

**What's unclear:**
- Has user already set up Buttondown account?
- What is the Buttondown username to use in form action?

**Recommendation:**
- Phase 3 PLAN should include task to confirm Buttondown account details
- Use placeholder in implementation: `data-buttondown-username` attribute
- Final commit replaces placeholder with actual username

## Data Structure Reference

### Projects.json Schema (Verified)
```typescript
// All 23 projects follow this structure
interface Project {
  id: string;              // Slug identifier (e.g., "sitting-bull")
  title: string;           // Display name
  platform: string;        // Network/client (ALWAYS present)
  year: string;            // "2025" or "2022–2023" format
  role: string;            // Producer credit (varies by project)
  description: string;     // 1-2 sentence synopsis
  videoStandard: string | null;   // Path to 16:9 video (3/23 have this)
  videoVertical: string | null;   // Path to 9:16 video (1/23)
  poster: string | null;          // Alternate thumbnail (rare)
  vimeoLink: string | null;       // External link (rare)
  imdbLink: string | null;        // IMDb URL (most have this)
  preview: string;                // Thumbnail path (22/23 have this)
}
```

### Available Network Logos (Verified 2026-02-09)
```
✓ History Channel: History.png
✓ CNN: CNN_logo_red.svg
✓ Discovery Channel: Discovery.png
✓ Netflix: Netflix_white.png, Netflix_white2.png
✓ PBS: pbs_logo_white.png
✓ Investigation Discovery: investigationdiscovery.png
✓ National Geographic: NatGeoLogo_White.svg
✓ AMC: AMC.png
✓ CuriosityStream: CuriosityStream_white.svg, CuriosityStream_white2.svg
✓ Amazon Prime: PrimeVideoLogo_White.svg
✓ CMT: CMT_White.png
✓ Sundance TV: sundance_tv.png
✓ SDE: SDE_logo.svg

✗ Fox Nation: NOT FOUND (3 projects need this)
✗ Independent Short Film: NOT FOUND (1 project)
```

### Projects by Network (Reference for Curation)
```
History Channel (6):
  - Sitting Bull (2025) - Co-Executive Producer
  - Wyatt Earp and the Cowboy War (2024) - Co-Executive Producer [HAS VIDEO]
  - The Titans That Built America (2021) - Co-Executive Producer
  - Washington (2020) - Writer
  - Hamilton: Building America (2017) - Writer
  - The Men Who Built America (2012) - Writer

Fox Nation (3):
  - George: Rise of a Revolutionary (2024) - Supervising Producer
  - American Dynasty (2022–2023) - Supervising Producer
  - Liberty or Death: Boston Tea Party (2023) - Supervising Producer

CuriosityStream (3):
  - Titans: The Rise of Hollywood (2022) - Supervising Producer
  - Titans: The Rise of Wall Street (2022) - Supervising Producer
  - Beyond the Spotlight (2020–2021) - Supervising Producer [HAS VIDEO]

Discovery Channel (2):
  - Raging Bulls (2021) - Supervising Producer
  - Shark Week (2020) - Supervising Producer

Netflix (1):
  - Holiday Home Makeover with Mr. Christmas (2020) - Supervising Producer

CNN (1):
  - Pope: The Most Powerful Man in History (2018) - Writer

PBS (1):
  - Human: The World Within (2021) - Supervising Producer

Investigation Discovery (2):
  - The Interrogator (2019–2020) - Producer
  - Redrum (2013–2015) - Co-Executive Producer

National Geographic (1):
  - Inside the NSA (2012) - Writer

Discovery Channel (1):
  - Capsized: Blood in the Water (2019) - Co-Producer [HAS VIDEO]

Independent (1):
  - Modern Love (2005) - Actor (Jay)
```

## Sources

### Primary (HIGH confidence)
- `/Users/randy/Git/website/public/data/Projects.json` - Verified project data structure
- `/Users/randy/Git/website/src/sections/gallery.js` - Existing horizontal scroll implementation
- `/Users/randy/Git/website/src/sections/credits.js` - Existing table rendering and cursor preview
- `/Users/randy/Git/website/index2.html` - Current page structure and gallery cards
- `/Users/randy/Git/website/src/styles/index2.css` - Complete CSS for gallery and credits sections
- `/Users/randy/Git/website/public/images/logos/` - Available network logo inventory

### Secondary (MEDIUM confidence)
- [Buttondown Email Newsletter API Integration](https://buttondown.com/features/api) - Newsletter form integration
- [Styling Buttondown's subscription form](https://amyhuang.work/blog/2024/9/20/x1wafko724hopqwr21o22irt9z7cpp) - Custom styling examples
- [Horizontal Scrolling Gallery - GSAP Forums](https://gsap.com/community/forums/topic/42027-horizontal-scrolling-gallery/) - Community best practices
- [Create horizontal scroll animations with GSAP & ScrollTrigger](https://webdesign.tutsplus.com/create-horizontal-scroll-animations-with-gsap-scrolltrigger--cms-108881t) - Tutorial
- [Building a Scroll-Revealed WebGL Gallery](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/) - Modern 2026 techniques

### Tertiary (LOW confidence)
- [Portfolio design patterns - Dribbble](https://dribbble.com/tags/project-cards) - Visual inspiration only
- [Card website templates - Webflow](https://webflow.com/list/card) - General card patterns

## Metadata

**Confidence breakdown:**
- Existing codebase structures: HIGH - Direct file inspection, all files exist and functional
- Projects.json data: HIGH - Complete schema verified, all 23 projects inspected
- Network logo availability: HIGH - Directory listing verified, gaps documented
- Buttondown integration: MEDIUM - Official docs exist but no live implementation to verify
- Featured project curation: LOW - User preference unknown, requires planning decision
- Section ordering: MEDIUM - Requirements clear but implementation details need validation

**Research date:** 2026-02-09
**Valid until:** 30 days (stable technologies, no fast-moving frameworks)

**Key constraints for planning:**
- Phase 2 (Hero) is being skipped - Phase 3 should not depend on Phase 2
- Phase 1 complete - About section exists with 3 scroll-driven slides
- Design-first philosophy - rough layouts before polish
- Existing gallery and credits sections provide foundation
- No new npm dependencies needed
