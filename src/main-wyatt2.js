import './styles/wyatt2.css';
import { initWyatt2Video } from './sections/wyatt2-video.js';

function init() {
  const cleanup = initWyatt2Video();
  window.addEventListener(
    'pagehide',
    () => {
      if (typeof cleanup === 'function') cleanup();
    },
    { once: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
