import './styles/project.css';
import './styles/case-study.css';
import { initProjectVideo } from './sections/project-video.js';
import { initProjectCaseStudy } from './sections/project-case-study.js';
import { initProjectCredits } from './sections/project-credits.js';
import { initProjectFooter } from './sections/project-footer.js';

function init() {
  // Each returns early if its DOM section is absent
  const cleanups = [
    initProjectVideo(),
    initProjectCaseStudy(),
    initProjectCredits(),
    initProjectFooter(),
  ];
  window.addEventListener(
    'pagehide',
    () => {
      cleanups.forEach((fn) => typeof fn === 'function' && fn());
    },
    { once: true }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
