import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';
import { SCRUB } from '../config.js';

/**
 * About Slides Section
 * Full-viewport scroll-driven narrative slides
 * Slide 1: "This is me" text reveal
 * Slide 2: Grid zoom-out from 7x to 1x scale (scrub-linked, 7x7 grid, tilts into 3D on zoom-out)
 * Slide 3: Phone mockups with pinned scroll
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
        gsap.set(section.querySelectorAll('.phone-mockup'), { opacity: 1 });
        return () => {};
    }

    // Track cleanup functions
    let cleanupHeadline = () => {};
    let cleanupObserver = () => {};

    const ctx = gsap.context(() => {
        // =====================================================
        // SLIDE 1: "THIS IS ME" TEXT REVEAL
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

        // =====================================================
        // SLIDE 2: GRID ZOOM-OUT ANIMATION
        // =====================================================
        const slideGoesBig = section.querySelector('.slide-goes-big');
        const gridContainer = slideGoesBig?.querySelector('.grid-container');

        if (slideGoesBig && gridContainer) {
            // Set initial state — zoomed IN to center cell (video), flat (no tilt)
            // Grid is 100% of viewport (CSS), at 7x scale center cell = 100% viewport
            // Each cell = 100%/7 ≈ 14.3%, at 7x → 14.3% × 7 = 100% (fills screen)
            gsap.set(gridContainer, {
                scale: 7,
                transformPerspective: 1200,
                transformOrigin: 'center center',
            });

            // Create scrub-linked timeline for zoom-out
            // Grid starts flat, tilts into 3D as it zooms out (right edge closer)
            const gridTl = gsap.timeline({ paused: true });

            gridTl.to(gridContainer, {
                scale: 1,
                rotateY: -4,
                duration: 1,
                ease: 'none',  // Linear easing for scrub control
            });

            // Text elements for reveal when pin starts
            const intro = slideGoesBig.querySelector('.slide-intro');
            const headline = slideGoesBig.querySelector('.slide-headline');
            let textRevealed = false;

            // Pin slide and scrub-link the zoom animation
            // Text animations fire once when pin begins (slide reaches top)
            ScrollTrigger.create({
                trigger: slideGoesBig,
                start: 'top top',
                end: '+=150%',        // Scroll distance = 1.5x viewport height
                scrub: SCRUB.smooth,  // 1.5s smooth catch-up delay
                pin: true,
                animation: gridTl,
                invalidateOnRefresh: true,  // Handle resize/orientation changes
                onEnter: () => {
                    if (textRevealed) return;
                    textRevealed = true;

                    // Handwritten intro — fade and rise
                    if (intro) {
                        gsap.fromTo(intro,
                            { opacity: 0, y: 20 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 1.2,
                                ease: 'power3.out',
                            }
                        );
                    }

                    // Headline — text-mask-rise word-by-word
                    if (headline) {
                        cleanupHeadline = textMaskRiseWords(headline, {
                            duration: 1.5,
                            stagger: 0.15,
                            yOffset: 40,
                            delay: 0.3,
                        });
                    }
                },
            });
        }

        // =====================================================
        // SLIDE 2 -> SLIDE 3 CROSSFADE TRANSITION
        // =====================================================
        const slideInYourHand = section.querySelector('.slide-in-your-hand');

        if (slideInYourHand) {
            // Crossfade transition as Slide 3 enters viewport
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
        // SLIDE 3: PHONE MOCKUPS — PINNED WITH PHONE SCROLL-THROUGH
        // Section is pinned. Text stays fixed in place.
        // Phones scroll from below the viewport to above it
        // over the full pinned scroll distance.
        // =====================================================
        const phones = section.querySelectorAll('.slide-in-your-hand .phone-mockup');
        const intro3 = slideInYourHand?.querySelector('.slide-intro');
        const headline3 = slideInYourHand?.querySelector('.slide-headline');

        const smallPhones = section.querySelectorAll('.slide-in-your-hand .phone-mockup.phone-sm');
        const lgPhone = section.querySelector('.slide-in-your-hand .phone-mockup.phone-lg');

        if (slideInYourHand && phones.length) {
            // Per-phone variation: 3D tilt, scale, speed, depth layer
            // rotateY tilts back into z-space; scale + zIndex create depth
            const smallVariants = [
                { rotateY: -3,  scale: 1,    speed: 0.95, delay: 0,     exitY: -125, behind: false },  // phone-1: front
                { rotateY:  2,  scale: 0.88, speed: 1.0,  delay: 0.03,  exitY: -118, behind: true  },  // phone-2: behind text
                { rotateY: -2,  scale: 1,    speed: 1.05, delay: 0.055, exitY: -130, behind: false },  // phone-3: front
                { rotateY:  3,  scale: 0.85, speed: 0.92, delay: 0.08,  exitY: -115, behind: true  },  // phone-5: behind text
                { rotateY: -1.5,scale: 0.92, speed: 0.98, delay: 0.10,  exitY: -122, behind: false },  // phone-6: front
            ];

            // Phones start below viewport, end above it
            gsap.set(phones, { opacity: 0, yPercent: 120 });

            // Apply initial 3D tilt, scale, and depth to small phones
            Array.from(smallPhones).forEach((phone, i) => {
                const v = smallVariants[i] || smallVariants[0];
                gsap.set(phone, {
                    rotateY: v.rotateY,
                    scale: v.scale,
                    transformPerspective: 800,
                    zIndex: v.behind ? 0 : 3,
                });
                if (v.behind) phone.classList.add('phone-behind');
            });

            // Build a timeline for scrub-linked phone travel
            const phoneTl = gsap.timeline({ paused: true });

            // --- Small phones: staggered fade-in + varied travel speeds ---
            Array.from(smallPhones).forEach((phone, i) => {
                const v = smallVariants[i] || smallVariants[0];

                // Staggered fade-in
                phoneTl.to(phone, {
                    opacity: 1,
                    duration: 0.1,
                    ease: 'power2.out',
                }, v.delay);

                // Each phone travels at its own speed (duration)
                phoneTl.to(phone, {
                    yPercent: v.exitY,
                    duration: v.speed,
                    ease: 'none',
                }, v.delay);
            });

            // --- Large phone: enters, holds in view, then exits ---
            if (lgPhone) {
                // Fade in
                phoneTl.to(lgPhone, {
                    opacity: 1,
                    duration: 0.1,
                    ease: 'power2.out',
                }, 0);

                // Phase 1: enter from below to resting position (0-25%)
                phoneTl.fromTo(lgPhone,
                    { yPercent: 120 },
                    {
                        yPercent: 0,
                        duration: 0.25,
                        ease: 'power2.out',
                    }, 0);

                // Phase 2: hold in place (25-60%) — no tween needed, value stays

                // Phase 3: exit upward (60-100%)
                phoneTl.to(lgPhone, {
                    yPercent: -140,
                    duration: 0.4,
                    ease: 'power2.in',
                }, 0.6);
            }

            // Text reveal flags
            let textRevealed = false;

            // Pin the section and scrub-link the phone animation
            ScrollTrigger.create({
                trigger: slideInYourHand,
                start: 'top top',
                end: '+=150%',
                scrub: SCRUB.smooth,
                pin: true,
                animation: phoneTl,
                invalidateOnRefresh: true,
                onEnter: () => {
                    if (textRevealed) return;
                    textRevealed = true;

                    if (intro3) {
                        gsap.fromTo(intro3,
                            { opacity: 0, y: 20 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 1.2,
                                ease: 'power3.out',
                            }
                        );
                    }

                    if (headline3) {
                        textMaskRiseWords(headline3, {
                            duration: 1.5,
                            stagger: 0.15,
                            yOffset: 40,
                            delay: 0.3,
                        });
                    }
                },
            });

            // Play/pause phone videos based on visibility.
            // IntersectionObserver tracks actual rendered position,
            // so it works correctly even though GSAP moves phones via transforms.
            const phoneObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const video = entry.target.querySelector('.phone-video');
                        if (!video) return;
                        if (entry.isIntersecting) {
                            video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    });
                },
                { threshold: 0.1 }
            );

            phones.forEach((phone) => phoneObserver.observe(phone));
            cleanupObserver = () => phoneObserver.disconnect();
        } else {
            // Fallback text reveals if no phones found
            if (intro3) {
                gsap.fromTo(intro3,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: slideInYourHand,
                            start: 'top 70%',
                            toggleActions: 'play none none none',
                        },
                    }
                );
            }

            if (headline3) {
                gsap.set(headline3, { opacity: 0 });
                ScrollTrigger.create({
                    trigger: slideInYourHand,
                    start: 'top 70%',
                    onEnter: () => {
                        textMaskRiseWords(headline3, {
                            duration: 1.5,
                            stagger: 0.15,
                            yOffset: 40,
                            delay: 0.3,
                        });
                    },
                    once: true,
                });
            }
        }

        ScrollTrigger.refresh();
    }, section);

    return () => {
        ctx.revert();
        cleanupHeadline();
        cleanupObserver();
    };
}
