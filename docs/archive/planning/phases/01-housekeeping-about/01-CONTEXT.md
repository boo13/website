# Phase 1: Housekeeping & About Section Structure - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract Wyatt Earp case study to standalone page, then build the About section as a sequence of full-viewport scroll-driven slides between Hero and Featured Work. Each slide combines large typography with visual media, telling a narrative about Randy's work. Focus on structure and rough animations, not polish.

Section order on page: Hero -> About slides -> Featured Work -> Credits -> CTA

</domain>

<decisions>
## Implementation Decisions

### About section narrative structure
- Sequence of full-viewport slides, each with its own personality
- Two-font system: handwritten/script font for intro lines ("I've worked on", "as well as") + bold serif for headlines ("Storytelling that goes BIG")
- Copy is partially final, partially TBD — build to accept text swaps easily
- Known slides from refs:
  1. "I've worked on / Storytelling that goes BIG..." — dam burst still with zoom-out grid reveal
  2. "as well as / Storytelling that fits in your hand..." — phone mockups rising from below
  3. "This is me..." — handwritten text, portrait TBD (placeholder for now, eventual particle/Gaussian splat effect)
- Each slide is full-viewport height — one statement fills the screen, scroll to next

### "Goes BIG" slide — zoom-out grid reveal
- Background starts as a dam burst still image
- On scroll, zooms out to reveal a grid of dramatic shots from previous work
- Grid is oversized — spills off ALL edges of the viewport (larger than screen in every direction)
- Feels overwhelming and immersive — "storytelling that goes BIG" made literal
- Scrub-linked (animation progress tied to scroll position)

### Phone mockups slide ("fits in your hand")
- Layout matches WORK-Digital.png reference exactly: 3 smaller phones left/center, 1 large phone right
- Phones rise from below with staggered timing as user scrolls into section
- Varied sizes create depth illusion (bigger = closer, smaller = further)
- Phone content: mix of static screenshots and video/image sequences (roughly half and half)
- Phone mockup image assets are ready (user will provide)

### "This is me" slide
- Currently just handwritten text on black — acts as a breather
- Eventually will have a portrait with particle/Gaussian splat to photo transition (TBD, build as placeholder for now)
- Structure should support swapping in the portrait + effect later

### Text animation approach
- Handwritten/script lines: draw-on animation (appears as if being written)
- Bold serif headlines: existing text-mask-rise.js animation pattern
- Consistent system across all About slides

### Scroll animation binding
- Mix per slide — some scrub-linked, some trigger-based, each slide picks what fits
- Grid zoom-out on "goes BIG" slide: scrub-linked
- Text reveals and phone entries: Claude decides per element

### Slide transitions
- Mostly sequential (current slide out, next slide in)
- Special overlap/crossfade transition between "goes BIG" and "in your hand" slides — these are a natural pair (scale contrast is the design point)
- At least one unique transition that combines adjacent slides during crossover

### Wyatt Earp extraction
- Extract current Wyatt Earp parallax section from index2.html to standalone case_study_wyatt.html
- Preserve current content and structure as-is with HTML boilerplate
- Remove cleanly from index2.html (no orphaned styles/scripts)

### Claude's Discretion
- Exact easing curves and timing values for scroll animations
- Phone rise stagger timing and offsets
- Which specific slides use scrub vs trigger binding (except "goes BIG" grid which is scrub)
- Loading skeleton and placeholder approaches
- Transition timing between sequential slides
- "This is me" slide placeholder implementation

</decisions>

<specifics>
## Specific Ideas

- "Storytelling that goes BIG" dam burst image zooms out to reveal oversized grid of dramatic shots — grid spills off all viewport edges
- Phone mockups match WORK-Digital.png layout exactly (3 small + 1 large)
- "Goes BIG" to "in your hand" transition should be a special overlap moment — the scale contrast between massive grid and handheld phones is the design concept
- Two-font system: handwritten for casual intros, bold serif for impact headlines
- "This is me" will eventually have Gaussian splat / particle-to-photo portrait effect (TBD)
- Reference images in `ref/` directory: Artboard 1.png, WORK - Digital.png, Artboard 3.png

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-housekeeping-about*
*Context gathered: 2026-02-09*
