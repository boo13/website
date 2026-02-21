import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';
import { SCRUB } from '../config.js';

/**
 * About Slides Section
 * Full-viewport scroll-driven narrative slides
 * Slide 1: Grid zoom-out from 7x to 1x scale (scrub-linked, 7x7 grid, tilts into 3D on zoom-out)
 * Slide 2: Phone mockups with pinned scroll
 */
export function initAboutSlides() {
  const section = document.querySelector('.about-slides-section');
  if (!section) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Show all content immediately, no animations
    gsap.set(section.querySelectorAll('.slide-content'), { opacity: 1 });
    gsap.set(section.querySelectorAll('.slide-intro'), { opacity: 1 });
    gsap.set(section.querySelectorAll('.slide-headline'), { opacity: 1 });
    gsap.set(section.querySelectorAll('.phone-mockup'), { opacity: 1 });
    // Slide 2 is hidden by CSS in the wrapper - make it visible
    gsap.set(section.querySelector('.slide-in-your-hand'), {
      opacity: 1,
      visibility: 'visible',
    });
    return () => {};
  }

  // Track cleanup functions
  let cleanupSlide1Headline = () => {};
  let cleanupSlide2Headline = () => {};
  let cleanupObserver = () => {};
  let cleanupGridVideoLoader = () => {};
  let cleanupGridVideos = () => {};

  const ctx = gsap.context(() => {
    // =====================================================
    // SLIDES 1+2: PINNED CROSS-TRANSITION
    // One wrapper, one pin, one master timeline:
    //   Phase 1 (0–0.35):   Grid zoom-out (scale 7→1, tilt into 3D)
    //   Phase 2 (0.35–0.50): Darken grid bg, Slide 1 text out
    //   Phase 3 (0.50–0.60): Slide 2 appears, text-mask-rise
    //   Phase 4 (0.55–1.0):  Phones scroll through
    // =====================================================
    const wrapper = section.querySelector('.slide-transition-wrapper');
    const slideGoesBig = section.querySelector('.slide-goes-big');
    const slideInYourHand = section.querySelector('.slide-in-your-hand');
    const gridContainer = slideGoesBig?.querySelector('.grid-container');

    if (wrapper && slideGoesBig && slideInYourHand && gridContainer) {
      // --- Slide 1 elements ---
      const slide1Bg = slideGoesBig.querySelector('.slide-bg');
      const slide1Intro = slideGoesBig.querySelector('.slide-intro');
      const slide1Headline = slideGoesBig.querySelector('.slide-headline');

      // --- Slide 2 elements ---
      const slide2Intro = slideInYourHand.querySelector('.slide-intro');
      const slide2Headline = slideInYourHand.querySelector('.slide-headline');
      const phones = section.querySelectorAll(
        '.slide-in-your-hand .phone-mockup'
      );
      const gridVideos = Array.from(gridContainer.querySelectorAll('video'));
      const smallPhones = section.querySelectorAll(
        '.slide-in-your-hand .phone-mockup.phone-sm'
      );
      const lgPhone = section.querySelector(
        '.slide-in-your-hand .phone-mockup.phone-lg'
      );
      let gridVideosPaused = false;

      const setGridVideosPaused = (shouldPause) => {
        if (gridVideosPaused === shouldPause) return;
        gridVideosPaused = shouldPause;

        gridVideos.forEach((video) => {
          if (shouldPause) {
            video.pause();
          } else {
            video.play().catch(() => {});
          }
        });
      };
      cleanupGridVideos = () => setGridVideosPaused(true);

      // Activate deferred sources on a single video (idempotent — skips if
      // source.src is already set, so prefetch and ScrollTrigger paths are safe
      // to run in any order without double-loading).
      const activateVideo = (video) => {
        let hasDeferredSources = false;
        video.querySelectorAll('source').forEach((source) => {
          if (!source.dataset.src || source.src) return;
          source.src = source.dataset.src;
          hasDeferredSources = true;
        });
        if (hasDeferredSources) video.load();
        video.play().catch(() => {});
      };

      // ScrollTrigger fallback: activates any remaining un-prefetched grid
      // videos when the section is 300px from the viewport. Uses ScrollTrigger
      // instead of IntersectionObserver to fix ScrollSmoother position mismatch.
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom+=300',
        once: true,
        onEnter: () => gridVideos.forEach(activateVideo),
      });

      // Idle prefetch: warm up grid videos after the hero preloader finishes.
      // Center cell (grid-hero) loads first — it's visible at 7× zoom.
      // Remaining videos load in batches of 4, chained via loadeddata/error
      // so a single stalled video doesn't block the whole queue.
      let idleCallbackId = null;
      const heroGridVideo = gridContainer.querySelector('.grid-hero video');
      const otherGridVideos = gridVideos.filter((v) => v !== heroGridVideo);

      const loadBatch = (videos, startIndex) => {
        const batch = videos.slice(startIndex, startIndex + 4);
        if (!batch.length) return;
        batch.forEach(activateVideo);
        const nextIndex = startIndex + 4;
        if (nextIndex >= videos.length) return;
        const pivot = batch[0];
        const advance = () => {
          pivot.removeEventListener('loadeddata', advance);
          pivot.removeEventListener('error', advance);
          loadBatch(videos, nextIndex);
        };
        pivot.addEventListener('loadeddata', advance);
        pivot.addEventListener('error', advance);
      };

      const onLoadingComplete = () => {
        const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
        idleCallbackId = ric(() => {
          if (heroGridVideo) activateVideo(heroGridVideo);
          loadBatch(otherGridVideos, 0);
        });
      };
      document.addEventListener('loadingComplete', onLoadingComplete, {
        once: true,
      });
      cleanupGridVideoLoader = () => {
        document.removeEventListener('loadingComplete', onLoadingComplete);
        if (idleCallbackId !== null) {
          const cric = window.cancelIdleCallback || clearTimeout;
          cric(idleCallbackId);
          idleCallbackId = null;
        }
      };

      // --- Initial states ---
      gsap.set(gridContainer, {
        scale: 7,
        transformPerspective: 1200,
        transformOrigin: 'center center',
      });
      gsap.set(phones, { opacity: 0, yPercent: 120 });

      // Per-phone variation: 3D tilt, scale, speed, depth layer
      const smallVariants = [
        {
          rotateY: -3,
          scale: 1,
          speed: 0.95,
          delay: 0,
          exitY: -125,
          behind: false,
        },
        {
          rotateY: 2,
          scale: 0.88,
          speed: 1.0,
          delay: 0.03,
          exitY: -118,
          behind: true,
        },
        {
          rotateY: -2,
          scale: 1,
          speed: 1.05,
          delay: 0.055,
          exitY: -130,
          behind: false,
        },
        {
          rotateY: 3,
          scale: 0.85,
          speed: 0.92,
          delay: 0.08,
          exitY: -115,
          behind: true,
        },
        {
          rotateY: -1.5,
          scale: 0.92,
          speed: 0.98,
          delay: 0.1,
          exitY: -122,
          behind: false,
        },
      ];

      Array.from(smallPhones).forEach((phone, i) => {
        const v = smallVariants[i] || smallVariants[0];
        gsap.set(phone, {
          rotateY: v.rotateY,
          scale: v.scale,
          transformPerspective: 800,
          zIndex: v.behind ? 0 : 3,
        });
        if (v.behind) phone.classList.add('phone-behind');
      });

      // =====================================================
      // BUILD MASTER TIMELINE (normalized to duration 1)
      // =====================================================
      const masterTl = gsap.timeline({ paused: true });

      // --- Phase 1: Grid zoom-out (0–0.35) ---
      masterTl.to(
        gridContainer,
        {
          scale: 1,
          rotateY: -4,
          duration: 0.35,
          ease: 'none',
        },
        0
      );

      // --- Phase 2: Darken + Slide 1 text out (0.35–0.50) ---
      if (slide1Bg) {
        masterTl.to(
          slide1Bg,
          {
            opacity: 0.2,
            duration: 0.15,
            ease: 'none',
          },
          0.35
        );
      }

      // Slide 1 text fades out + drops down
      if (slide1Intro) {
        masterTl.to(
          slide1Intro,
          {
            opacity: 0,
            y: 30,
            duration: 0.12,
            ease: 'power2.in',
          },
          0.35
        );
      }
      if (slide1Headline) {
        masterTl.to(
          slide1Headline,
          {
            opacity: 0,
            y: 30,
            duration: 0.12,
            ease: 'power2.in',
          },
          0.37
        );
      }

      // --- Phase 3: Slide 2 appears (0.48–0.55) ---
      // Visibility + opacity on the slide itself
      masterTl.set(
        slideInYourHand,
        {
          visibility: 'visible',
        },
        0.48
      );
      masterTl.to(
        slideInYourHand,
        {
          opacity: 1,
          duration: 0.07,
          ease: 'none',
        },
        0.48
      );

      // --- Phase 4: Phones (placed directly in master timeline) ---
      // Small phones travel through and exit by 0.88 (buffer for scrub lag).
      // Large phone enters and holds - scrolls away naturally on unpin.
      // More aggressive exitY so they clear the viewport completely.
      const phoneStart = 0.5; // Phones begin as Slide 2 appears
      const phoneEnd = 0.88; // Small phones finish before pin ends (scrub buffer)
      const phoneDur = phoneEnd - phoneStart; // 0.38

      Array.from(smallPhones).forEach((phone, i) => {
        const v = smallVariants[i] || smallVariants[0];
        const staggerOffset = v.delay * 0.15; // Compress stagger into master scale

        // Quick fade-in
        masterTl.fromTo(
          phone,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.03,
            ease: 'power2.out',
            immediateRender: false,
          },
          phoneStart + staggerOffset
        );

        // Travel from below to well above viewport
        masterTl.to(
          phone,
          {
            yPercent: v.exitY * 1.6, // More aggressive exit — fully off-screen
            duration: phoneDur - staggerOffset,
            ease: 'none',
          },
          phoneStart + staggerOffset
        );
      });

      // Large phone: enters and settles — no exit tween.
      if (lgPhone) {
        masterTl.fromTo(
          lgPhone,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.03,
            ease: 'power2.out',
            immediateRender: false,
          },
          phoneStart
        );

        masterTl.fromTo(
          lgPhone,
          { yPercent: 120 },
          {
            yPercent: 0,
            duration: 0.15,
            ease: 'power2.out',
          },
          phoneStart
        );
      }

      // --- Text reveal triggers (time-based, not scrub-linked) ---
      let slide1TextRevealed = false;
      let slide2TextRevealed = false;

      // Pin wrapper and scrub the master timeline
      ScrollTrigger.create({
        id: 'about-slides-pin',
        trigger: wrapper,
        start: 'top top',
        end: '+=350%',
        scrub: SCRUB.smooth,
        pin: true,
        refreshPriority: 1,
        animation: masterTl,
        invalidateOnRefresh: true,
        onEnter: () => {
          setGridVideosPaused(false);

          // Slide 1 text fires once when pin starts.
          if (slide1TextRevealed) return;
          slide1TextRevealed = true;

          if (slide1Intro) {
            gsap.fromTo(
              slide1Intro,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out',
              }
            );
          }

          if (slide1Headline) {
            cleanupSlide1Headline();
            cleanupSlide1Headline = textMaskRiseWords(slide1Headline, {
              duration: 1.5,
              stagger: 0.15,
              yOffset: 40,
              delay: 0.3,
            });
          }
        },
        onUpdate: (self) => {
          // Pause hidden grid videos before phone videos begin to reduce decode load.
          setGridVideosPaused(self.progress >= 0.45);

          // Slide 2 text fires once when we reach the transition point
          if (!slide2TextRevealed && self.progress >= 0.48) {
            slide2TextRevealed = true;

            if (slide2Intro) {
              gsap.fromTo(
                slide2Intro,
                { opacity: 0, y: 20 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 1.2,
                  ease: 'power3.out',
                }
              );
            }

            if (slide2Headline) {
              cleanupSlide2Headline();
              cleanupSlide2Headline = textMaskRiseWords(slide2Headline, {
                duration: 1.5,
                stagger: 0.15,
                yOffset: 40,
                delay: 0.3,
              });
            }
          }
        },
        onLeaveBack: () => {
          setGridVideosPaused(false);

          // Reset one-shot reveal flags/states so text reveals can replay.
          slide1TextRevealed = false;
          slide2TextRevealed = false;

          cleanupSlide1Headline();
          cleanupSlide2Headline();
          cleanupSlide1Headline = () => {};
          cleanupSlide2Headline = () => {};

          if (slide1Intro) gsap.set(slide1Intro, { opacity: 0, y: 0 });
          if (slide1Headline) gsap.set(slide1Headline, { opacity: 0, y: 0 });
          if (slide2Intro) gsap.set(slide2Intro, { opacity: 0, y: 0 });
          if (slide2Headline) gsap.set(slide2Headline, { opacity: 0, y: 0 });
        },
        onLeave: () => {
          setGridVideosPaused(true);
        },
      });

      // Play/pause phone videos based on visibility
      const phoneObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target.querySelector('.phone-video');
            if (!video) return;
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.1 }
      );

      phones.forEach((phone) => phoneObserver.observe(phone));
      cleanupObserver = () => phoneObserver.disconnect();
    }
  }, section);

  return () => {
    ctx.revert();
    cleanupSlide1Headline();
    cleanupSlide2Headline();
    cleanupObserver();
    cleanupGridVideoLoader();
    cleanupGridVideos();
  };
}
