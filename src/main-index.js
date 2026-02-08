import './styles/index.css';
import { Slider } from './components/slider.js';
import { ResponsiveVideo } from './components/responsive-video.js';
import { textMaskRiseWords } from './animations/text-mask-rise.js';

function init() {
  new ResponsiveVideo();
  new Slider();
  textMaskRiseWords(['.landing-title', '.landing-subtitle'], { delay: 0.5 });

  // Hide loading overlay after initialization
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    // Wait for fonts to load before hiding
    document.fonts.ready.then(() => {
      loadingOverlay.classList.add('hidden');
      // Remove from DOM after transition completes
      setTimeout(() => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.remove();
        }
      }, 600);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
