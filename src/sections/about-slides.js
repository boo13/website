import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';
import { SCRUB } from '../config.js';

/**
 * About Slides Section
 * Full-viewport scroll-driven narrative slides
 * Slide 1: Grid zoom-out from 3x to 1x scale (scrub-linked)
 *          + Text reveal animations (handwritten intro fade, headline mask-rise)
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
        gsap.set(section.querySelectorAll('.slide-intro'), { opacity: 1 });
        gsap.set(section.querySelectorAll('.slide-headline'), { opacity: 1 });
        return () => {};
    }

    // Track cleanup functions
    let cleanupHeadline = () => {};

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

            // =====================================================
            // SLIDE 1: TEXT REVEAL ANIMATIONS
            // =====================================================

            // Handwritten intro text — simple fade and rise
            const intro = slideGoesBig.querySelector('.slide-intro');
            if (intro) {
                gsap.fromTo(intro,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: slideGoesBig,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    }
                );
            }

            // Headline — text-mask-rise word-by-word animation
            const headline = slideGoesBig.querySelector('.slide-headline');
            if (headline) {
                // Trigger text mask rise when slide enters viewport
                ScrollTrigger.create({
                    trigger: slideGoesBig,
                    start: 'top 80%',
                    onEnter: () => {
                        cleanupHeadline = textMaskRiseWords(headline, {
                            duration: 1.5,
                            stagger: 0.15,
                            yOffset: 40,
                            delay: 0.2,
                        });
                    },
                    once: true,  // Only trigger once
                });
            }
        }

        // =====================================================
        // SLIDE 1 -> SLIDE 2 CROSSFADE TRANSITION
        // =====================================================
        const slideInYourHand = section.querySelector('.slide-in-your-hand');

        if (slideInYourHand) {
            // Crossfade transition as Slide 2 enters viewport
            gsap.fromTo(slideInYourHand,
                { opacity: 0.7 },
                {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: slideInYourHand,
                        start: 'top 90%',
                        end: 'top 40%',
                        scrub: 1,
                    },
                }
            );
        }

        // =====================================================
        // SLIDE 2: PHONE MOCKUP STAGGER ANIMATION
        // =====================================================
        const phones = section.querySelectorAll('.slide-in-your-hand .phone-mockup');
        if (phones.length) {
            // Initial state: phones below viewport
            gsap.set(phones, { y: 200, opacity: 0 });

            // Staggered rise animation
            gsap.to(phones, {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out',
                stagger: {
                    amount: 0.8,          // 0.8s total across all 4 phones
                    from: 'start',        // Left to right (matches layout)
                },
                scrollTrigger: {
                    trigger: slideInYourHand,
                    start: 'top 70%',     // Start when slide is 70% into viewport
                    toggleActions: 'play none none reverse',
                },
            });
        }

        // =====================================================
        // SLIDE 2: TEXT REVEAL ANIMATIONS
        // =====================================================
        const intro2 = slideInYourHand?.querySelector('.slide-intro');
        const headline2 = slideInYourHand?.querySelector('.slide-headline');

        if (intro2) {
            gsap.fromTo(intro2,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: slideInYourHand,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        }

        if (headline2) {
            gsap.set(headline2, { opacity: 0 });
            ScrollTrigger.create({
                trigger: slideInYourHand,
                start: 'top 75%',
                onEnter: () => {
                    textMaskRiseWords(headline2, {
                        duration: 1.5,
                        stagger: 0.15,
                        yOffset: 40,
                        delay: 0.3,
                    });
                },
                once: true,
            });
        }

        // =====================================================
        // SLIDE 3: "THIS IS ME" TEXT REVEAL
        // =====================================================
        const slideThisIsMe = section.querySelector('.slide-this-is-me');
        const thisIsMeText = slideThisIsMe?.querySelector('.this-is-me-text');

        if (thisIsMeText) {
            gsap.fromTo(thisIsMeText,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.8,       // Slow, contemplative
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: slideThisIsMe,
                        start: 'top 60%',  // Trigger when more visible (breather pacing)
                        toggleActions: 'play none none none',
                    },
                }
            );
            // TODO: Replace with DrawSVGPlugin animation once SVG text paths are created
        }

        ScrollTrigger.refresh();
    }, section);

    return () => {
        ctx.revert();
        cleanupHeadline();
    };
}
