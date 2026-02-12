/**
 * project-footer.js — Footer section for project pages
 * Ticker animation, back-to-top, footer behaviors
 */
import gsap from 'gsap';

export function initProjectFooter() {
  const footer = document.querySelector('.project-footer');
  if (!footer) return;

  const ctx = gsap.context(() => {
    // Future: GSAP-driven ticker or scroll-triggered footer reveal
  }, footer);

  return () => ctx.revert();
}
