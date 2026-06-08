import {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
} from '../animations/scroll-defaults.js';

export function initMarquee() {
  const scope = document.querySelector('.portal-scene--aperture-dual');
  const track = scope?.querySelector('.about-intro__marquee-track');
  if (!track) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (prefersReducedMotion) return () => {};

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
    if (marqueeEl) {
      marqueeEl.addEventListener('mouseenter', () => marqueeTween.pause());
      marqueeEl.addEventListener('mouseleave', () => marqueeTween.resume());
    }

    ScrollTrigger.create({
      trigger: scope,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: () => {
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

  return () => ctx.revert();
}
