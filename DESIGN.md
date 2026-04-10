# Homepage Design Specification

This document describes the actual design and interaction model of the main portfolio homepage rendered by [`index.html`](/Users/randy/Git/website/index.html). It is not a generic design system. It is a concrete reference for the current homepage implementation.

## 1. Scope

- Applies to the main portfolio homepage only: [`index.html`](/Users/randy/Git/website/index.html)
- Backed by [`src/main.js`](/Users/randy/Git/website/src/main.js) and the homepage styles:
  - [`src/styles/index2.css`](/Users/randy/Git/website/src/styles/index2.css)
  - [`src/styles/about-intro.css`](/Users/randy/Git/website/src/styles/about-intro.css)
  - [`src/styles/about-slides.css`](/Users/randy/Git/website/src/styles/about-slides.css)
- Does not describe `contact.html`, `resume.html`, project detail pages, or the archived `index-legacy.html`

## 2. Creative Direction

The homepage is a cinematic, scroll-led portfolio rather than a conventional brochure site. The visual language is:

- dark and high-contrast
- editorial rather than app-like
- motion-first, with GSAP driving major transitions
- grid-based underneath, but not rigidly boxy
- typography-led, with large serif statements and restrained sans-serif utility text

The page should feel like a title sequence and portfolio reel, not a SaaS landing page.

## 3. Visual Foundations

### Color palette

The live homepage uses the following CSS tokens from [`src/styles/index2.css`](/Users/randy/Git/website/src/styles/index2.css):

- `--color-offwhite: oklch(0.968 0.006 75)`
- `--color-cream: oklch(0.918 0.011 77)`
- `--color-nearblack: oklch(0.14 0 0)`
- `--color-charcoal: oklch(0.2 0 0)`
- `--color-gray: oklch(0.51 0 0)`

In practice:

- most sections sit on `--color-nearblack`
- text is usually `--color-offwhite`
- the credits section inverts to a light background with dark text
- overlays rely on black gradients and opacity rather than colored accents

### Typography

The homepage uses a three-font mix:

- Display serif: `ivypresto-display`
- Body sans: `aktiv-grotesk`
- Accent handwritten face: `felt-tip-senior`

Type roles:

- large headlines and names use the serif face
- navigation, labels, metadata, and form UI use the sans face
- the word "Sometimes" in the about slides uses the handwritten face

### Layout grid

The base layout is a 6-column grid on desktop:

- `--grid-columns: 6`
- `--grid-gutter: 20px`
- `--grid-max-width: 1400px`
- `--container-padding: clamp(1.5rem, 5vw, 4rem)`

There is also a debug grid overlay in the DOM via `.bg-columns`. It can be toggled with `Ctrl+G` / `Cmd+G` from [`src/main.js`](/Users/randy/Git/website/src/main.js).

## 4. Fixed Chrome And Page Shell

The page includes several fixed layers outside the scroll content:

- `.loading-overlay`: fullscreen preloader that prevents a white flash and gates hero animation startup
- `.bg-columns`: optional debug grid overlay
- `.gallery-progress`: fixed lower-right gallery index, shown only while the featured-work section is active on desktop
- `.hero-fixed-name-container`, `.hero-subtitle-fixed`, `.hero-social-fixed`: fixed hero elements used during the hero transition
- `.hero-top-transition-gradient`: fixed top fade used when hero content transitions into its pinned/fixed state

The main scrollable content is wrapped in `#smooth-wrapper` and `#smooth-content` for GSAP `ScrollSmoother`.

## 5. Homepage Structure

The live homepage structure is:

1. Hero
2. About Intro
3. About Slides
4. Featured Work
5. Credits
6. CTA
7. Footer

There is also a commented-out clients section in [`index.html`](/Users/randy/Git/website/index.html), but it is not currently part of the rendered page and should not be treated as active design.

## 6. Section Specs

### Hero

The hero is a full-viewport looping montage video with text and social links overlaid.

Core elements:

- `.hero-video-container`
- `.hero-video`
- `.hero-gradient`
- `.hero-content`
- `.hero-name`
- `.hero-subtitle`
- `.hero-social`

Design characteristics:

- full-bleed background video
- dark gradient overlay for legibility
- large serif name
- uppercase, letter-spaced subtitle
- minimalist inline social icons
- custom cursor treatment inside the hero section

The hero animation does not start immediately on DOM ready. [`src/main.js`](/Users/randy/Git/website/src/main.js) waits for the preloader to complete, then dispatches `loadingComplete`, which starts hero animation setup.

### About Intro

This section is a quiet reset after the hero:

- dark background
- subtle radial dot-grid texture
- single serif paragraph centered within the grid
- horizontally scrolling marquee of client/network names

Core elements:

- `.about-intro__dot-bg`
- `.about-intro__content`
- `.about-intro__text`
- `.about-intro__marquee`
- `.about-intro__marquee-track`

The marquee is CSS-driven and duplicates its content for a seamless loop.

### About Slides

This section is a full-viewport, scroll-driven narrative sequence. It is the most explicitly cinematic part of the page.

#### Slide 1: "the stories I tell are EPIC..."

Core elements:

- `.slide-goes-big`
- `.grid-container`
- `.grid-item`
- `.grid-hero`
- `.slide-content`

Design characteristics:

- 7x7 media grid filling the viewport
- combination of static poster images and lazy-loaded videos
- strong left-to-right gradient to preserve headline readability
- large serif headline with italic emphasis
- handwritten intro line above the headline

#### Slide 2: "the stories fit in your hand..."

Core elements:

- `.slide-in-your-hand`
- `.phone-mockups`
- `.phone-mockup`
- `.phone-video`
- `.headline-over`
- `.headline-under`

Design characteristics:

- multiple floating iPhone mockups
- layered z-depth so phones pass between headline layers
- same serif + handwritten type pairing as slide 1
- top and bottom edge gradients to fade devices into darkness

### Featured Work

This section is the portfolio gallery.

Core elements:

- `.featured-work-section`
- `.gallery-container`
- `.gallery-track`
- `.gallery-card`
- `.card-media`
- `.card-content`
- `.gallery-progress`

Gallery card anatomy:

- media layer with thumbnail and optional hover/scroll video
- dark bottom gradient overlay for text legibility
- optional network logo
- title, role, and year metadata
- animated corner markers that appear on desktop hover

Behavior:

- desktop: horizontal gallery driven by vertical scroll
- tablet/mobile: stacked vertical cards
- desktop progress indicator updates with scroll position
- hover video and in-view autoplay are both supported

The gallery card markup itself is injected into `index.html` at build time via the `<!-- GALLERY_CARDS -->` placeholder.

### Credits

This is a full-width, light-theme section that breaks the dark run of the page.

Core elements:

- `.credits-section`
- `.section-title`
- `.credits-list`
- `.credit-row`
- `.credit-row__header`
- `.credit-row__details-inner`

Design characteristics:

- off-white background with dark text
- accordion rows with thin dividers
- title, platform, and role aligned to the 6-column grid on desktop
- plus icon rotates on expansion
- hover state uses a subtle background wash and a brief chromatic text flash
- expanded state shows image and description in a two-column detail layout on desktop

This section is intentionally cleaner and more editorial than the gallery above it.

### CTA

This section is a compact conversion block between credits and footer.

Core elements:

- `.cta-section`
- `.cta-heading`
- `.cta-subtext`
- `.newsletter-form`
- `.newsletter-input-group`
- `.newsletter-submit`
- `.cta-contact-btn`

Design characteristics:

- centered composition
- restrained serif heading
- compact email signup form
- secondary contact button with inline arrow icon

Unlike some other sections, this is intentionally minimal and low-drama.

### Footer

The footer is a structured information grid, not a dense utility footer.

Core elements:

- `.site-footer`
- `.footer-inner`
- `.footer-top`
- `.footer-tagline`
- `.footer-nav`
- `.footer-columns`
- `.footer-col`
- `.footer-copyright`

Design characteristics:

- dark background continuous with the page
- top row: short tagline plus compact nav
- middle row: three information columns with top borders
- bottom row: small uppercase copyright

On desktop the footer aligns to the 6-column grid. On smaller screens it collapses to simpler stacked layouts.

## 7. Interaction And Motion Rules

Motion is part of the design, not decoration.

### Global motion model

- GSAP drives the main interactions
- `ScrollSmoother` is enabled unless the user prefers reduced motion
- section setup is handled from [`src/main.js`](/Users/randy/Git/website/src/main.js)
- major motion sequences live in section modules rather than inline in HTML

### Motion behaviors that define the page

- Preloader runs first, then hero animation begins
- Hero transitions from centered overlay content to fixed top chrome
- About intro uses a continuously moving marquee
- About slides are pinned and animated as a narrative sequence
- Featured work scrolls horizontally on desktop and becomes vertical on compact layouts
- Gallery media autoplay is tied to hover or scroll position
- Footer reveal behavior is initialized from [`src/main.js`](/Users/randy/Git/website/src/main.js) via `initFooterReveal()`

### Reduced motion

Reduced motion is supported:

- `ScrollSmoother` is skipped when `prefers-reduced-motion: reduce` matches
- the about-intro marquee pauses in reduced motion
- gallery behavior falls back to simpler non-horizontal behavior when needed

## 8. Responsive Behavior

The page is not a pure scale-down of desktop. Several structures change materially.

### At `max-width: 1024px`

- featured work stops being horizontally pinned
- gallery becomes a vertical stack
- cards switch to full width with `aspect-ratio: 4 / 3`
- gallery progress indicator is hidden

### At `max-width: 768px`

- base debug grid drops from 6 columns to 4
- hero content gets tighter side padding
- newsletter form becomes vertical
- credits detail layout collapses to one column
- footer stops using subgrid and becomes simpler block/grid layout

### At `max-width: 480px`

- debug grid drops to 2 columns
- container padding tightens to `1.25rem`
- about-intro spacing and marquee sizing reduce further

## 9. Implementation Notes That Matter For Design

- All homepage videos loaded from R2 should keep the `crossorigin` attribute
- The homepage assumes ScrollTrigger-based viewport logic because ScrollSmoother is active
- The gallery is content-driven and injected at build time rather than handwritten into the HTML
- The current visual system is mostly monochrome with one major inversion in the credits section

## 10. Non-Goals

These are not current homepage design rules and should not be reintroduced into documentation without implementation changes:

- gold accent branding
- glassmorphism overlays
- rounded card language as a primary motif
- generic "high-end editorial" rules copied from unrelated sites
- clients section as a live rendered section
