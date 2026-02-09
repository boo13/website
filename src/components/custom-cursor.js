import { gsap } from '../animations/scroll-defaults.js';

export function initCustomCursor() {
  // Skip on touch devices
  if ('ontouchstart' in window) return () => {};

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return () => {};

  // Target sections
  const sections = document.querySelectorAll(
    '.hero-section, .parallax-section'
  );
  if (!sections.length) return () => {};

  // Create cursor elements (fixed position, not per-section)
  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'custom-cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let isActive = false;
  let lastMouseY = 0;

  // gsap.quickTo() for optimal performance on frequent mousemove
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.3, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.3, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.7, ease: 'power2.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.7, ease: 'power2.out' });

  function handleMouseMove(e) {
    if (!isActive) return;
    lastMouseY = e.clientY;
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  }

  // On scroll, nudge ring via quickTo then ease back when scrolling stops
  let lastScrollY = window.scrollY;
  let scrollReturnTimer;
  function handleScroll() {
    if (!isActive) return;
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    const offset = Math.min(Math.max(delta * 1.2, -5), 5);
    ringY(lastMouseY + offset);
    clearTimeout(scrollReturnTimer);
    scrollReturnTimer = setTimeout(() => ringY(lastMouseY), 80);
  }

  // Section enter/leave — show/hide cursor elements
  function handleSectionEnter(e) {
    // Jump to position immediately on enter to avoid fly-in from (0,0)
    gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
    isActive = true;
    gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
  }

  function handleSectionLeave() {
    isActive = false;
    gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
  }

  // Hover on links/buttons — dot shrinks, ring grows
  function handleInteractiveEnter() {
    gsap.to(dot, { scale: 0, duration: 0.3 });
    gsap.to(ring, { scale: 2, duration: 0.3 });
  }

  function handleInteractiveLeave() {
    gsap.to(dot, { scale: 1, duration: 0.3 });
    gsap.to(ring, { scale: 1, duration: 0.3 });
  }

  // Attach listeners
  document.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });

  sections.forEach((section) => {
    section.addEventListener('mouseenter', handleSectionEnter);
    section.addEventListener('mouseleave', handleSectionLeave);

    section.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', handleInteractiveEnter);
      el.addEventListener('mouseleave', handleInteractiveLeave);
    });
  });

  // Return cleanup function
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    sections.forEach((section) => {
      section.removeEventListener('mouseenter', handleSectionEnter);
      section.removeEventListener('mouseleave', handleSectionLeave);
      section.querySelectorAll('a, button').forEach((el) => {
        el.removeEventListener('mouseenter', handleInteractiveEnter);
        el.removeEventListener('mouseleave', handleInteractiveLeave);
      });
    });
    dot.remove();
    ring.remove();
  };
}
