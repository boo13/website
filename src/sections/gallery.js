/**
 * Horizontal Scroll Gallery
 * Vertical scroll triggers horizontal card movement
 */
import {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
} from '../animations/scroll-defaults.js';
import { BREAKPOINTS, GALLERY_SCROLL_BUFFER, SCRUB } from '../config.js';
import { prefersReducedMotion, canHover } from '../utils/dom.js';

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

  const noop = { destroy: () => {}, scrollToCard: () => {} };
  if (!section || !track || !cards.length) return noop;

  // sync with @media (max-width: 1024px) in index.css (BREAKPOINTS.desktop)
  let isCompact = window.innerWidth <= BREAKPOINTS.desktop;

  let currentIndex = 0;

  // Assigned in the desktop path; stays null on compact/reduced-motion.
  let scrollTween = null;

  // Restore the gallery to a specific card after a same-site return (see main.js).
  function scrollToCard(href) {
    const card = track
      .querySelector(`a.card-link[href="${href}"]`)
      ?.closest('.gallery-card');
    if (!card) return;
    const smoother = ScrollSmoother.get();

    // Compact / reduced-motion: gallery is a vertical flex column.
    if (isCompact || prefersReducedMotion() || !scrollTween) {
      if (smoother) smoother.scrollTo(card, false, 'center center');
      else card.scrollIntoView();
      return;
    }

    // Desktop: card position is driven by vertical scroll within the pin.
    const st = scrollTween.scrollTrigger;
    const dist = st.end - st.start;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const targetX = Math.min(
      Math.max(cardCenter - window.innerWidth / 2, 0),
      dist
    );
    const targetScroll = st.start + targetX;

    if (smoother) smoother.scrollTo(targetScroll, false);
    else window.scrollTo(0, targetScroll);

    // The pin tween uses scrub (SCRUB.default = 1); snap scroll + tween to the
    // final state so the track doesn't visibly slide into place over ~1s.
    st.scroll(targetScroll);
    scrollTween.progress(dist ? targetX / dist : 0);
  }

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
      if (progressCurrent) {
        progressCurrent.textContent = newIndex;
        gsap.fromTo(
          progressCurrent,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'expo.out', overwrite: true }
        );
      }
      if (progressTotal) progressTotal.textContent = totalCards;
    }
  }

  function setupVideoHover() {
    // Skip hover previews on touch/pointer-coarse devices
    if (!canHover()) return;

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
  }

  function setupVideoPlay({ containerAnimation } = {}) {
    const horizontal = !!containerAnimation;
    cards.forEach((card) => {
      const video = card.querySelector('.card-video');
      if (!video) return;

      ScrollTrigger.create({
        trigger: card,
        ...(containerAnimation ? { containerAnimation } : {}),
        start: horizontal ? 'left 80%' : 'top 80%',
        end: horizontal ? 'right 20%' : 'bottom 20%',
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

  function handleResize() {
    const wasCompact = isCompact;
    isCompact = window.innerWidth <= BREAKPOINTS.desktop;
    if (wasCompact !== isCompact) {
      window.location.reload();
      return;
    }
    if (!isCompact) {
      ScrollTrigger.refresh();
    }
  }

  // --- Mobile / tablet / reduced-motion path ---
  if (prefersReducedMotion() || isCompact) {
    // CSS handles all layout (flex-direction, widths, etc.) via @media (max-width: 1024px)
    // JS only sets up video autoplay via vertical ScrollTrigger
    const ctx = gsap.context(() => {
      if (!prefersReducedMotion()) {
        setupVideoPlay();
      }
    }, section);

    setupVideoHover();

    // Resume autoplay after lightbox closes
    function onLightboxClose() {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger && st.trigger.classList.contains('gallery-card')) {
          if (st.isActive) {
            const video = st.trigger.querySelector('.card-video');
            if (video) {
              video.play().catch(() => {});
              st.trigger.classList.add('is-playing');
            }
          }
        }
      });
    }
    document.addEventListener('gallery:lightbox-close', onLightboxClose);
    window.addEventListener('resize', handleResize);

    const destroy = () => {
      document.removeEventListener('gallery:lightbox-close', onLightboxClose);
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
    return { destroy, scrollToCard };
  }

  // --- Desktop path (horizontal scroll) ---
  const ctx = gsap.context(() => {
    const trackWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    let scrollDistance = trackWidth - viewportWidth + GALLERY_SCROLL_BUFFER;

    scrollTween = gsap.to(track, {
      x: () => -scrollDistance,
      ease: 'none',
      modifiers: {
        x: gsap.utils.snap(1),
      },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        pin: true,
        scrub: SCRUB.default,
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

    setupVideoPlay({ containerAnimation: scrollTween });
    updateProgress(0);
  }, section);

  setupVideoHover();

  window.addEventListener('resize', handleResize);

  const destroy = () => {
    window.removeEventListener('resize', handleResize);
    ctx.revert();
  };
  return { destroy, scrollToCard };
}
