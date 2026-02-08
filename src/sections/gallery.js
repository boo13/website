/**
 * Horizontal Scroll Gallery
 * Vertical scroll triggers horizontal card movement
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { MOBILE_BREAKPOINT } from '../config.js';

export function initGallery() {
  const section = document.querySelector('.gallery-section');
  const track = document.querySelector('.gallery-track');
  const cards = document.querySelectorAll('.gallery-card');
  const progressCurrent = document.querySelector(
    '.gallery-progress .progress-current',
  );
  const progressTotal = document.querySelector(
    '.gallery-progress .progress-total',
  );

  if (!section || !track || !cards.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  let currentIndex = 0;

  function updateProgress(progress) {
    const totalCards = cards.length;
    const newIndex = Math.min(Math.floor(progress * totalCards) + 1, totalCards);
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      if (progressCurrent) progressCurrent.textContent = newIndex;
      if (progressTotal) progressTotal.textContent = totalCards;
    }
  }

  function setupVideoHover() {
    cards.forEach((card) => {
      const video = card.querySelector('.card-video');
      if (!video) return;
      card.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
  }

  if (prefersReducedMotion || isMobile) {
    track.style.flexDirection = 'column';
    track.style.gap = '2rem';
    cards.forEach((card) => {
      card.style.width = '100%';
      card.style.maxWidth = '800px';
      card.style.margin = '0 auto';
    });
    setupVideoHover();
    return;
  }

  const ctx = gsap.context(() => {
    const trackWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    let scrollDistance = trackWidth - viewportWidth + 200;

    gsap.to(track, {
      x: () => -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          updateProgress(self.progress);
          if (self.progress > 0 && self.progress < 1) {
            section.classList.add('active');
          } else {
            section.classList.remove('active');
          }
        },
        onEnter: () => section.classList.add('active'),
        onLeave: () => section.classList.remove('active'),
        onEnterBack: () => section.classList.add('active'),
        onLeaveBack: () => section.classList.remove('active'),
      },
    });

    updateProgress(0);
  }, section);

  setupVideoHover();

  function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (wasMobile !== isMobile) {
      window.location.reload();
      return;
    }
    if (!isMobile) {
      ScrollTrigger.refresh();
    }
  }

  window.addEventListener('resize', handleResize);

  return ctx;
}
