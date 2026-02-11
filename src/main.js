import './styles/index2.css';
import './styles/about-slides.css';
import './styles/video-lightbox.css';
import { ScrollSmoother } from './animations/scroll-defaults.js';
import { initLanding } from './sections/landing.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initAbout } from './sections/about.js';
import { initAboutSlides } from './sections/about-slides.js';
import { initFooterReveal } from './sections/footer-reveal.js';
import { initCustomCursor } from './components/custom-cursor.js';
import { runPreloader } from './components/preloader.js';
import { initVideoLightbox } from './components/video-lightbox.js';

let smoother;

function init() {
  // Create ScrollSmoother (skip if user prefers reduced motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    smoother = ScrollSmoother.create({
      smooth: 1,
      effects: true,
      smoothTouch: 0.1,
    });
  }

  // Initialize sections (without landing animations yet)
  const cleanupCredits = initCredits();
  const cleanupCursor = initCustomCursor();
  const cleanupAboutSlides = initAboutSlides();
  initGallery();
  initAbout();
  const cleanupFooterReveal = initFooterReveal();
  const cleanupLightbox = initVideoLightbox();

  let cleanupLanding;

  // Listen for loading complete event to start landing animations
  document.addEventListener('loadingComplete', () => {
    cleanupLanding = initLanding();
  }, { once: true });

  runPreloader({ criticalRootSelector: '#hero' })
    .catch(() => {})
    .finally(() => {
      // Start landing animations after preloader exits (or fails open)
      document.dispatchEvent(new CustomEvent('loadingComplete'));
    });

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    if (smoother) smoother.kill();
    if (typeof cleanupCredits === 'function') cleanupCredits();
    if (typeof cleanupCursor === 'function') cleanupCursor();
    if (typeof cleanupAboutSlides === 'function') cleanupAboutSlides();
    if (typeof cleanupFooterReveal === 'function') cleanupFooterReveal();
    if (typeof cleanupLightbox === 'function') cleanupLightbox();
    if (typeof cleanupLanding === 'function') cleanupLanding();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
