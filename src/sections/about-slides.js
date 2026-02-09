import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { SCRUB } from '../config.js';

/**
 * About Slides Section
 * Full-viewport scroll-driven narrative slides
 * Slide 1: Grid zoom-out from 3x to 1x scale (scrub-linked)
 * Text animations added in Plan 04
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
        // =====================================================
        // SLIDE 1: GRID ZOOM-OUT ANIMATION
        // =====================================================
        const slideGoesBig = section.querySelector('.slide-goes-big');
        const gridContainer = slideGoesBig?.querySelector('.grid-container');

        if (slideGoesBig && gridContainer) {
            // Set initial state — zoomed IN to center image
            // Grid is 175% of viewport (CSS), at 3x scale = 525% total
            // Center cell of 3x3 grid at 525% ≈ fills screen
            gsap.set(gridContainer, {
                scale: 3,
                transformOrigin: 'center center',
            });

            // Create scrub-linked timeline for zoom-out
            const gridTl = gsap.timeline({ paused: true });

            gridTl.to(gridContainer, {
                scale: 1,
                duration: 1,
                ease: 'none',  // Linear easing for scrub control
            });

            // Pin slide and scrub-link the zoom animation
            ScrollTrigger.create({
                trigger: slideGoesBig,
                start: 'top top',
                end: '+=150%',        // Scroll distance = 1.5x viewport height
                scrub: SCRUB.smooth,  // 1.5s smooth catch-up delay
                pin: true,
                animation: gridTl,
                invalidateOnRefresh: true,  // Handle resize/orientation changes
            });
        }

        // Ensure all slide content is visible
        gsap.set('.slide-content', { opacity: 1 });
        ScrollTrigger.refresh();
    }, section);

    return () => {
        ctx.revert();
    };
}
