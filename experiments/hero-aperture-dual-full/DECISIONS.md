# Hero Aperture Dual — Full Flow

**What is being tested:** How the aperture-dual hero hands off into the rest of the production page (gallery → credits → CTA → footer). The standard about-intro section is dropped because the aperture already delivers the About copy; only the network marquee is preserved and folded into the bottom of the pinned hero scene as a visual bridge to the gallery.

**Key choices**

- Sibling page to `hero-aperture-dual` — the standalone version stays intact for isolated review.
- One ScrollSmoother owned by the page entry; the aperture hero piggybacks on it (no `initSmooth` in the hero module).
- Marquee lives inside the pinned scene, absolute-positioned at the bottom edge, scoped under `.portal-scene--aperture-dual`.
- Full production chrome (preloader, fixed hero name overlay, footer reveal). Pill-nav intentionally excluded.
- Fixed name/subtitle/social overlays fade in around 70% of the aperture timeline progress — sidesteps the Flip-based name flip in `hero.js`, which is tied to `.hero-section`.

**Watch for**

- If the marquee at the pin bottom fights the aperture vignette on short viewports, push the marquee further down or lower its color value.
- If the fixed subtitle/social overlay positions clash with the marquee on mobile, drop them from the fade-in set and keep only the name.
