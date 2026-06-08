/**
 * Floating Pill Navigation
 * Appears after hero scroll-away; tracks active section; smooth-scrolls on click.
 */
import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import ScrollSmoother from 'gsap/ScrollSmoother';

export function initNav() {
  const nav = document.getElementById('pill-nav');
  if (!nav) return () => {};

  function setActive(id) {
    nav.querySelectorAll('.pill-nav__item[data-section]').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.section === id);
    });
  }

  const ctx = gsap.context(() => {
    // Show nav once user is ~50% through the hero scroll-away
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.3}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        nav.classList.toggle('is-visible', self.progress > 0.5);
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

  return () => ctx.revert();
}
