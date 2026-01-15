/**
 * Credits Table with Cursor-Following Preview
 * Hover on credit row shows image preview that follows cursor
 */

(function() {
    'use strict';

    const CreditsPreview = {
        // Elements
        table: null,
        rows: null,
        preview: null,
        previewImg: null,

        // State
        isVisible: false,
        currentSrc: null,
        mouseX: 0,
        mouseY: 0,
        rafId: null,

        // Config
        config: {
            fixedX: 40,   // Fixed left position (px from left edge)
            offsetY: 0    // Offset from cursor Y (centers on cursor)
        },

        init() {
            this.table = document.querySelector('.credits-table');
            this.rows = document.querySelectorAll('.credit-row');
            this.preview = document.querySelector('.cursor-preview');
            this.previewImg = this.preview?.querySelector('img');

            if (!this.table || !this.rows.length || !this.preview) {
                console.warn('CreditsPreview: Required elements not found');
                return;
            }

            // Check for touch device - don't init hover on touch
            if ('ontouchstart' in window) {
                return;
            }

            this.setupEventListeners();
        },

        setupEventListeners() {
            // Row events
            this.rows.forEach(row => {
                row.addEventListener('mouseenter', (e) => this.handleRowEnter(e));
                row.addEventListener('mouseleave', () => this.handleRowLeave());
            });

            // Global mouse move for smooth cursor following
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        },

        handleRowEnter(e) {
            const row = e.currentTarget;
            const previewSrc = row.dataset.preview;

            if (!previewSrc) return;

            // Only load new image if source changed
            if (previewSrc !== this.currentSrc) {
                this.currentSrc = previewSrc;
                this.previewImg.src = previewSrc;
                this.previewImg.alt = row.querySelector('.credit-title')?.textContent || '';
            }

            this.showPreview();
        },

        handleRowLeave() {
            this.hidePreview();
        },

        handleMouseMove(e) {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (this.isVisible && !this.rafId) {
                this.rafId = requestAnimationFrame(() => this.updatePosition());
            }
        },

        updatePosition() {
            this.rafId = null;

            if (!this.isVisible) return;

            // Calculate position - fixed X, follows cursor Y
            const viewportHeight = window.innerHeight;
            const previewRect = this.preview.getBoundingClientRect();

            // Fixed left position, Y follows cursor (centered)
            let x = this.config.fixedX;
            let y = this.mouseY - (previewRect.height / 2);

            // Keep preview within viewport vertically
            if (y + previewRect.height > viewportHeight) {
                y = viewportHeight - previewRect.height - 20;
            }
            if (y < 20) {
                y = 20;
            }

            this.preview.style.left = `${x}px`;
            this.preview.style.top = `${y}px`;
        },

        showPreview() {
            this.isVisible = true;
            this.preview.classList.add('visible');
            this.updatePosition();
        },

        hidePreview() {
            this.isVisible = false;
            this.preview.classList.remove('visible');
        },

        destroy() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
        }
    };

    // About Section Stats Reveal
    const StatsReveal = {
        stats: null,
        observer: null,

        init() {
            this.stats = document.querySelectorAll('.stat');

            if (!this.stats.length) return;

            // Use Intersection Observer for scroll-reveal
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry, index) => {
                        if (entry.isIntersecting) {
                            // Stagger the reveal
                            setTimeout(() => {
                                entry.target.classList.add('revealed');
                            }, index * 150);

                            // Unobserve after revealing
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.2,
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            this.stats.forEach(stat => this.observer.observe(stat));
        },

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CreditsPreview.init();
            StatsReveal.init();
        });
    } else {
        CreditsPreview.init();
        StatsReveal.init();
    }

    window.CreditsPreview = CreditsPreview;
    window.StatsReveal = StatsReveal;
})();
