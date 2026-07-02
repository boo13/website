import './styles/cursor.css';
import './styles/index.css';
import './styles/hero-aperture-dual.css';
import './styles/glitch-text.css';
import './styles/video-lightbox.css';
import { ScrollSmoother, ScrollTrigger } from './animations/scroll-defaults.js';
import { initHeroApertureDual } from './sections/hero-aperture-dual.js';
import { initMarquee } from './sections/hero-aperture-marquee.js';
import { initGallery } from './sections/gallery.js';
import { initCredits } from './sections/credits.js';
import { initFooterReveal } from './sections/footer-reveal.js';
import { initCustomCursor } from './components/custom-cursor.js';
import { runPreloader } from './components/preloader.js';
import { initVideoLightbox } from './components/video-lightbox.js';
import { initNav } from './sections/nav.js';
import { trackHomepageVisit } from './utils/track-homepage-visit.js';
import { prefersReducedMotion, onReady } from './utils/dom.js';

let smoother;

function init() {
  // Create ScrollSmoother (skip if user prefers reduced motion)
  if (!prefersReducedMotion()) {
    smoother = ScrollSmoother.create({
      smooth: 1,
      effects: true,
      smoothTouch: 0.1,
    });
  }

  trackHomepageVisit();

  // Initialize sections (without hero animations yet)
  const cleanupCredits = initCredits();
  const cleanupCursor = initCustomCursor();
  const gallery = initGallery();
  const cleanupNav = initNav();
  const cleanupFooterReveal = initFooterReveal();
  const cleanupLightbox = initVideoLightbox();
  const cleanupMarquee = initMarquee();

  // Refresh once after all sections register their triggers.
  ScrollTrigger.refresh();

  let cleanupHero;

  // Listen for loading complete event to start hero animations
  document.addEventListener(
    'loadingComplete',
    () => {
      cleanupHero = initHeroApertureDual();
      // The hero pin is registered after the preloader, so section triggers need final offsets.
      ScrollTrigger.refresh();
    },
    { once: true }
  );

  const de = document.documentElement;
  if (de.classList.contains('rc-return')) {
    // Returning from a project page (flagged before paint by the inline script
    // in index.html): skip the preloader and restore the gallery to the opened
    // card, deterministically — no dependence on bfcache.
    document.querySelector('.loading-overlay')?.remove();
    document.dispatchEvent(new CustomEvent('loadingComplete'));

    const href = de.dataset.returnTo;
    // Restore after the hero pin registers + layout settles, then once more on
    // full load to correct drift from late-loading assets.
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        if (href) gallery.scrollToCard(href);
      });
    });
    window.addEventListener(
      'load',
      () => {
        ScrollTrigger.refresh();
        if (href) gallery.scrollToCard(href);
      },
      { once: true }
    );
  } else {
    runPreloader({ criticalRootSelector: '#hero' })
      .catch(() => {})
      .finally(() => {
        // Start hero animations after preloader exits (or fails open)
        document.dispatchEvent(new CustomEvent('loadingComplete'));
      });
  }

  // Cleanup on page unload — but skip when the page is being put into the
  // back/forward cache, so back navigation restores ScrollSmoother state and
  // scroll position instantly without re-running the preloader.
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    if (smoother) smoother.kill();
    if (typeof cleanupCredits === 'function') cleanupCredits();
    if (typeof cleanupCursor === 'function') cleanupCursor();
    if (typeof cleanupMarquee === 'function') cleanupMarquee();
    if (typeof cleanupFooterReveal === 'function') cleanupFooterReveal();
    if (typeof cleanupLightbox === 'function') cleanupLightbox();
    gallery.destroy();
    if (typeof cleanupHero === 'function') cleanupHero();
    if (typeof cleanupNav === 'function') cleanupNav();
  });
}

// Dynamic copyright year
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Grid overlay toggle (Ctrl+G / Cmd+G)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    document.body.classList.toggle('show-grid');
  }
});

onReady(init);
