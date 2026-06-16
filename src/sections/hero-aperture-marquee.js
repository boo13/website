import {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
} from '../animations/scroll-defaults.js';
import { prefersReducedMotion } from '../utils/dom.js';

export function initMarquee() {
  const scope = document.querySelector('.portal-scene--aperture-dual');
  const track = scope?.querySelector('.about-intro__marquee-track');
  if (!track) return () => {};

  if (prefersReducedMotion()) return () => {};

  let removeHoverListeners = () => {};

  const ctx = gsap.context(() => {
    Array.from(track.children).forEach((item) =>
      track.appendChild(item.cloneNode(true))
    );

    const halfWidth = track.scrollWidth / 2;
    const marqueeTween = gsap.to(track, {
      x: -halfWidth,
      duration: 30,
      ease: 'none',
      repeat: -1,
    });

    const marqueeEl = scope.querySelector('.about-intro__marquee');
    let isHovering = false;
    if (marqueeEl) {
      const rampTimeScale = (timeScale, duration) => {
        gsap.to(marqueeTween, {
          timeScale,
          duration,
          ease: 'power2.out',
          overwrite: true,
        });
      };
      const handleMouseEnter = () => {
        isHovering = true;
        rampTimeScale(0, 0.4);
      };
      const handleMouseLeave = () => {
        isHovering = false;
        rampTimeScale(1, 0.6);
      };
      marqueeEl.addEventListener('mouseenter', handleMouseEnter);
      marqueeEl.addEventListener('mouseleave', handleMouseLeave);
      removeHoverListeners = () => {
        marqueeEl.removeEventListener('mouseenter', handleMouseEnter);
        marqueeEl.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    ScrollTrigger.create({
      trigger: scope,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: () => {
        if (isHovering) return;
        const v = Math.abs(ScrollSmoother.get()?.getVelocity() ?? 0);
        gsap.to(marqueeTween, {
          timeScale: v > 50 ? Math.min(4, 1 + v / 800) : 1,
          duration: v > 50 ? 0.4 : 1.5,
          ease: v > 50 ? 'power1.out' : 'power2.out',
          overwrite: true,
        });
      },
    });
  }, scope);

  return () => {
    removeHoverListeners();
    ctx.revert();
  };
}
