import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import SplitText from 'gsap/SplitText';
import { SCRUB } from '../config.js';

gsap.registerPlugin(SplitText);

/**
 * About Intro Section
 * Scroll-pinned char-level gradient fill from ghost grey to white.
 * ~3 characters in transition at any scroll position for a tight,
 * crisp gradient edge matching the redomedia.co reference.
 */
export function initAboutIntro() {
  const section = document.querySelector('.about-intro-section');
  if (!section) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return () => {};

  const ctx = gsap.context(() => {
    const textEl = section.querySelector('.about-intro__text');
    if (!textEl) return;

    const split = SplitText.create(textEl, {
      type: 'words,chars',
      charsClass: 'char',
      wordsClass: 'word',
    });

    const chars = split.chars;
    if (!chars.length) return;

    // Use opacity instead of color — opacity is GPU-composited (no repaints)
    gsap.set(chars, { opacity: 0.15 });

    const tl = gsap.timeline();

    tl.to(chars, {
      opacity: 1,
      duration: 3 / chars.length,
      stagger: { each: 1 / chars.length, from: 'start' },
      ease: 'none',
    });

    ScrollTrigger.create({
      id: 'about-intro-pin',
      trigger: section,
      start: 'top top',
      pin: true,
      scrub: SCRUB.default,
      end: '+=200%',
      refreshPriority: 2,
      animation: tl,
      invalidateOnRefresh: true,
    });
  }, section);

  return () => ctx.revert();
}
