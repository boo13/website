import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import SplitText from 'gsap/SplitText';
import { SCRUB } from '../config.js';

gsap.registerPlugin(SplitText);

/**
 * About Intro Section
 * - Scroll-pinned char-level opacity fill (ghost grey → white)
 * - GSAP-driven client marquee (pauses on hover, speeds up on scroll)
 * - Phone mockups rise into view after text reveal (~70% through pin)
 */
export function initAboutIntro() {
  const section = document.querySelector('.about-intro-section');
  if (!section) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return () => {};

  const ctx = gsap.context(() => {
    // ─── GSAP Marquee ────────────────────────────────────────────────────────
    const track = section.querySelector('.about-intro__marquee-track');
    let marqueeTween = null;

    if (track) {
      // Clone items once for seamless loop
      Array.from(track.children).forEach(item =>
        track.appendChild(item.cloneNode(true))
      );

      const halfWidth = track.scrollWidth / 2;

      marqueeTween = gsap.to(track, {
        x: -halfWidth,
        duration: 30,
        ease: 'none',
        repeat: -1,
      });

      // Pause on hover (accessibility)
      const marqueeEl = section.querySelector('.about-intro__marquee');
      if (marqueeEl) {
        marqueeEl.addEventListener('mouseenter', () => marqueeTween.pause());
        marqueeEl.addEventListener('mouseleave', () => marqueeTween.resume());
      }
    }

    // ─── Text Split ──────────────────────────────────────────────────────────
    const textEl = section.querySelector('.about-intro__text');
    if (!textEl) return;

    const split = SplitText.create(textEl, {
      type: 'words,chars',
      charsClass: 'char',
      wordsClass: 'word',
    });

    const chars = split.chars;
    if (!chars.length) return;

    // Use opacity — GPU-composited, no repaints
    gsap.set(chars, { opacity: 0.15 });

    // ─── Phone Mockups ───────────────────────────────────────────────────────
    const phoneEls = [...section.querySelectorAll('.about-intro__phone')];
    const rotateYValues = [-3, 2, -2, 3];

    if (phoneEls.length) {
      gsap.set(phoneEls, { yPercent: 120, opacity: 0, filter: 'blur(8px)', transformPerspective: 800 });
      phoneEls.forEach((el, i) => {
        if (rotateYValues[i] !== undefined) gsap.set(el, { rotateY: rotateYValues[i] });
      });
    }

    // ─── Timeline ────────────────────────────────────────────────────────────
    const tl = gsap.timeline();

    // Text reveal: chars light up left→right, fills ~1.0 GSAP time units
    tl.to(chars, {
      opacity: 1,
      duration: 3 / chars.length,
      stagger: { each: 1 / chars.length, from: 'start' },
      ease: 'none',
    });

    // Phones rise in starting at absolute position 0.7 (after text ~70% revealed)
    if (phoneEls.length) {
      tl.to(
        phoneEls,
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          stagger: 0.1,
          duration: 0.3,
          ease: 'power2.out',
          onStart() {
            phoneEls.forEach((el) => {
              const v = el.querySelector('.about-intro__phone-video');
              if (v) v.play().catch(() => {});
            });
          },
        },
        0.7
      );
      // Breathing room at end — phones fully visible before unpin
      tl.to({}, {}, '+=0.3');
    }

    // ─── ScrollTrigger Pin ───────────────────────────────────────────────────
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
      onUpdate: () => {
        if (!marqueeTween) return;
        const v = Math.abs(ScrollTrigger.getVelocity());
        gsap.to(marqueeTween, {
          timeScale: v > 50 ? Math.max(1, 1 + v / 800) : 1,
          duration: v > 50 ? 0.4 : 1.5,
          ease: v > 50 ? 'power1.out' : 'power2.out',
          overwrite: true,
        });
      },
    });
  }, section);

  return () => ctx.revert();
}
