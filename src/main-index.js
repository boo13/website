import './styles/index.css';
import { Slider } from './components/slider.js';
import { ResponsiveVideo } from './components/responsive-video.js';
import { textMaskRiseWords } from './animations/text-mask-rise.js';
import { runPreloader } from './components/preloader.js';

function startExperience() {
  new Slider();
  textMaskRiseWords(['.landing-title', '.landing-subtitle'], { delay: 0.5 });
}

function init() {
  const fontsReady = document.fonts?.ready || Promise.resolve();
  new ResponsiveVideo();

  runPreloader()
    .then(() => fontsReady)
    .catch(() => {})
    .finally(() => {
      startExperience();
      document.dispatchEvent(new CustomEvent('loadingComplete'));
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
