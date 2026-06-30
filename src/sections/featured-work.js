/**
 * Wyatt Earp Parallax Rack-Focus Effect
 * Creates cinematic depth-of-field shift with layered images
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { BREAKPOINTS } from '../config.js';
import { prefersReducedMotion } from '../utils/dom.js';

const config = {
  bgBlurStart: 6,
  bgBlurEnd: 0,
  bgYStart: 80,
  bgYEnd: -100,
  bgScaleStart: 1.08,
  bgScaleEnd: 1.18,

  fgBlurStart: 0,
  fgBlurEnd: 5,
  fgYStart: 0,
  fgYEnd: -15,
  fgScaleStart: 1,
  fgScaleEnd: 1.12,

  textBlurStart: 3,
  textBlurEnd: 0,
  textYStart: 40,
  textYEnd: -60,

  scrubAmount: 1.5,
};

export function initFeaturedWork() {
  const section = document.querySelector('.parallax-section');
  const bg = document.querySelector('.parallax-bg');
  const fg = document.querySelector('.parallax-fg');
  const bgFade = document.querySelector('.parallax-bg-fade');
  const fgFade = document.querySelector('.parallax-fg-fade');
  const textLayer = document.querySelector('.parallax-text');

  if (!section || !bg || !fg) return;

  const isMobile = window.innerWidth <= BREAKPOINTS.tablet;

  if (prefersReducedMotion() || isMobile) {
    gsap.set(bg, { filter: 'blur(0px)', opacity: 1 });
    gsap.set(fg, { filter: 'blur(3px)', opacity: 0.8 });
    if (textLayer) {
      gsap.set(textLayer, { filter: 'blur(0px)', opacity: 1 });
    }
    return;
  }

  const c = config;

  const ctx = gsap.context(() => {
    // Force GPU compositing
    [bg, fg, textLayer].forEach((el) => {
      if (el) {
        el.style.transform = 'translate3d(0, 0, 0)';
        el.style.webkitTransform = 'translate3d(0, 0, 0)';
      }
    });

    // Set initial state
    gsap.set(bg, {
      filter: `blur(${c.bgBlurStart}px)`,
      scale: c.bgScaleStart,
      y: c.bgYStart,
      opacity: 1,
    });
    gsap.set(fg, {
      filter: `blur(${c.fgBlurStart}px)`,
      scale: c.fgScaleStart,
      y: c.fgYStart,
      opacity: 1,
    });
    if (textLayer) {
      gsap.set(textLayer, {
        filter: `blur(${c.textBlurStart}px)`,
        y: c.textYStart,
        opacity: 1,
      });
    }
    if (bgFade) gsap.set(bgFade, { opacity: 0 });
    if (fgFade) gsap.set(fgFade, { opacity: 0 });

    // Build timeline
    const tl = gsap.timeline({ paused: true });

    // Background: blur reduces, moves up, scales
    tl.to(
      bg,
      {
        filter: `blur(${c.bgBlurEnd}px)`,
        scale: c.bgScaleEnd,
        y: c.bgYEnd,
        duration: 0.5,
        ease: 'power1.inOut',
      },
      0
    );

    // Foreground: blur increases, subtle movement
    tl.to(
      fg,
      {
        filter: `blur(${c.fgBlurEnd}px)`,
        scale: c.fgScaleEnd,
        y: c.fgYEnd,
        duration: 0.5,
        ease: 'power1.inOut',
      },
      0
    );

    // Text sharpens quickly
    if (textLayer) {
      tl.to(
        textLayer,
        {
          filter: 'blur(0px)',
          duration: 0.25,
          ease: 'power2.out',
        },
        0
      );
      tl.to(
        textLayer,
        {
          y: c.textYEnd,
          duration: 1,
          ease: 'none',
        },
        0
      );
    }

    // Phase 2: Fade to black
    if (bgFade) {
      tl.to(bgFade, { opacity: 1, duration: 0.35, ease: 'power1.in' }, 0.55);
    }
    tl.to(bg, { opacity: 0.15, duration: 0.2, ease: 'power1.in' }, 0.55);
    tl.to(
      bg,
      {
        opacity: 0.03,
        filter: 'blur(12px)',
        duration: 0.25,
        ease: 'power1.in',
      },
      0.75
    );

    if (fgFade) {
      tl.to(fgFade, { opacity: 1, duration: 0.25, ease: 'power1.in' }, 0.6);
    }
    tl.to(fg, { opacity: 0.25, duration: 0.2, ease: 'power1.in' }, 0.65);
    tl.to(
      fg,
      { opacity: 0.05, filter: 'blur(10px)', duration: 0.2, ease: 'power1.in' },
      0.8
    );

    if (textLayer) {
      tl.to(textLayer, { opacity: 0.85, duration: 0.15, ease: 'none' }, 0.85);
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: c.scrubAmount,
      animation: tl,
      onUpdate: (self) => {
        document.dispatchEvent(
          new CustomEvent('parallaxProgress', {
            detail: { progress: self.progress },
          })
        );
      },
    });
  }, section);

  return () => ctx.revert();
}
