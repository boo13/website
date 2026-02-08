import './styles/index.css';
import { Slider } from './components/slider.js';
import { ResponsiveVideo } from './components/responsive-video.js';

function init() {
  new ResponsiveVideo();
  new Slider();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
