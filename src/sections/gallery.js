/**
 * Horizontal Scroll Gallery
 * Vertical scroll triggers horizontal card movement
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { MOBILE_BREAKPOINT } from '../config.js';

export function initGallery() {
  const section = document.querySelector('.featured-work-section');
  const track = document.querySelector('.gallery-track');
  const cards = document.querySelectorAll('.gallery-card');
  const progressCurrent = document.querySelector(
    '.gallery-progress .progress-current'
  );
  const progressTotal = document.querySelector(
    '.gallery-progress .progress-total'
  );

  if (!section || !track || !cards.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  let currentIndex = 0;

  function setupHoverCorners() {
    cards.forEach((card) => {
      if (card.querySelector('.gallery-card-corner')) return;

      ['lt', 'lb', 'rt', 'rb'].forEach((position) => {
        const corner = document.createElement('span');
        corner.className = `gallery-card-corner gallery-card-corner-${position}`;
        corner.setAttribute('aria-hidden', 'true');
        card.appendChild(corner);
      });
    });
  }

  function updateProgress(progress) {
    const totalCards = cards.length;
    const newIndex = Math.min(
      Math.floor(progress * totalCards) + 1,
      totalCards
    );
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      if (progressCurrent) progressCurrent.textContent = newIndex;
      if (progressTotal) progressTotal.textContent = totalCards;
    }
  }

  function setupVideoHover() {
    // Skip hover previews on touch devices
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    cards.forEach((card) => {
      const video = card.querySelector('.card-video');
      if (!video) return;

      // Store video reference for lightbox integration
      card._hoverVideo = video;

      let hoverTimeout = null;

      card.addEventListener('mouseenter', () => {
        // 200ms hover intent delay prevents accidental triggers during fast scroll
        hoverTimeout = setTimeout(() => {
          if (video.readyState === 0) {
            video.load(); // Lazy load if not yet loaded
          }
          video.play().catch(() => {});
        }, 200);
      });

      card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        video.pause();
        video.currentTime = 0;
      });
    });

    // GLightbox event integration
    // Note: GLightbox binds to .glightbox-video elements automatically
    // We just need to ensure hover videos pause when lightbox opens
    // The lightbox component handles this via its 'open' event listener
  }

  function setupScrollVideoPlay(containerAnimation) {
    cards.forEach((card) => {
      const video = card.querySelector('.card-video');
      if (!video) return;

      ScrollTrigger.create({
        trigger: card,
        containerAnimation,
        start: 'left 80%',
        end: 'right 20%',
        onEnter: () => {
          if (video.readyState === 0) video.load();
          video.play().catch(() => {});
          card.classList.add('is-playing');
        },
        onLeave: () => {
          video.pause();
          card.classList.remove('is-playing');
        },
        onEnterBack: () => {
          video.play().catch(() => {});
          card.classList.add('is-playing');
        },
        onLeaveBack: () => {
          video.pause();
          card.classList.remove('is-playing');
        },
      });
    });
  }

  setupHoverCorners();

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

    const scrollTween = gsap.to(track, {
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

    setupScrollVideoPlay(scrollTween);
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
