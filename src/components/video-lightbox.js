import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

export function initVideoLightbox() {
  // Skip on touch devices if no video cards exist
  const videoCards = document.querySelectorAll('.glightbox-video');
  if (!videoCards.length) return () => {};

  // Initialize GLightbox with gallery-style navigation
  const lightbox = GLightbox({
    selector: '.glightbox-video',
    touchNavigation: true,
    loop: false,
    autoplayVideos: true,
    closeButton: true,
    closeOnOutsideClick: true,
    keyboardNavigation: true,
    videosWidth: '90vw',
  });

  // Pause any playing hover preview videos when lightbox opens
  lightbox.on('open', () => {
    const hoverVideos = document.querySelectorAll('.card-video');
    hoverVideos.forEach((video) => {
      if (!video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    });
  });

  // Notify gallery to resume visible card autoplay after lightbox closes
  lightbox.on('close', () => {
    document.dispatchEvent(new CustomEvent('gallery:lightbox-close'));
  });

  // Return cleanup function
  return () => {
    if (lightbox) {
      lightbox.destroy();
    }
  };
}
