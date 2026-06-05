import '../styles/index.css';
import '../styles/video-lightbox.css';
import './styles.css';
import {
  ScrollSmoother,
  ScrollTrigger,
} from '../animations/scroll-defaults.js';
import { initGallery } from '../sections/gallery.js';
import { initCredits } from '../sections/credits.js';
import { initFooterReveal } from '../sections/footer-reveal.js';
import { initCustomCursor } from '../components/custom-cursor.js';
import { runPreloader } from '../components/preloader.js';
import { initVideoLightbox } from '../components/video-lightbox.js';
import { initNav } from '../sections/nav.js';
import { initApertureDualHero } from './hero-aperture-dual-full-hero.js';
import { initMarquee } from './hero-aperture-dual-full-marquee.js';

let smoother;

function init() {
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

  const cleanupCredits = initCredits();
  const cleanupCursor = initCustomCursor();
  const cleanupGallery = initGallery();
  const cleanupFooterReveal = initFooterReveal();
  const cleanupLightbox = initVideoLightbox();
  const cleanupMarquee = initMarquee();
  const cleanupNav = initNav();

  ScrollTrigger.refresh();

  let cleanupHero;

  document.addEventListener(
    'loadingComplete',
    () => {
      cleanupHero = initApertureDualHero();
    },
    { once: true }
  );

  runPreloader({ criticalRootSelector: '#hero' })
    .catch(() => {})
    .finally(() => {
      document.dispatchEvent(new CustomEvent('loadingComplete'));
    });

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    if (smoother) smoother.kill();
    if (typeof cleanupCredits === 'function') cleanupCredits();
    if (typeof cleanupCursor === 'function') cleanupCursor();
    if (typeof cleanupFooterReveal === 'function') cleanupFooterReveal();
    if (typeof cleanupLightbox === 'function') cleanupLightbox();
    if (typeof cleanupMarquee === 'function') cleanupMarquee();
    if (typeof cleanupNav === 'function') cleanupNav();
    if (cleanupGallery) cleanupGallery.revert();
    if (typeof cleanupHero === 'function') cleanupHero();
  });
}

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
