/**
 * project-credits.js — Credits section for project pages
 * Placeholder for future scroll-triggered animations
 */
import gsap from 'gsap';

export function initProjectCredits() {
  const section = document.querySelector('.project-credits');
  if (!section) return;

  const ctx = gsap.context(() => {
    // Future: scroll-triggered reveal animations for credits content
  }, section);

  return () => ctx.revert();
}
