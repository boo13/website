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
        // Slide 3 is hidden by CSS in the wrapper — make it visible
        gsap.set(section.querySelector('.slide-in-your-hand'), { opacity: 1, visibility: 'visible' });
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
        // SLIDES 2+3: PINNED CROSS-TRANSITION
        // One wrapper, one pin, one master timeline:
        //   Phase 1 (0–0.35):   Grid zoom-out (scale 7→1, tilt into 3D)
        //   Phase 2 (0.35–0.50): Darken grid bg, Slide 2 text out
        //   Phase 3 (0.50–0.60): Slide 3 appears, text-mask-rise
        //   Phase 4 (0.55–1.0):  Phones scroll through
        // =====================================================
        const wrapper = section.querySelector('.slide-transition-wrapper');
        const slideGoesBig = section.querySelector('.slide-goes-big');
        const slideInYourHand = section.querySelector('.slide-in-your-hand');
        const gridContainer = slideGoesBig?.querySelector('.grid-container');

        if (wrapper && slideGoesBig && slideInYourHand && gridContainer) {
            // --- Slide 2 elements ---
            const slideBg = slideGoesBig.querySelector('.slide-bg');
            const intro2 = slideGoesBig.querySelector('.slide-intro');
            const headline2 = slideGoesBig.querySelector('.slide-headline');

            // --- Slide 3 elements ---
            const intro3 = slideInYourHand.querySelector('.slide-intro');
            const headline3 = slideInYourHand.querySelector('.slide-headline');
            const phones = section.querySelectorAll('.slide-in-your-hand .phone-mockup');
            const smallPhones = section.querySelectorAll('.slide-in-your-hand .phone-mockup.phone-sm');
            const lgPhone = section.querySelector('.slide-in-your-hand .phone-mockup.phone-lg');

            // --- Initial states ---
            gsap.set(gridContainer, {
                scale: 7,
                transformPerspective: 1200,
                transformOrigin: 'center center',
            });
            gsap.set(phones, { opacity: 0, yPercent: 120 });

            // Per-phone variation: 3D tilt, scale, speed, depth layer
            const smallVariants = [
                { rotateY: -3,  scale: 1,    speed: 0.95, delay: 0,     exitY: -125, behind: false },
                { rotateY:  2,  scale: 0.88, speed: 1.0,  delay: 0.03,  exitY: -118, behind: true  },
                { rotateY: -2,  scale: 1,    speed: 1.05, delay: 0.055, exitY: -130, behind: false },
                { rotateY:  3,  scale: 0.85, speed: 0.92, delay: 0.08,  exitY: -115, behind: true  },
                { rotateY: -1.5,scale: 0.92, speed: 0.98, delay: 0.10,  exitY: -122, behind: false },
            ];

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

            // =====================================================
            // BUILD MASTER TIMELINE (normalized to duration 1)
            // =====================================================
            const masterTl = gsap.timeline({ paused: true });

            // --- Phase 1: Grid zoom-out (0–0.35) ---
            masterTl.to(gridContainer, {
                scale: 1,
                rotateY: -4,
                duration: 0.35,
                ease: 'none',
            }, 0);

            // --- Phase 2: Darken + Slide 2 text out (0.35–0.50) ---
            if (slideBg) {
                masterTl.to(slideBg, {
                    opacity: 0.2,
                    duration: 0.15,
                    ease: 'none',
                }, 0.35);
            }

            // Slide 2 text fades out + drops down
            if (intro2) {
                masterTl.to(intro2, {
                    opacity: 0,
                    y: 30,
                    duration: 0.12,
                    ease: 'power2.in',
                }, 0.35);
            }
            if (headline2) {
                masterTl.to(headline2, {
                    opacity: 0,
                    y: 30,
                    duration: 0.12,
                    ease: 'power2.in',
                }, 0.37);
            }

            // --- Phase 3: Slide 3 appears (0.48–0.55) ---
            // Visibility + opacity on the slide itself
            masterTl.set(slideInYourHand, {
                visibility: 'visible',
            }, 0.48);
            masterTl.to(slideInYourHand, {
                opacity: 1,
                duration: 0.07,
                ease: 'none',
            }, 0.48);

            // --- Phase 4: Phones (placed directly in master timeline) ---
            // Small phones travel through and exit by 0.88 (buffer for scrub lag).
            // Large phone enters and holds — scrolls away naturally on unpin.
            // More aggressive exitY so they clear the viewport completely.
            const phoneStart = 0.50;    // Phones begin as Slide 3 appears
            const phoneEnd = 0.88;      // Small phones finish before pin ends (scrub buffer)
            const phoneDur = phoneEnd - phoneStart;  // 0.38

            Array.from(smallPhones).forEach((phone, i) => {
                const v = smallVariants[i] || smallVariants[0];
                const staggerOffset = v.delay * 0.15;  // Compress stagger into master scale

                // Quick fade-in
                masterTl.to(phone, {
                    opacity: 1,
                    duration: 0.03,
                    ease: 'power2.out',
                }, phoneStart + staggerOffset);

                // Travel from below to well above viewport
                masterTl.to(phone, {
                    yPercent: v.exitY * 1.6,   // More aggressive exit — fully off-screen
                    duration: phoneDur - staggerOffset,
                    ease: 'none',
                }, phoneStart + staggerOffset);
            });

            // Large phone: enters and settles — no exit tween.
            if (lgPhone) {
                masterTl.to(lgPhone, {
                    opacity: 1,
                    duration: 0.03,
                    ease: 'power2.out',
                }, phoneStart);

                masterTl.fromTo(lgPhone,
                    { yPercent: 120 },
                    {
                        yPercent: 0,
                        duration: 0.15,
                        ease: 'power2.out',
                    }, phoneStart);
            }

            // --- Text reveal triggers (time-based, not scrub-linked) ---
            let slide2TextRevealed = false;
            let slide3TextRevealed = false;

            // Pin wrapper and scrub the master timeline
            ScrollTrigger.create({
                trigger: wrapper,
                start: 'top top',
                end: '+=350%',
                scrub: SCRUB.smooth,
                pin: true,
                animation: masterTl,
                invalidateOnRefresh: true,
                onEnter: () => {
                    // Slide 2 text fires once when pin starts (same as before)
                    if (slide2TextRevealed) return;
                    slide2TextRevealed = true;

                    if (intro2) {
                        gsap.fromTo(intro2,
                            { opacity: 0, y: 20 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 1.2,
                                ease: 'power3.out',
                            }
                        );
                    }

                    if (headline2) {
                        cleanupHeadline = textMaskRiseWords(headline2, {
                            duration: 1.5,
                            stagger: 0.15,
                            yOffset: 40,
                            delay: 0.3,
                        });
                    }
                },
                onUpdate: (self) => {
                    // Slide 3 text fires once when we reach the transition point
                    if (!slide3TextRevealed && self.progress >= 0.48) {
                        slide3TextRevealed = true;

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
                    }
                },
            });

            // Play/pause phone videos based on visibility
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
        }

        ScrollTrigger.refresh();
    }, section);

    return () => {
        ctx.revert();
        cleanupHeadline();
        cleanupObserver();
    };
}
