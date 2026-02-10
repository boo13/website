/**
 * Hero Z-Depth Zoom Animation
 * Creates cinematic zoom transition where hero recedes as user scrolls
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import Flip from 'gsap/Flip';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';

gsap.registerPlugin(Flip);

const config = {
  scrollDistance: '150%',
  scrubAmount: 1.5,
  zoomScale: 1.15,
  blurMax: 8,
  nameFlipDuration: 0.5,
  nameFlipScrollDistance: '45%',
};

export function initLanding() {
  const hero = document.querySelector('.hero-section');
  const video = document.querySelector('.hero-video');
  const content = document.querySelector('.hero-content');
  const gradient = document.querySelector('.hero-gradient');
  const heroName = hero?.querySelector('.hero-content .hero-name') ?? null;
  const fixedHeroName = document.getElementById('hero-name-fixed');
  const heroSubtitle = hero?.querySelector('.hero-subtitle') ?? null;
  const fixedSubtitle = document.getElementById('hero-subtitle-fixed');

  if (!hero) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    gsap.set(hero, { opacity: 1 });
    return () => {};
  }

  let cleanupHeroNameMask = () => {};
  let nameRafId = null;

  const ctx = gsap.context(() => {
    // Force GPU compositing BEFORE any measurements to ensure stable layout
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

    const nameAnimationTarget = fixedHeroName || heroName;

    cleanupHeroNameMask = textMaskRiseWords(nameAnimationTarget, {
      delay: 0.3,
      duration: 1.2,
      stagger: 0.12,
      yOffset: 30,
    });

    if (heroName && fixedHeroName) {
      gsap.set(heroName, { autoAlpha: 0 });

      // Defer Flip measurement by one paint frame so the browser settles
      // after SplitText DOM insertions and GPU-layer promotion.
      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      fontsReady.then(() => {
        nameRafId = requestAnimationFrame(() => {
          nameRafId = null;
          ctx.add(() => {
            // scale: true makes Flip use CSS scaleX/scaleY instead of
            // width/height, so the text visually enlarges to hero size.
            const nameFlip = Flip.fit(fixedHeroName, heroName, {
              scale: true,
              ease: 'none',
              duration: config.nameFlipDuration,
            }).pause();

            const getFitDelta = () => {
              const heroRect = heroName.getBoundingClientRect();
              const fixedRect = fixedHeroName.getBoundingClientRect();
              return (
                Math.abs(fixedRect.x - heroRect.x)
                + Math.abs(fixedRect.y - heroRect.y)
                + Math.abs(fixedRect.width - heroRect.width)
                + Math.abs(fixedRect.height - heroRect.height)
              );
            };

            nameFlip.progress(0);
            const deltaAtZero = getFitDelta();
            nameFlip.progress(1);
            const deltaAtOne = getFitDelta();

            // Whichever progress best matches hero bounds is the initial state
            const heroProgress = deltaAtOne <= deltaAtZero ? 1 : 0;
            const headerProgress = heroProgress === 1 ? 0 : 1;
            nameFlip.progress(heroProgress);
            gsap.set(fixedHeroName, { autoAlpha: 1 });

            // --- Subtitle: lock to title's bottom edge + fade out ---
            let subEntrance = null;
            let subInitialGap = 0;
            let subStartTop = 0;
            let hasSubtitle = false;

            if (heroSubtitle && fixedSubtitle) {
              hasSubtitle = true;

              // Kill CSS entrance animation to get true layout position
              heroSubtitle.style.animation = 'none';
              heroSubtitle.style.opacity = '1';
              heroSubtitle.style.transform = 'none';

              const subRect = heroSubtitle.getBoundingClientRect();
              const titleRect = fixedHeroName.getBoundingClientRect();

              // Gap between title bottom and subtitle top at hero size
              subInitialGap = subRect.top - titleRect.bottom;
              subStartTop = subRect.top;

              // Hide original, position fixed subtitle at hero location
              gsap.set(heroSubtitle, { autoAlpha: 0 });
              gsap.set(fixedSubtitle, {
                left: subRect.left,
                top: subStartTop,
                autoAlpha: 0,
              });

              // Entrance animation (after title text-mask-rise settles)
              subEntrance = gsap.to(fixedSubtitle, {
                autoAlpha: 1,
                delay: 1.2,
                duration: 1.2,
                ease: 'expo.out',
              });
            }

            ScrollTrigger.create({
              trigger: hero,
              start: 'top top',
              end: `+=${config.nameFlipScrollDistance}`,
              scrub: true,
              onUpdate: (self) => {
                const progress = gsap.utils.interpolate(
                  heroProgress,
                  headerProgress,
                  self.progress,
                );
                nameFlip.progress(progress);

                if (hasSubtitle) {
                  if (subEntrance) {
                    subEntrance.kill();
                    subEntrance = null;
                  }
                  // Read title's current visual bottom edge, keep subtitle locked below it
                  const titleBottom = fixedHeroName.getBoundingClientRect().bottom;
                  gsap.set(fixedSubtitle, {
                    y: titleBottom + subInitialGap - subStartTop,
                    autoAlpha: 1 - self.progress,
                  });
                }
              },
            });

            ScrollTrigger.refresh();

            // After the text-mask-rise entrance completes, remove
            // overflow:clip from the SplitText mask wrappers. The mask
            // is only needed during the initial rise-in reveal; leaving
            // it active causes compositor glitches when Flip repeatedly
            // scales the parent between hero and header sizes.
            gsap.delayedCall(2, () => {
              fixedHeroName.querySelectorAll('.word').forEach((w) => {
                if (w.parentElement && w.parentElement !== fixedHeroName) {
                  w.parentElement.style.overflow = '';
                }
                w.style.willChange = 'auto';
              });
            });
          });
        });
      });
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
    if (nameRafId !== null) cancelAnimationFrame(nameRafId);
    ctx.revert();
    cleanupHeroNameMask();
  };
}
