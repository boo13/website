import { CDN_BASE } from '../config.js';

/**
 * Handles responsive source switching for the hero video.
 */
export class ResponsiveVideo {
  constructor() {
    this.video = document.querySelector('section video');
    if (!this.video) {
      return;
    }
    this.source = this.video.querySelector('source');
    this.init();
  }

  init() {
    this.prepareVideo();
    this.updateVideoSource();
    window.addEventListener('resize', () => this.updateVideoSource());
  }

  prepareVideo() {
    this.video.style.display = 'block';
    this.video.style.zIndex = '-1';
  }

  updateVideoSource() {
    if (!this.source) return;
    const currentTime = this.video.currentTime;
    const wasPaused = this.video.paused;

    let newSrc;
    if (window.matchMedia('(max-aspect-ratio: 9/16)').matches) {
      newSrc = `${CDN_BASE}/video/LandingPageMontagev05_9x16.webm`;
    } else {
      newSrc = `${CDN_BASE}/video/LandingPageMontagev04.2.webm`;
    }

    const currentSrcPath = new URL(
      this.source.getAttribute('src') || this.source.src,
      window.location.href
    ).pathname;
    const nextSrcPath = new URL(newSrc, window.location.href).pathname;
    if (currentSrcPath === nextSrcPath) return;

    this.source.src = newSrc;
    this.video.load();

    this.video.addEventListener('loadedmetadata', function restorePlayback() {
      this.currentTime = currentTime;
      if (!wasPaused) this.play();
      this.removeEventListener('loadedmetadata', restorePlayback);
    });
  }
}
