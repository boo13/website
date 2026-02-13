/**
 * Footer Reveal
 * Fixed footer revealed via clip-path on #smooth-wrapper.
 * A spacer inside #smooth-content creates extra scroll distance;
 * as it scrolls through, clip-path: inset() on the wrapper grows
 * from the bottom, progressively revealing the fixed footer behind.
 */

import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';

export function initFooterReveal() {
  const footer = document.getElementById('site-footer');
  const smoothContent = document.getElementById('smooth-content');
  const smoothWrapper = document.getElementById('smooth-wrapper');
  const spacer = smoothContent?.querySelector('.footer-spacer');
  if (!footer || !smoothContent || !smoothWrapper || !spacer) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Keep spacer height in sync with footer height
  function sync() {
    spacer.style.height = `${footer.offsetHeight}px`;
  }
  sync();

  const ro = new ResizeObserver(() => {
    sync();
    ScrollTrigger.refresh();
  });
  ro.observe(footer);

  // Scrub-driven clip-path reveal
  const revealTrigger = ScrollTrigger.create({
    trigger: spacer,
    start: 'top bottom',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const clipPx = self.progress * footer.offsetHeight;
      smoothWrapper.style.clipPath = `inset(0 0 ${clipPx}px 0)`;
      // Enable pointer-events when fully revealed
      footer.classList.toggle(
        'site-footer--interactive',
        self.progress >= 0.99
      );
    },
    onLeaveBack: () => {
      smoothWrapper.style.clipPath = '';
      footer.classList.remove('site-footer--interactive');
    },
  });

  // Anchor nav links — animate with GSAP ScrollToPlugin
  const navLinks = footer.querySelectorAll('.footer-nav-link[href^="#"]');
  const navHandler = (e) => {
    const href = e.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();

    gsap.to(window, {
      duration: 0.9,
      ease: 'power2.out',
      overwrite: 'auto',
      scrollTo: { y: target, autoKill: false },
    });
  };
  navLinks.forEach((link) => link.addEventListener('click', navHandler));

  return () => {
    revealTrigger.kill();
    ro.disconnect();
    spacer.style.height = '';
    smoothWrapper.style.clipPath = '';
    footer.classList.remove('site-footer--interactive');
    navLinks.forEach((link) => link.removeEventListener('click', navHandler));
  };
}
