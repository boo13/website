/**
 * project-case-study.js — Image-dominant editorial layout for case study pages
 * Sections: hero, intro, pair, statement, triptych, asymmetric, closing
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';

function initCaseHero(ctx) {
  const hero = document.querySelector('.case-study__hero');
  if (!hero) return;

  const img = hero.querySelector('.case-study__hero-image');
  const overlay = hero.querySelector('.case-study__hero-overlay');

  if (img) {
    ctx.add(() => {
      gsap.fromTo(
        img,
        { scale: 1.15 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );
    });
  }

  if (overlay) {
    ctx.add(() => {
      gsap.fromTo(
        overlay.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          delay: 0.3,
          ease: 'power3.out',
          stagger: 0.15,
        }
      );
    });
  }
}

function initCaseIntro(ctx) {
  const intro = document.querySelector('.case-study__intro');
  if (!intro) return;

  const textEls = intro.querySelectorAll('.case-study__intro-text p');
  if (!textEls.length) return;

  let textCleanup;

  ctx.add(() => {
    ScrollTrigger.create({
      trigger: intro,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        textCleanup = textMaskRiseWords(textEls, {
          duration: 1.2,
          stagger: 0.15,
        });
      },
    });

    return () => {
      if (typeof textCleanup === 'function') textCleanup();
    };
  });
}

function initImageRevealSections(ctx) {
  // --- Pair sections: staggered opacity + y reveal ---
  document.querySelectorAll('.case-study__pair').forEach((section) => {
    const items = section.querySelectorAll('.case-study__pair-item img');
    if (!items.length) return;

    ctx.add(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            once: true,
          },
        }
      );
    });
  });

  // --- Statement sections: parallax y-offset scrub + entrance fade ---
  document.querySelectorAll('.case-study__statement').forEach((section) => {
    const imgWrap = section.querySelector('.case-study__statement-image');
    const img = imgWrap?.querySelector('img');
    if (!imgWrap || !img) return;

    ctx.add(() => {
      gsap.fromTo(
        img,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        imgWrap,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  });

  // --- Triptych sections: clip-path wipe ---
  document.querySelectorAll('.case-study__triptych').forEach((section) => {
    const items = section.querySelectorAll('.case-study__triptych-item img');
    if (!items.length) return;

    ctx.add(() => {
      gsap.to(items, {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1.2,
        ease: 'power3.inOut',
        stagger: 0.15,
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          once: true,
        },
      });
    });
  });

  // --- Asymmetric sections: layered entrance ---
  document.querySelectorAll('.case-study__asymmetric').forEach((section) => {
    const dominant = section.querySelector(
      '.case-study__asymmetric-item--dominant img'
    );
    const accent = section.querySelector(
      '.case-study__asymmetric-item--accent img'
    );

    ctx.add(() => {
      if (dominant) {
        gsap.fromTo(
          dominant,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              once: true,
            },
          }
        );
      }

      if (accent) {
        gsap.fromTo(
          accent,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            delay: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              once: true,
            },
          }
        );

        // Parallax drift on accent
        gsap.fromTo(
          accent,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }
    });
  });
}

function initChatGraphic(ctx) {
  document.querySelectorAll('.case-study__chat-graphic').forEach((section) => {
    const frames = section.querySelectorAll('.case-study__chat-frame');
    const sendItems = section.querySelectorAll('.case-study__send-item');
    const strip = section.querySelector('.case-study__send-strip');

    if (frames.length) {
      gsap.set(frames, { autoAlpha: 0 });
      gsap.set(frames[0], { autoAlpha: 1 });

      let intervalId = null;
      let current = 0;

      const step = () => {
        gsap.set(frames[current], { autoAlpha: 0 });
        current = (current + 1) % frames.length;
        gsap.set(frames[current], { autoAlpha: 1 });
      };

      ctx.add(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 85%',
          end: 'bottom top',
          onEnter: () => {
            intervalId = setInterval(step, 350);
          },
          onLeave: () => {
            clearInterval(intervalId);
            intervalId = null;
          },
          onEnterBack: () => {
            intervalId = setInterval(step, 350);
          },
          onLeaveBack: () => {
            clearInterval(intervalId);
            intervalId = null;
          },
        });
        return () => {
          clearInterval(intervalId);
        };
      });
    }

    if (sendItems.length) {
      ctx.add(() => {
        gsap.fromTo(
          sendItems,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.04,
            scrollTrigger: {
              trigger: strip || section,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    }

    if (strip) {
      let isDown = false;
      let startX;
      let scrollLeft;

      strip.addEventListener('mousedown', (e) => {
        isDown = true;
        strip.classList.add('is-dragging');
        startX = e.pageX - strip.offsetLeft;
        scrollLeft = strip.scrollLeft;
      });
      strip.addEventListener('mouseleave', () => {
        isDown = false;
        strip.classList.remove('is-dragging');
      });
      strip.addEventListener('mouseup', () => {
        isDown = false;
        strip.classList.remove('is-dragging');
      });
      strip.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - strip.offsetLeft;
        strip.scrollLeft = scrollLeft - (x - startX) * 1.5;
      });
    }
  });
}

function initCaseClosing(ctx) {
  const closing = document.querySelector('.case-study__closing');
  if (!closing) return;

  const img = closing.querySelector('.case-study__closing-image img');
  if (!img) return;

  ctx.add(() => {
    // Entrance fade
    gsap.fromTo(
      img,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: closing,
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Scrub-linked fade-to-black into credits
    gsap.to(img, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: closing,
        start: 'center center',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}

export function initProjectCaseStudy() {
  const root = document.querySelector('.case-study__hero');
  if (!root) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const ctx = gsap.context(() => {}, document.body);

  initCaseHero(ctx);
  initCaseIntro(ctx);
  initImageRevealSections(ctx);
  initChatGraphic(ctx);
  initCaseClosing(ctx);

  return () => ctx.revert();
}
