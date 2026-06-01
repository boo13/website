import { gsap, ScrollTrigger, ScrollSmoother } from '../animations/scroll-defaults.js';

export { gsap, ScrollTrigger };

export const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

export function initSmooth() {
  return ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1,
    effects: true,
    smoothTouch: 0.1,
  });
}

export function getHeroEls() {
  return {
    hero: document.querySelector('.hero-section'),
    video: document.querySelector('.hero-video'),
    content: document.querySelector('.hero-content'),
    gradient: document.querySelector('.hero-gradient'),
    topGradient: document.querySelector('.hero-top-transition-gradient'),
  };
}

export function primeGPU(hero, video, content) {
  [hero, video].forEach((el) => {
    if (el) {
      el.style.transform = 'translate3d(0, 0, 0)';
      el.style.webkitTransform = 'translate3d(0, 0, 0)';
    }
  });
  if (content) {
    content.style.transform = 'translate3d(0, -50%, 0)';
    content.style.webkitTransform = 'translate3d(0, -50%, 0)';
  }
}
