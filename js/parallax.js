/**
 * Wyatt Earp Parallax Rack-Focus Effect
 * Creates cinematic depth-of-field shift with layered images
 */

(function() {
    'use strict';

    const ParallaxRackFocus = {
        // Elements
        section: null,
        container: null,
        bg: null,
        fg: null,
        bgFade: null,
        fgFade: null,
        textLayer: null,

        // Config - matches PRD requirements
        config: {
            // Background: starts blurred, comes into focus
            bgBlurStart: 6,
            bgBlurEnd: 0,
            bgYStart: 80,
            bgYEnd: -100,
            bgScaleStart: 1.08,
            bgScaleEnd: 1.18,

            // Foreground: starts sharp, goes out of focus
            fgBlurStart: 0,
            fgBlurEnd: 5,
            fgYStart: 0,
            fgYEnd: -15,
            fgScaleStart: 1,
            fgScaleEnd: 1.12,

            // Text layer
            textBlurStart: 3,
            textBlurEnd: 0,
            textYStart: 40,
            textYEnd: -60,

            // Animation timing
            scrubAmount: 1.5
        },

        // State
        timeline: null,
        scrollTrigger: null,
        prefersReducedMotion: false,
        isMobile: false,
        mobileBreakpoint: 768,

        init() {
            this.section = document.querySelector('.parallax-section');
            this.container = document.querySelector('.parallax-container');
            this.bg = document.querySelector('.parallax-bg');
            this.fg = document.querySelector('.parallax-fg');
            this.bgFade = document.querySelector('.parallax-bg-fade');
            this.fgFade = document.querySelector('.parallax-fg-fade');
            this.textLayer = document.querySelector('.parallax-text');

            if (!this.section || !this.bg || !this.fg) {
                console.warn('ParallaxRackFocus: Required elements not found');
                return;
            }

            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.isMobile = window.innerWidth <= this.mobileBreakpoint;

            // Simplified effect on mobile
            if (this.prefersReducedMotion || this.isMobile) {
                this.initReducedMotion();
                return;
            }

            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                console.warn('ParallaxRackFocus: GSAP or ScrollTrigger not loaded');
                return;
            }

            gsap.registerPlugin(ScrollTrigger);
            this.forceGPULayers();
            this.setInitialState();
            this.createAnimation();
        },

        forceGPULayers() {
            [this.bg, this.fg, this.textLayer].forEach(el => {
                if (el) {
                    el.style.transform = 'translate3d(0, 0, 0)';
                    el.style.webkitTransform = 'translate3d(0, 0, 0)';
                }
            });
        },

        setInitialState() {
            const c = this.config;

            // Background: blurred, positioned down
            gsap.set(this.bg, {
                filter: `blur(${c.bgBlurStart}px)`,
                scale: c.bgScaleStart,
                y: c.bgYStart,
                opacity: 1
            });

            // Foreground: sharp, normal position
            gsap.set(this.fg, {
                filter: `blur(${c.fgBlurStart}px)`,
                scale: c.fgScaleStart,
                y: c.fgYStart,
                opacity: 1
            });

            // Text: slightly blurred
            if (this.textLayer) {
                gsap.set(this.textLayer, {
                    filter: `blur(${c.textBlurStart}px)`,
                    y: c.textYStart,
                    opacity: 1
                });
            }

            // Fade overlays hidden
            if (this.bgFade) gsap.set(this.bgFade, { opacity: 0 });
            if (this.fgFade) gsap.set(this.fgFade, { opacity: 0 });
        },

        createAnimation() {
            const c = this.config;
            const tl = gsap.timeline({ paused: true });

            // === PHASE 1 (0-25%): Background sharpens, rack focus begins ===

            // Background: blur reduces, moves up, scales
            tl.to(this.bg, {
                filter: `blur(${c.bgBlurEnd}px)`,
                scale: c.bgScaleEnd,
                y: c.bgYEnd,
                duration: 0.5,
                ease: 'power1.inOut'
            }, 0);

            // Foreground: blur increases, subtle movement
            tl.to(this.fg, {
                filter: `blur(${c.fgBlurEnd}px)`,
                scale: c.fgScaleEnd,
                y: c.fgYEnd,
                duration: 0.5,
                ease: 'power1.inOut'
            }, 0);

            // Text sharpens quickly (0-25%)
            if (this.textLayer) {
                tl.to(this.textLayer, {
                    filter: 'blur(0px)',
                    duration: 0.25,
                    ease: 'power2.out'
                }, 0);

                // Text Y movement throughout
                tl.to(this.textLayer, {
                    y: c.textYEnd,
                    duration: 1,
                    ease: 'none'
                }, 0);
            }

            // === PHASE 2 (55-100%): Fade to black ===

            // Background fade gradient appears
            if (this.bgFade) {
                tl.to(this.bgFade, {
                    opacity: 1,
                    duration: 0.35,
                    ease: 'power1.in'
                }, 0.55);
            }

            // Background image fades
            tl.to(this.bg, {
                opacity: 0.15,
                duration: 0.2,
                ease: 'power1.in'
            }, 0.55);

            tl.to(this.bg, {
                opacity: 0.03,
                filter: 'blur(12px)',
                duration: 0.25,
                ease: 'power1.in'
            }, 0.75);

            // Foreground fade gradient
            if (this.fgFade) {
                tl.to(this.fgFade, {
                    opacity: 1,
                    duration: 0.25,
                    ease: 'power1.in'
                }, 0.6);
            }

            // Foreground image fades
            tl.to(this.fg, {
                opacity: 0.25,
                duration: 0.2,
                ease: 'power1.in'
            }, 0.65);

            tl.to(this.fg, {
                opacity: 0.05,
                filter: 'blur(10px)',
                duration: 0.2,
                ease: 'power1.in'
            }, 0.8);

            // Text stays readable until end
            if (this.textLayer) {
                tl.to(this.textLayer, {
                    opacity: 0.85,
                    duration: 0.15,
                    ease: 'none'
                }, 0.85);
            }

            this.timeline = tl;

            // Create scroll trigger
            this.scrollTrigger = ScrollTrigger.create({
                trigger: this.section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: c.scrubAmount,
                animation: tl,
                onUpdate: (self) => {
                    document.dispatchEvent(new CustomEvent('parallaxProgress', {
                        detail: { progress: self.progress }
                    }));
                }
            });
        },

        initReducedMotion() {
            // Static view with both layers visible
            gsap.set(this.bg, { filter: 'blur(0px)', opacity: 1 });
            gsap.set(this.fg, { filter: 'blur(3px)', opacity: 0.8 });
            if (this.textLayer) {
                gsap.set(this.textLayer, { filter: 'blur(0px)', opacity: 1 });
            }
        },

        destroy() {
            if (this.timeline) this.timeline.kill();
            if (this.scrollTrigger) this.scrollTrigger.kill();
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ParallaxRackFocus.init());
    } else {
        ParallaxRackFocus.init();
    }

    window.ParallaxRackFocus = ParallaxRackFocus;
})();
