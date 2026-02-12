import './styles/project.css';
import { initProjectVideo } from './sections/project-video.js';
import { initProjectCredits } from './sections/project-credits.js';
import { initProjectFooter } from './sections/project-footer.js';

function init() {
  // Each returns early if its DOM section is absent
  const cleanups = [initProjectVideo(), initProjectCredits(), initProjectFooter()];
  window.addEventListener(
    'pagehide',
    () => {
      cleanups.forEach((fn) => typeof fn === 'function' && fn());
    },
    { once: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
