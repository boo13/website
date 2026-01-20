/**
 * Credits Table with Cursor-Following Preview
 * Hover on credit row shows image preview that follows cursor
 */

(function() {
    'use strict';

    const CreditsTable = {
        init() {
            const tableBody = document.querySelector('.credits-table tbody');
            if (!tableBody) return;

            fetch('data/Projects.json')
                .then(response => response.json())
                .then(data => {
                    this.render(data.projects, tableBody);
                    // Initialize preview logic after rendering
                    CreditsPreview.init();
                })
                .catch(err => {
                    console.error('Error loading projects:', err);
                    // Fallback to existing static content if fetch fails? 
                    // Or just init what's there.
                    CreditsPreview.init();
                });
        },

        render(projects, tableBody) {
            // Clear existing rows (if any, though we might want to keep a loading state)
            tableBody.innerHTML = '';

            projects.forEach(project => {
                const tr = document.createElement('tr');
                tr.className = 'credit-row';
                
                // Add data-preview attribute if preview image exists
                if (project.preview) {
                    tr.setAttribute('data-preview', project.preview);
                } else if (project.poster) {
                     tr.setAttribute('data-preview', project.poster);
                }

                // Title Cell
                const tdTitle = document.createElement('td');
                tdTitle.className = 'credit-title';
                tdTitle.textContent = project.title;
                tr.appendChild(tdTitle);

                // Network/Platform Cell
                const tdNetwork = document.createElement('td');
                tdNetwork.className = 'credit-network';
                tdNetwork.textContent = project.platform || '';
                tr.appendChild(tdNetwork);

                tableBody.appendChild(tr);
            });
        }
    };

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
            // Re-select rows as they might have been injected dynamically
            this.rows = document.querySelectorAll('.credit-row');
            this.preview = document.querySelector('.cursor-preview');
            this.previewImg = this.preview?.querySelector('img');

            if (!this.table || !this.rows.length || !this.preview) {
                // It's okay if no rows if we are waiting for fetch, 
                // but init() is called AFTER fetch in CreditsTable.
                // console.warn('CreditsPreview: Required elements not found'); 
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
                // Remove old listeners to prevent duplicates if init called multiple times?
                // Actually, cloning node is a cheap way to wipe listeners, but let's just assume init called once per set of rows.
                // Since we clear innerHTML, old rows are gone. New rows are fresh.
                row.addEventListener('mouseenter', (e) => this.handleRowEnter(e));
                row.addEventListener('mouseleave', () => this.handleRowLeave());
            });

            // Global mouse move for smooth cursor following (only add once)
            if (!this.hasGlobalListeners) {
                document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                this.hasGlobalListeners = true;
            }
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

    // Credits Table Row Reveal Animation
    const CreditsRowReveal = {
        rows: null,
        observer: null,

        init() {
            this.rows = document.querySelectorAll('.credit-row');

            if (!this.rows.length) return;

            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const row = entry.target;
                            const index = Array.from(this.rows).indexOf(row);
                            
                            setTimeout(() => {
                                row.classList.add('revealed');
                            }, index * 80);

                            this.observer.unobserve(row);
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -30px 0px'
                }
            );

            this.rows.forEach(row => this.observer.observe(row));
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
            CreditsTable.init();
            StatsReveal.init();
            CreditsRowReveal.init();
        });
    } else {
        CreditsTable.init();
        StatsReveal.init();
        CreditsRowReveal.init();
    }

    window.CreditsTable = CreditsTable;
    window.CreditsPreview = CreditsPreview;
    window.StatsReveal = StatsReveal;
    window.CreditsRowReveal = CreditsRowReveal;
})();
