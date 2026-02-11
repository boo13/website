/**
 * Footer Reveal
 * Fixed footer revealed as scroll content lifts away.
 * Adds padding-bottom on #smooth-content equal to footer height so
 * ScrollSmoother includes it in its height calculation, creating a
 * transparent gap that reveals the fixed footer behind the wrapper.
 */

import { ScrollTrigger, ScrollSmoother } from '../animations/scroll-defaults.js';

export function initFooterReveal() {
  const footer = document.getElementById('site-footer');
  const smoothContent = document.getElementById('smooth-content');
  if (!footer || !smoothContent) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Keep smooth-content padding-bottom in sync with footer height
  // (padding is included in offsetHeight, which ScrollSmoother reads)
  function sync() {
    smoothContent.style.paddingBottom = `${footer.offsetHeight}px`;
    ScrollTrigger.refresh();
  }
  sync();

  const ro = new ResizeObserver(sync);
  ro.observe(footer);

  // Anchor nav links — scroll via ScrollSmoother for smooth behavior
  const navLinks = footer.querySelectorAll('.footer-nav-link[href^="#"]');
  const navHandler = (e) => {
    const href = e.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const sm = ScrollSmoother.get();
    if (sm) {
      sm.scrollTo(target, true);
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };
  navLinks.forEach((link) => link.addEventListener('click', navHandler));

  return () => {
    ro.disconnect();
    smoothContent.style.paddingBottom = '';
    navLinks.forEach((link) => link.removeEventListener('click', navHandler));
  };
}
