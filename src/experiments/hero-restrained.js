import './styles.css';
import {
  gsap,
  ScrollTrigger,
  initSmooth,
  getHeroEls,
  primeGPU,
  prefersReducedMotion,
} from './shared.js';

const config = {
  scrollDistance: '150%',
  scrubAmount: 1.5,
  zoomScale: 1.15,
  blurMax: 8,
};

function init() {
  initSmooth();

  const { hero, video, content, gradient, topGradient } = getHeroEls();
  if (!hero) return;

  gsap.set('.hero-name', { autoAlpha: 1 });

  if (prefersReducedMotion) {
    if (topGradient) gsap.set(topGradient, { autoAlpha: 0.5 });
    return;
  }

  gsap.context(() => {
    primeGPU(hero, video, content);

    const tl = gsap.timeline({ paused: true });

    tl.to(hero, { scale: config.zoomScale, opacity: 0, duration: 1, ease: 'none' }, 0);

    if (video) {
      tl.to(video, { filter: `blur(${config.blurMax}px)`, duration: 0.8, ease: 'none' }, 0);
    }

    if (content) {
      tl.to(content, { opacity: 0, y: -50, duration: 0.5, ease: 'power2.in' }, 0);
    }

    if (gradient) {
      tl.to(gradient, { background: 'oklch(0 0 0 / 0.9)', duration: 0.7, ease: 'none' }, 0);
    }

    if (topGradient) {
      tl.to(topGradient, { autoAlpha: 1, duration: 0.65, ease: 'none' }, 0);
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
