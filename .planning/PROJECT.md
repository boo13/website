# Randy Counsman Portfolio

## What This Is

A personal portfolio site for Randy Counsman, nonfiction video producer. Designed for recruiters evaluating him for hire and collaborators considering working with him. The site itself demonstrates design and web development skill through its presentation, while keeping the focus on the work — video projects across television, streaming, news, and social. Editorial and bold aesthetic. Single-page scroll experience built on Vite + GSAP.

**Versioning:** v1 = existing bare-bones index.html (live). v2 = index2.html, the full editorial portfolio being built now. v3 = future enhancements (case studies, etc.).

## Core Value

The work speaks for itself — every design decision exists to showcase Randy's video production work in its best light and make it effortless for recruiters to see what he's done and get in touch.

## Requirements

### Validated

- ✓ Vite build pipeline with multi-page rollup input — existing
- ✓ GSAP 3.14.2 animation system with ScrollTrigger, CustomEase, Observer — existing
- ✓ Section-based ES module architecture with init/cleanup pattern — existing
- ✓ Loading screen with font-ready gating — existing
- ✓ prefers-reduced-motion support across all animated sections — existing
- ✓ GitHub Pages deployment via GitHub Actions — existing
- ✓ Contact form page (Formspree) — existing
- ✓ Credits data from Projects.json with dynamic table rendering — existing
- ✓ Responsive video component with aspect-ratio source switching — existing
- ✓ Mobile breakpoint handling in animations — existing

### Active

- [ ] Hero reel — full-impact video montage as the opening moment
- [ ] Featured Work section — 3-5 curated projects with video lightbox playback
- [ ] Additional Credits section — comprehensive filmography showing full breadth of work
- [ ] About section — series of punchy scroll-driven statement sections revealing creative identity
- [ ] Newsletter signup — inline email capture (Buttondown, already set up)
- [ ] Contact CTA — clear call to action linking to contact page
- [ ] Signature GSAP animation moments at key scroll transitions
- [ ] Editorial & bold visual design — strong typography, confident layout, magazine-like hierarchy
- [ ] Mobile-essential responsive design — must look great on phones (recruiters check on mobile)
- [ ] Polished single-page experience ready to share with recruiters

### Out of Scope

- Case study pages — deferred to future milestone, will be separate pages linkable for job applications
- index.html redesign — current bare-bones version stays as-is, index2.html is the new build
- Blog or written content — focus is on video work, not written editorial
- CMS or admin panel — content managed via code and JSON data files
- User accounts or authentication — static portfolio, no user system

## Context

- index2.html is the active build target; index.html is the current bare-bones live version
- Existing codebase has section-based architecture: landing, featured-work, gallery, credits, about
- These sections are in early exploration — structure exists but design and content are not finalized
- Newsletter platform (Buttondown) is already set up
- Contact form (Formspree) on contact.html is already working
- Projects.json contains filmography data used by credits section
- Adobe Typekit provides custom web fonts
- Site deploys to GitHub Pages from gh-pages branch
- The about section concept: multiple short sections, each with 1-2 punchy lines (e.g., "Randy Counsman is a nonfiction producer" / "I've worked on STORYTELLING that goes BIG..." / "as well as STORYTELLING that fits in your hand..." / "but it's all about CHARACTER.")
- About section comes immediately after hero — establishes identity before showing work
- One about section features animated phone mockups scrolling with parallax (different speeds/sizes), showcasing digital/social work (ref: "ref/WORK - Digital.png")
- Section order: Hero → About → Featured Work → Credits → CTA

## Constraints

- **Tech stack**: Vanilla JS + GSAP + Vite — no frameworks, no build complexity beyond what exists
- **Hosting**: GitHub Pages (static files only, no server-side processing)
- **Fonts**: Adobe Typekit (already integrated)
- **Newsletter**: Buttondown (already set up, public API)
- **Contact**: Formspree (already working on contact.html)
- **Browser support**: Modern browsers with ES module support
- **Accessibility**: prefers-reduced-motion must be respected in all animations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-page scroll site for v2 | Recruiters want a quick, complete impression — not clicking through pages | — Pending |
| Case studies deferred | Get the core portfolio live first, add depth later | — Pending |
| Editorial & bold aesthetic | Shows design skill while staying professional for recruiter audience | — Pending |
| Hero reel as first impression | Immediate visual impact — "this person makes professional things" | — Pending |
| About as punchy scroll statements | More engaging than a bio wall, demonstrates creative copywriting | — Pending |
| Featured (3-5) vs additional credits split | Curated quality for first impression + comprehensive list for credibility | — Pending |

---
*Last updated: 2026-02-09 after requirements definition*
