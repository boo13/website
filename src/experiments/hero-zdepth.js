/**
 * Hero Z-Depth variant — inspired by 0cc8d3b:v4/CinematicZoom.js
 * Very high scrub (4), long scroll distance (300%), heavy blur (18px),
 * rack-focus feel: video blurs INTO the about section.
 *
 * The v4 original had stacked z-layers across all site sections.
 * This adapts just the hero exit and about-stub entry to the same principles:
 * depth conveyed via blur + opacity, very deliberate scrub pacing.
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
  scrollDistance: '300%',
  scrubAmount: 4,
  zoomScale: 1.25,
  blurMax: isMobile ? 12 : 18,
};

// Rack-focus config from v4 parallaxConfig
const rackFocus = {
  bgBlurStart: 0,
  bgBlurEnd: config.blurMax,
  fgBlurStart: 0,
  fgBlurEnd: 5,
};

function init() {
  initSmooth();

  const { hero, video, content, gradient, topGradient } = getHeroEls();
  const videoContainer = hero?.querySelector('.hero-video-container');
  const aboutStub = document.querySelector('.about-stub');
  if (!hero) return;

  gsap.set('.hero-name', { autoAlpha: 1 });

  if (prefersReducedMotion) {
    if (topGradient) gsap.set(topGradient, { autoAlpha: 0.5 });
    if (videoContainer) gsap.set(videoContainer, { autoAlpha: 0 });
    if (content) gsap.set(content, { autoAlpha: 0 });
    if (aboutStub) gsap.set(aboutStub, { autoAlpha: 1 });
    return;
  }

  // About stub starts invisible — fades in during the long scroll
  if (aboutStub) {
    gsap.set(aboutStub, { opacity: 0 });
  }

  gsap.context(() => {
    primeGPU(hero, video, content);

    const tl = gsap.timeline({ paused: true });

    // Phase 1 (0–0.4): hero holds while video starts to blur (rack focus effect)
    tl.to(
      video,
      {
        filter: `blur(${rackFocus.bgBlurEnd}px)`,
        scale: config.zoomScale,
        duration: 0.6,
        ease: 'none',
      },
      0
    );

    // Content blurs slightly as focus racks away from hero (v4 fgBlurEnd: 5)
    if (content) {
      tl.to(
        content,
        { filter: `blur(${rackFocus.fgBlurEnd}px)`, opacity: 0, duration: 0.5, ease: 'power1.in' },
        0
      );
    }

    // Phase 2 (0.3–0.7): video layer fades and darkens
    tl.to(
      videoContainer,
      { opacity: 0, duration: 0.5, ease: 'power2.in' },
      0.3
    );

    if (gradient) {
      tl.to(
        gradient,
        { background: 'oklch(0 0 0 / 0.95)', duration: 0.6, ease: 'none' },
        0.2
      );
    }

    if (topGradient) {
      tl.to(topGradient, { autoAlpha: 1, duration: 0.5, ease: 'none' }, 0.1);
    }

    // Phase 3 (0.6–1.0): about-stub surfaces — slow deliberate reveal
    if (aboutStub) {
      tl.to(aboutStub, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.6);
    }

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: `+=${config.scrollDistance}`,
      pin: true,
      scrub: config.scrubAmount,
      anticipatePin: 1,
      animation: tl,
    });
  }, hero);
}

document.addEventListener('DOMContentLoaded', init);
