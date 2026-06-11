/**
 * Hero Aggressive variant — ported from bd9f06e:v2/zoom-transition.js
 * Key deltas from restrained: scale 2.5x (desktop) / 2.0x (mobile),
 * blur 20px (desktop) / 12px (mobile), about-stub emerges from blur.
 */
import './styles.css';
import {
  gsap,
  ScrollTrigger,
  initSmooth,
  getHeroEls,
  primeGPU,
  prefersReducedMotion,
} from './shared.js';

const isMobile = window.innerWidth < 768;

const config = {
  scrollDistance: '200%',
  scrubAmount: 1.2,
  zoomScale: isMobile ? 2.0 : 2.5,
  blurMax: isMobile ? 12 : 20,
};

function init() {
  initSmooth();

  const { hero, video, content, gradient, topGradient } = getHeroEls();
  const aboutStub = document.querySelector('.about-stub');
  if (!hero) return;

  gsap.set('.hero-name', { autoAlpha: 1 });

  if (prefersReducedMotion) {
    if (topGradient) gsap.set(topGradient, { autoAlpha: 0.5 });
    return;
  }

  // About stub starts blurred and scaled down — emerges as hero exits
  if (aboutStub) {
    gsap.set(aboutStub, { opacity: 0, filter: 'blur(18px)', scale: 0.9 });
  }

  gsap.context(() => {
    primeGPU(hero, video, content);

    const tl = gsap.timeline({ paused: true });

    // Hero scales aggressively and fades
    tl.to(
      hero,
      { scale: config.zoomScale, opacity: 0, duration: 1, ease: 'power1.in' },
      0
    );

    // Video blurs heavily — you feel like you're rushing through it
    if (video) {
      tl.to(
        video,
        {
          filter: `blur(${config.blurMax}px)`,
          duration: 0.7,
          ease: 'power2.in',
        },
        0
      );
    }

    // Content exits upward with blur
    if (content) {
      tl.to(
        content,
        { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' },
        0
      );
    }

    // Gradient darkens quickly
    if (gradient) {
      tl.to(
        gradient,
        { background: 'oklch(0 0 0 / 0.9)', duration: 0.5, ease: 'none' },
        0.1
      );
    }

    if (topGradient) {
      tl.to(topGradient, { autoAlpha: 1, duration: 0.5, ease: 'none' }, 0);
    }

    // About stub emerges from blur as hero exits — timed after hero fades
    if (aboutStub) {
      tl.to(
        aboutStub,
        {
          opacity: 1,
          filter: 'blur(0px)',
          scale: 1,
          ease: 'power2.out',
          duration: 0.6,
        },
        0.3
      );
    }

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: `+=${config.scrollDistance}`,
      scrub: config.scrubAmount,
      animation: tl,
    });
  }, hero);
}

document.addEventListener('DOMContentLoaded', init);
