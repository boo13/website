import { gsap } from 'gsap';
import { prefersReducedMotion } from './dom.js';

export function swapHidden(hideEl, showEl, { y = 12, duration = 0.4 } = {}) {
  if (hideEl) hideEl.hidden = true;
  if (!showEl) return null;

  showEl.hidden = false;
  if (prefersReducedMotion()) return null;

  gsap.killTweensOf(showEl);
  return gsap.fromTo(
    showEl,
    { autoAlpha: 0, y },
    {
      autoAlpha: 1,
      y: 0,
      duration,
      ease: 'power2.out',
      clearProps: 'opacity,visibility,transform',
    }
  );
}
