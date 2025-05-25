/**
 * Handles video loading, responsive source switching, and loading overlay.
 */
export class ResponsiveVideo {
    constructor() {
        this.loadingOverlay = document.querySelector('.loading-overlay');
        this.video = document.querySelector('section video');
        if (!this.video) {
            if (this.loadingOverlay) this.loadingOverlay.style.display = 'none';
            return;
        }
        this.source = this.video.querySelector('source');
        this.init();
    }

    init() {
        this.handleLoadingOverlay();
        this.updateVideoSource();
        window.addEventListener('resize', () => this.updateVideoSource());
    }

    handleLoadingOverlay() {
        this.video.style.display = 'block';
        this.video.style.zIndex = '-1';

        this.video.addEventListener('loadeddata', () => {
            if (this.loadingOverlay) this.loadingOverlay.style.display = 'none';
        });

        setTimeout(() => {
            if (this.loadingOverlay) this.loadingOverlay.style.display = 'none';
        }, 5000);
    }

    updateVideoSource() {
        if (!this.source) return;
        const currentTime = this.video.currentTime;
        const wasPaused = this.video.paused;

        let newSrc;
        if (window.matchMedia('(max-aspect-ratio: 9/16)').matches) {
            newSrc = './video/LandingPageMontagev05_9x16.webm';
        } else {
            newSrc = './video/LandingPageMontagev04.2.webm';
        }

        if (this.source.src.endsWith(newSrc)) return;

        this.source.src = newSrc;
        this.video.load();

        this.video.addEventListener(
            'loadedmetadata',
            function restorePlayback() {
                this.currentTime = currentTime;
                if (!wasPaused) this.play();
                this.removeEventListener('loadedmetadata', restorePlayback);
            },
        );
    }
}
