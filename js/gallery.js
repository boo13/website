/**
 * Horizontal Scroll Gallery
 * Vertical scroll triggers horizontal card movement
 */

(function() {
    'use strict';

    const HorizontalGallery = {
        // Elements
        section: null,
        container: null,
        track: null,
        cards: null,
        progressCurrent: null,
        progressTotal: null,

        // Config
        config: {
            scrubAmount: 1,
            easing: 'none'
        },

        // State
        scrollTrigger: null,
        currentIndex: 0,
        prefersReducedMotion: false,

        init() {
            this.section = document.querySelector('.gallery-section');
            this.container = document.querySelector('.gallery-container');
            this.track = document.querySelector('.gallery-track');
            this.cards = document.querySelectorAll('.gallery-card');
            this.progressCurrent = document.querySelector('.gallery-progress .progress-current');
            this.progressTotal = document.querySelector('.gallery-progress .progress-total');

            if (!this.section || !this.track || !this.cards.length) {
                console.warn('HorizontalGallery: Required elements not found');
                return;
            }

            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (this.prefersReducedMotion) {
                this.initReducedMotion();
                return;
            }

            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                console.warn('HorizontalGallery: GSAP or ScrollTrigger not loaded');
                return;
            }

            gsap.registerPlugin(ScrollTrigger);
            this.calculateDimensions();
            this.createAnimation();
            this.setupVideoHover();
            this.updateProgress(0);

            // Update on resize
            window.addEventListener('resize', this.handleResize.bind(this));
        },

        calculateDimensions() {
            // Calculate how far we need to scroll horizontally
            const trackWidth = this.track.scrollWidth;
            const viewportWidth = window.innerWidth;
            this.scrollDistance = trackWidth - viewportWidth + 200; // Extra padding
        },

        createAnimation() {
            // Use GSAP's horizontal scroll pattern
            // Pin the section and animate the track horizontally
            const xDistance = this.scrollDistance;

            gsap.to(this.track, {
                x: () => -xDistance,
                ease: 'none',
                scrollTrigger: {
                    trigger: this.section,
                    start: 'top top',
                    end: () => `+=${xDistance}`,
                    pin: true,
                    scrub: this.config.scrubAmount,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        // Update progress indicator
                        this.updateProgress(self.progress);

                        // Toggle section active state
                        if (self.progress > 0 && self.progress < 1) {
                            this.section.classList.add('active');
                        } else {
                            this.section.classList.remove('active');
                        }
                    },
                    onEnter: () => this.section.classList.add('active'),
                    onLeave: () => this.section.classList.remove('active'),
                    onEnterBack: () => this.section.classList.add('active'),
                    onLeaveBack: () => this.section.classList.remove('active')
                }
            });

            // Store reference for cleanup
            this.scrollTrigger = ScrollTrigger.getAll().find(
                st => st.trigger === this.section
            );
        },

        updateProgress(progress) {
            const totalCards = this.cards.length;
            const newIndex = Math.min(
                Math.floor(progress * totalCards) + 1,
                totalCards
            );

            if (newIndex !== this.currentIndex) {
                this.currentIndex = newIndex;
                if (this.progressCurrent) {
                    this.progressCurrent.textContent = newIndex;
                }
                if (this.progressTotal) {
                    this.progressTotal.textContent = totalCards;
                }
            }
        },

        setupVideoHover() {
            this.cards.forEach(card => {
                const video = card.querySelector('.card-video');
                if (!video) return;

                card.addEventListener('mouseenter', () => {
                    video.play().catch(() => {
                        // Video play failed (likely autoplay policy)
                    });
                });

                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            });
        },

        handleResize() {
            // Recalculate on resize
            this.calculateDimensions();
            if (this.scrollTrigger) {
                this.scrollTrigger.refresh();
            }
        },

        initReducedMotion() {
            // Vertical stack layout for reduced motion
            this.track.style.flexDirection = 'column';
            this.track.style.gap = '2rem';

            this.cards.forEach(card => {
                card.style.width = '100%';
                card.style.maxWidth = '800px';
                card.style.margin = '0 auto';
            });
        },

        destroy() {
            if (this.scrollTrigger) this.scrollTrigger.kill();
            window.removeEventListener('resize', this.handleResize);
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HorizontalGallery.init());
    } else {
        HorizontalGallery.init();
    }

    window.HorizontalGallery = HorizontalGallery;
})();
