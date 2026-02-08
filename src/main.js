import './styles/index2.css';
import { initLanding } from './sections/landing.js';
import { initFeaturedWork } from './sections/featured-work.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initAbout } from './sections/about.js';

function init() {
  // Initialize sections (without landing animations yet)
  const cleanupCredits = initCredits();
  initFeaturedWork();
  initGallery();
  initAbout();

  let cleanupLanding;

  // Listen for loading complete event to start landing animations
  document.addEventListener('loadingComplete', () => {
    cleanupLanding = initLanding();
  }, { once: true });

  // Handle loading screen
  const loadingScreen = document.querySelector('.loading-screen');

  if (loadingScreen) {
    // Wait for fonts and any other resources to load
    Promise.all([
      document.fonts.ready,
      // Add other loading promises here in the future (images, videos, etc.)
    ]).then(() => {
      // Add small delay to ensure everything is painted
      requestAnimationFrame(() => {
        loadingScreen.classList.add('hidden');

        // Dispatch event when loading screen starts fading
        document.dispatchEvent(new CustomEvent('loadingComplete'));

        // Remove from DOM after transition completes
        const transitionDuration = 600; // Match CSS transition
        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.remove();
          }
        }, transitionDuration);
      });
    });
  } else {
    // No loading screen, start immediately
    document.dispatchEvent(new CustomEvent('loadingComplete'));
  }

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    if (typeof cleanupCredits === 'function') cleanupCredits();
    if (typeof cleanupLanding === 'function') cleanupLanding();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
