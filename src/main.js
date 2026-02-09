import './styles/index2.css';
import { initLanding } from './sections/landing.js';
import { initFeaturedWork } from './sections/featured-work.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initAbout } from './sections/about.js';
import { initCustomCursor } from './components/custom-cursor.js';
import { runPreloader } from './components/preloader.js';

function init() {
  document.body.classList.add('preloader-active');

  // Initialize sections (without landing animations yet)
  const cleanupCredits = initCredits();
  const cleanupCursor = initCustomCursor();
  initFeaturedWork();
  initGallery();
  initAbout();

  let cleanupLanding;

  // Listen for loading complete event to start landing animations
  document.addEventListener('loadingComplete', () => {
    cleanupLanding = initLanding();
  }, { once: true });

  runPreloader()
    .catch(() => {})
    .finally(() => {
      // Start landing animations after preloader exits (or fails open)
      document.body.classList.remove('preloader-active');
      document.dispatchEvent(new CustomEvent('loadingComplete'));
    });

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    if (typeof cleanupCredits === 'function') cleanupCredits();
    if (typeof cleanupCursor === 'function') cleanupCursor();
    if (typeof cleanupLanding === 'function') cleanupLanding();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
