/** Run fn when the DOM is ready (handles both loading and already-loaded states). */
export function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/** True if the user prefers reduced motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True if the pointer is a fine (mouse) pointer that supports hover. */
export function canHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
