import './styles/index2.css';
import { initLanding } from './sections/landing.js';
import { initFeaturedWork } from './sections/featured-work.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initAbout } from './sections/about.js';

function init() {
  const cleanupLanding = initLanding();
  initFeaturedWork();
  initGallery();
  initCredits();
  initAbout();

  if (typeof cleanupLanding === 'function') {
    window.addEventListener('pagehide', cleanupLanding, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
