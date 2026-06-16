/** Run fn when the DOM is ready (handles both loading and already-loaded states). */
export function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Register one-shot pagehide cleanup for an array of cleanup functions.
 * Each item is called only if it is a function (safe with early-return inits).
 */
export function onPageHide(cleanups) {
  window.addEventListener(
    'pagehide',
    () => cleanups.forEach((fn) => typeof fn === 'function' && fn()),
    { once: true }
  );
}

/** True if the user prefers reduced motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True if the pointer is a fine (mouse) pointer that supports hover. */
export function canHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
