import './styles/cursor.css';
import './styles/project.css';
import './styles/case-study.css';
import { initProjectVideo } from './sections/project-video.js';
import { initProjectCaseStudy } from './sections/project-case-study.js';
import { initProjectCredits } from './sections/project-credits.js';
import { initProjectFooter } from './sections/project-footer.js';
import { initCustomCursor } from './components/custom-cursor.js';
import { onReady, onPageHide } from './utils/dom.js';

function init() {
  // Each returns early if its DOM section is absent
  const cleanups = [
    initProjectVideo(),
    initProjectCaseStudy(),
    initProjectCredits(),
    initProjectFooter(),
    initCustomCursor(),
  ];
  onPageHide(cleanups);
}

onReady(init);
