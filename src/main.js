import './styles/index2.css';
import './styles/about-intro.css';
import './styles/video-lightbox.css';
import { ScrollSmoother, ScrollTrigger } from './animations/scroll-defaults.js';
import { initHero } from './sections/hero.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initAbout } from './sections/about.js';
import { initAboutIntro } from './sections/about-intro.js';
import { initFooterReveal } from './sections/footer-reveal.js';
import { initCustomCursor } from './components/custom-cursor.js';
import { runPreloader } from './components/preloader.js';
import { initVideoLightbox } from './components/video-lightbox.js';

let smoother;

function init() {
  // Create ScrollSmoother (skip if user prefers reduced motion)
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (!prefersReducedMotion) {
    smoother = ScrollSmoother.create({
      smooth: 1,
      effects: true,
      smoothTouch: 0.1,
    });
  }

  // Initialize sections (without hero animations yet)
  const cleanupCredits = initCredits();
  const cleanupCursor = initCustomCursor();
  const cleanupAboutIntro = initAboutIntro();
  const cleanupGallery = initGallery();
  initAbout();
  const cleanupFooterReveal = initFooterReveal();
  const cleanupLightbox = initVideoLightbox();

  // Refresh once after all sections register their triggers.
  ScrollTrigger.refresh();

  let cleanupHero;

  // Listen for loading complete event to start hero animations
  document.addEventListener(
    'loadingComplete',
    () => {
      cleanupHero = initHero();
    },
    { once: true }
  );

  runPreloader({ criticalRootSelector: '#hero' })
    .catch(() => {})
    .finally(() => {
      // Start hero animations after preloader exits (or fails open)
      document.dispatchEvent(new CustomEvent('loadingComplete'));
    });

  // Cleanup on page unload
  window.addEventListener(
    'pagehide',
    () => {
      if (smoother) smoother.kill();
      if (typeof cleanupCredits === 'function') cleanupCredits();
      if (typeof cleanupCursor === 'function') cleanupCursor();
      if (typeof cleanupAboutIntro === 'function') cleanupAboutIntro();
      if (typeof cleanupFooterReveal === 'function') cleanupFooterReveal();
      if (typeof cleanupLightbox === 'function') cleanupLightbox();
      if (cleanupGallery) cleanupGallery.revert();
      if (typeof cleanupHero === 'function') cleanupHero();
    },
    { once: true }
  );
}

// Grid overlay toggle (Ctrl+G / Cmd+G)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    document.body.classList.toggle('show-grid');
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
