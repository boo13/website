/** Shared easings, breakpoints, and reusable timing values */

import cdn from '../cdn-base.json';

export const CDN_BASE = cdn.cdnBase;

// Canonical breakpoints — single source of truth, mirrored by tokens.css.
// Direction convention: "down" = max-width:N; "up" = min-width:N+1.
// JS mirrors the small side: innerWidth <= BP.
export const BREAKPOINTS = Object.freeze({
  mobile: 480, // phone portrait
  tablet: 768, // phone landscape / small tablet
  desktop: 1024, // tablet/desktop seam — pairs with min-width: 1025px
});

// px past the track end on the pinned horizontal gallery
export const GALLERY_SCROLL_BUFFER = 200;

export const SCRUB = {
  default: 1,
  smooth: 1.5,
};

// Hero name scroll color-trail tuning
export const TRAIL_K = 0.03; // velocity → Y-offset multiplier (px per px/s)
export const TRAIL_MAX_PX = 5; // max Y-offset clamp in px
export const TRAIL_THRESH = 30; // px/s — below this, spring-back triggers
export const TRAIL_OPACITY = 0.85; // max clone opacity
