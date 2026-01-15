/**
 * Hero Z-Depth Zoom Animation
 * Creates cinematic zoom transition where hero recedes as user scrolls
 */

(function() {
    'use strict';

    const HeroZoom = {
        // Elements
        hero: null,
        video: null,
        content: null,
        gradient: null,

        // Config
        config: {
            scrollDistance: '150%',  // How much scroll before hero fully recedes
            scrubAmount: 1.5,        // Smoothing factor
            zoomScale: 1.15,         // How much hero scales up as it recedes
            blurMax: 8,              // Max blur as hero recedes
        },

        // State
        timeline: null,
        scrollTrigger: null,
        prefersReducedMotion: false,

        init() {
            this.hero = document.querySelector('.hero-section');
            this.video = document.querySelector('.hero-video');
            this.content = document.querySelector('.hero-content');
            this.gradient = document.querySelector('.hero-gradient');

            if (!this.hero) {
                console.warn('HeroZoom: Hero section not found');
                return;
            }

            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (this.prefersReducedMotion) {
                this.initReducedMotion();
                return;
            }

            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                console.warn('HeroZoom: GSAP or ScrollTrigger not loaded');
                return;
            }

            gsap.registerPlugin(ScrollTrigger);
            this.forceGPULayers();
            this.createAnimation();
        },

        forceGPULayers() {
            // Force GPU compositing to prevent flicker
            [this.hero, this.video, this.content].forEach(el => {
                if (el) {
                    el.style.transform = 'translate3d(0, 0, 0)';
                    el.style.webkitTransform = 'translate3d(0, 0, 0)';
                }
            });
        },

        createAnimation() {
            const tl = gsap.timeline({ paused: true });

            // Hero container transforms
            tl.to(this.hero, {
                scale: this.config.zoomScale,
                opacity: 0,
                duration: 1,
                ease: 'none'
            }, 0);

            // Video gets blur effect
            if (this.video) {
                tl.to(this.video, {
                    filter: `blur(${this.config.blurMax}px)`,
                    duration: 0.8,
                    ease: 'none'
                }, 0);
            }

            // Content fades out faster
            if (this.content) {
                tl.to(this.content, {
                    opacity: 0,
                    y: -50,
                    duration: 0.5,
                    ease: 'power2.in'
                }, 0);
            }

            // Gradient darkens
            if (this.gradient) {
                tl.to(this.gradient, {
                    background: 'rgba(0, 0, 0, 0.9)',
                    duration: 0.7,
                    ease: 'none'
                }, 0);
            }

            this.timeline = tl;

            // Create scroll trigger
            this.scrollTrigger = ScrollTrigger.create({
                trigger: this.hero,
                start: 'top top',
                end: `+=${this.config.scrollDistance}`,
                scrub: this.config.scrubAmount,
                animation: tl,
                onUpdate: (self) => {
                    // Emit progress for other components
                    document.dispatchEvent(new CustomEvent('heroZoomProgress', {
                        detail: { progress: self.progress }
                    }));
                }
            });
        },

        initReducedMotion() {
            // Simple opacity transition for reduced motion
            gsap.set(this.hero, { opacity: 1 });
        },

        destroy() {
            if (this.timeline) this.timeline.kill();
            if (this.scrollTrigger) this.scrollTrigger.kill();
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HeroZoom.init());
    } else {
        HeroZoom.init();
    }

    // Expose for external use
    window.HeroZoom = HeroZoom;
})();
