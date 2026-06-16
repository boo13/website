import './styles/wyatt.css';
import { initFeaturedWork } from './sections/featured-work.js';
import { onReady, onPageHide } from './utils/dom.js';

function init() {
  onPageHide([initFeaturedWork()]);
}

onReady(init);
