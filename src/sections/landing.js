/**
 * Hero Z-Depth Zoom Animation
 * Creates cinematic zoom transition where hero recedes as user scrolls
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';

const config = {
  scrollDistance: '150%',
  scrubAmount: 1.5,
  zoomScale: 1.15,
  blurMax: 8,
};

export function initLanding() {
  const hero = document.querySelector('.hero-section');
  const video = document.querySelector('.hero-video');
  const content = document.querySelector('.hero-content');
  const gradient = document.querySelector('.hero-gradient');

  if (!hero) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    gsap.set(hero, { opacity: 1 });
    return () => {};
  }

  let cleanupHeroNameMask = () => {};

  const ctx = gsap.context(() => {
    cleanupHeroNameMask = textMaskRiseWords('.hero-name', {
      delay: 0.3,
      duration: 1.2,
      stagger: 0.12,
      yOffset: 30,
    });

    // Force GPU compositing to prevent flicker
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

    const tl = gsap.timeline({ paused: true });

    tl.to(
      hero,
      {
        scale: config.zoomScale,
        opacity: 0,
        duration: 1,
        ease: 'none',
      },
      0,
    );

    if (video) {
      tl.to(
        video,
        {
          filter: `blur(${config.blurMax}px)`,
          duration: 0.8,
          ease: 'none',
        },
        0,
      );
    }

    if (content) {
      tl.to(
        content,
        {
          opacity: 0,
          y: -50,
          duration: 0.5,
          ease: 'power2.in',
        },
        0,
      );
    }

    if (gradient) {
      tl.to(
        gradient,
        {
          background: 'rgba(0, 0, 0, 0.9)',
          duration: 0.7,
          ease: 'none',
        },
        0,
      );
    }

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: `+=${config.scrollDistance}`,
      scrub: config.scrubAmount,
      animation: tl,
      onUpdate: (self) => {
        document.dispatchEvent(
          new CustomEvent('heroZoomProgress', {
            detail: { progress: self.progress },
          }),
        );
      },
    });
  }, hero);

  return () => {
    ctx.revert();
    cleanupHeroNameMask();
  };
}
