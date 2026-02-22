/** Shared easings, breakpoints, and reusable timing values */

export const CDN_BASE = 'https://pub-722bb50dc4774406afca73534059fdd8.r2.dev';

export const MOBILE_BREAKPOINT = 768;
export const GALLERY_BREAKPOINT = 1024; // sync with @media (max-width: 1024px) in index2.css

export const SCRUB = {
  default: 1,
  smooth: 1.5,
};

// Hero name scroll color-trail tuning
export const TRAIL_K = 0.03;       // velocity → Y-offset multiplier (px per px/s)
export const TRAIL_MAX_PX = 5;    // max Y-offset clamp in px
export const TRAIL_THRESH = 30;    // px/s — below this, spring-back triggers
export const TRAIL_OPACITY = 0.85; // max clone opacity
