import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';

/**
 * About Slides Section
 * Full-viewport scroll-driven narrative slides
 * Plans 03 and 04 will add the zoom and text reveal animations
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
        return () => {};
    }

    const ctx = gsap.context(() => {
        // Animation code will be added by Plans 03 and 04
        // Plan 03: Grid zoom-in on Slide 1
        // Plan 04: Text mask-rise reveals for headlines

        // For now, just ensure content is visible and refresh ScrollTrigger
        gsap.set('.slide-content', { opacity: 1 });
        ScrollTrigger.refresh();
    }, section);

    return () => {
        ctx.revert();
    };
}
