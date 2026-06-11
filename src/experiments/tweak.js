import './styles.css';
import {
  gsap,
  ScrollTrigger,
  initSmooth,
  getHeroEls,
  primeGPU,
  prefersReducedMotion,
} from './shared.js';

const PRESETS = {
  restrained: {
    zoomScale: 1.15,
    blurMax: 8,
    scrollDistance: '150%',
    scrubAmount: 1.5,
  },
  aggressive: {
    zoomScale: 2.5,
    blurMax: 20,
    scrollDistance: '200%',
    scrubAmount: 1.2,
  },
  zdepth: {
    zoomScale: 1.25,
    blurMax: 18,
    scrollDistance: '300%',
    scrubAmount: 4.0,
  },
};

let currentST = null;
let currentCtx = null;
let smoother = null;

function getConfig() {
  return {
    zoomScale: parseFloat(document.getElementById('tw-scale').value),
    blurMax: parseFloat(document.getElementById('tw-blur').value),
    scrollDistance: document.getElementById('tw-distance').value,
    scrubAmount: parseFloat(document.getElementById('tw-scrub').value),
  };
}

function buildTimeline(config) {
  const { hero, video, content, gradient, topGradient } = getHeroEls();
  if (!hero) return;

  if (currentST) {
    currentST.kill();
    currentST = null;
  }
  if (currentCtx) {
    currentCtx.revert();
    currentCtx = null;
  }

  // Reset elements to starting state
  gsap.set(hero, { clearProps: 'scale,opacity' });
  if (video) gsap.set(video, { clearProps: 'filter' });
  if (content) gsap.set(content, { clearProps: 'opacity,filter' });
  if (gradient) gsap.set(gradient, { clearProps: 'background' });
  if (topGradient) gsap.set(topGradient, { autoAlpha: 0 });

  primeGPU(hero, video, content);

  currentCtx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true });

    tl.to(
      hero,
      { scale: config.zoomScale, opacity: 0, duration: 1, ease: 'none' },
      0
    );

    if (video) {
      tl.to(
        video,
        { filter: `blur(${config.blurMax}px)`, duration: 0.8, ease: 'none' },
        0
      );
    }

    if (content) {
      tl.to(
        content,
        { opacity: 0, y: -50, duration: 0.5, ease: 'power2.in' },
        0
      );
    }

    if (gradient) {
      tl.to(
        gradient,
        { background: 'oklch(0 0 0 / 0.9)', duration: 0.7, ease: 'none' },
        0
      );
    }

    if (topGradient) {
      tl.to(topGradient, { autoAlpha: 1, duration: 0.65, ease: 'none' }, 0);
    }

    currentST = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: `+=${config.scrollDistance}`,
      scrub: config.scrubAmount,
      animation: tl,
    });
  }, hero);

  ScrollTrigger.refresh();
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  document.getElementById('tw-scale').value = p.zoomScale;
  document.getElementById('tw-scale-val').textContent = p.zoomScale.toFixed(2);
  document.getElementById('tw-blur').value = p.blurMax;
  document.getElementById('tw-blur-val').textContent = p.blurMax + 'px';
  document.getElementById('tw-distance').value = p.scrollDistance;
  document.getElementById('tw-scrub').value = p.scrubAmount;
  document.getElementById('tw-scrub-val').textContent =
    p.scrubAmount.toFixed(1);
}

function syncLabels() {
  const scale = document.getElementById('tw-scale');
  const blur = document.getElementById('tw-blur');
  const scrub = document.getElementById('tw-scrub');
  scale.addEventListener('input', () => {
    document.getElementById('tw-scale-val').textContent = parseFloat(
      scale.value
    ).toFixed(2);
  });
  blur.addEventListener('input', () => {
    document.getElementById('tw-blur-val').textContent = blur.value + 'px';
  });
  scrub.addEventListener('input', () => {
    document.getElementById('tw-scrub-val').textContent = parseFloat(
      scrub.value
    ).toFixed(1);
  });
}

function init() {
  smoother = initSmooth();

  gsap.set('.hero-name', { autoAlpha: 1 });

  if (prefersReducedMotion) return;

  applyPreset('restrained');
  syncLabels();

  document.getElementById('tw-preset').addEventListener('change', (e) => {
    applyPreset(e.target.value);
  });

  document.getElementById('tw-apply').addEventListener('click', () => {
    if (smoother) smoother.scrollTo(0, false);
    buildTimeline(getConfig());
  });

  buildTimeline(getConfig());
}

document.addEventListener('DOMContentLoaded', init);
