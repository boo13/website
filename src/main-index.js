import './styles/index.css';
import { Slider } from './components/slider.js';
import { ResponsiveVideo } from './components/responsive-video.js';
import { textMaskRiseWords } from './animations/text-mask-rise.js';

function init() {
  new ResponsiveVideo();
  new Slider();
  textMaskRiseWords(['.landing-title', '.landing-subtitle']);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
