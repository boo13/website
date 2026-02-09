import './styles/wyatt.css';
import { initFeaturedWork } from './sections/featured-work.js';

function init() {
  // Initialize Wyatt Earp parallax effect
  const cleanupFeaturedWork = initFeaturedWork();

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    if (typeof cleanupFeaturedWork === 'function') cleanupFeaturedWork();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
