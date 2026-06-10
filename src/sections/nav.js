/**
 * Floating Pill Navigation
 * Appears after hero scroll-away; tracks active section; smooth-scrolls on click.
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import ScrollSmoother from 'gsap/ScrollSmoother';

export function initNav() {
  const nav = document.getElementById('pill-nav');
  if (!nav) return () => {};

  const cleanupHandlers = [];
  const indicator = document.createElement('span');
  indicator.className = 'pill-nav__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.appendChild(indicator);

  function moveIndicator(activeItem) {
    if (!activeItem) {
      gsap.to(indicator, {
        autoAlpha: 0,
        duration: 0.2,
        ease: 'expo.out',
        overwrite: true,
      });
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    gsap.to(indicator, {
      x: itemRect.left - navRect.left,
      width: itemRect.width,
      autoAlpha: 1,
      duration: 0.4,
      ease: 'expo.out',
      overwrite: true,
    });
  }

  function setActive(id) {
    let activeItem = null;
    nav.querySelectorAll('.pill-nav__item[data-section]').forEach((item) => {
      const isActive = item.dataset.section === id;
      item.classList.toggle('is-active', isActive);
      if (isActive) activeItem = item;
    });
    moveIndicator(activeItem);
  }

  const ctx = gsap.context(() => {
    gsap.set(nav, { autoAlpha: 0 });

    // Fade nav in across a band of hero progress instead of flipping at one threshold.
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.3}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const opacity = gsap.utils.clamp(
          0,
          1,
          gsap.utils.mapRange(0.42, 0.68, 0, 1, self.progress)
        );
        gsap.set(nav, { autoAlpha: opacity });
        nav.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
      },
    });

    // Active section: featured
    ScrollTrigger.create({
      trigger: '#featured',
      start: 'top 50%',
      onEnter: () => setActive('featured'),
      onLeaveBack: () => setActive(null),
    });

    // Active section: work (clears featured)
    ScrollTrigger.create({
      trigger: '#work',
      start: 'top 50%',
      onEnter: () => setActive('work'),
      onLeaveBack: () => setActive('featured'),
    });

    // Active section: cta / contact (clear work)
    ScrollTrigger.create({
      trigger: '#cta',
      start: 'top 50%',
      onEnter: () => setActive(null),
      onLeaveBack: () => setActive('work'),
    });
  });

  // Smooth-scroll anchor clicks
  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      const smoother = ScrollSmoother.get();
      if (smoother) {
        gsap.to(smoother, {
          scrollTop: smoother.offset(target, 'top top'),
          duration: 0.9,
          ease: 'power2.out',
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const handleResize = () =>
    moveIndicator(nav.querySelector('.pill-nav__item.is-active'));
  window.addEventListener('resize', handleResize);
  cleanupHandlers.push(() =>
    window.removeEventListener('resize', handleResize)
  );

  return () => {
    cleanupHandlers.forEach((cleanup) => cleanup());
    indicator.remove();
    nav.style.pointerEvents = '';
    ctx.revert();
  };
}
