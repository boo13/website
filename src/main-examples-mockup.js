import './styles/examples-mockup.css';

const canvas = document.getElementById('sequenceCanvas');
const ctx = canvas.getContext('2d');
const progressFill = document.getElementById('progressIndicator');
const track = document.getElementById('sequenceTrack');

const totalFrames = 225;
const prefix =
  'images/upNEXT_Examples_Mockup_01_web/upNEXT_Examples_Mockup_01_web_';
const digits = 5;

const frameNumbers = Array.from({ length: totalFrames }, (_, i) => i);

const cache = new Map();
const loaders = new Map();
let pendingFrame = frameNumbers[0];
let displayWidth = 0;
let displayHeight = 0;
let scrollableDistance = 1;

const frameToPath = (frameNumber) =>
  `${prefix}${frameNumber.toString().padStart(digits, '0')}.jpg`;

const ensureFrame = (frameNumber) => {
  if (cache.has(frameNumber)) {
    return Promise.resolve(cache.get(frameNumber));
  }
  if (loaders.has(frameNumber)) {
    return loaders.get(frameNumber);
  }
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.src = frameToPath(frameNumber);
    img.loading = frameNumber === frameNumbers[0] ? 'eager' : 'lazy';
    img.decode?.().catch(() => {});
    img.onload = () => {
      cache.set(frameNumber, img);
      loaders.delete(frameNumber);
      resolve(img);
    };
    img.onerror = () => {
      loaders.delete(frameNumber);
      resolve(null);
    };
  });
  loaders.set(frameNumber, promise);
  return promise;
};

const drawFrame = (img) => {
  if (!img) return;
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  const hRatio = displayWidth / img.width;
  const vRatio = displayHeight / img.height;
  const ratio = Math.min(hRatio, vRatio);
  const renderWidth = img.width * ratio;
  const renderHeight = img.height * ratio;
  const offsetX = (displayWidth - renderWidth) / 2;
  const offsetY = (displayHeight - renderHeight) / 2;
  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
};

const render = (frameNumber) => {
  pendingFrame = frameNumber;
  if (cache.has(frameNumber)) {
    drawFrame(cache.get(frameNumber));
    return;
  }
  ensureFrame(frameNumber).then((img) => {
    if (img && pendingFrame === frameNumber) {
      drawFrame(img);
    }
  });
};

const setTrackHeight = () => {
  const pixelsPerFrame = 8;
  const computed = frameNumbers.length * pixelsPerFrame;
  const min = window.innerHeight * 3;
  const total = Math.max(min, computed) + window.innerHeight;
  track.style.height = `${Math.round(total)}px`;
  scrollableDistance = Math.max(1, track.offsetHeight - window.innerHeight);
};

const resizeCanvas = () => {
  setTrackHeight();
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  displayWidth = rect.width;
  displayHeight = rect.height;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  if (cache.has(pendingFrame)) {
    drawFrame(cache.get(pendingFrame));
  }
};

const debounce = (fn, wait = 150) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(null, args), wait);
  };
};

const updateFromScroll = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const trackStart = track.offsetTop;
  const distance = scrollableDistance;
  const progress = Math.min(
    1,
    Math.max(0, (scrollY - trackStart) / distance),
  );
  const frameIndex = Math.round(progress * (frameNumbers.length - 1));
  render(frameNumbers[frameIndex]);
  progressFill.style.transform = `scaleX(${progress.toFixed(4)})`;
};

const warmFrames = () => {
  let preloadIndex = 1;
  const chunkSize = 6;
  const queueNext = () => {
    if (preloadIndex >= frameNumbers.length) return;
    for (
      let i = 0;
      i < chunkSize && preloadIndex < frameNumbers.length;
      i += 1, preloadIndex += 1
    ) {
      ensureFrame(frameNumbers[preloadIndex]);
    }
    const callback = () => queueNext();
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 200 });
    } else {
      setTimeout(callback, 120);
    }
  };
  queueNext();
};

const handleScroll = (() => {
  let ticking = false;
  return () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    }
    ticking = true;
  };
})();

ensureFrame(frameNumbers[0]).then((img) => {
  setTrackHeight();
  resizeCanvas();
  drawFrame(img);
  warmFrames();
  updateFromScroll();
});

window.addEventListener(
  'resize',
  debounce(() => {
    setTrackHeight();
    resizeCanvas();
    updateFromScroll();
  }, 100),
);
window.addEventListener('scroll', handleScroll, { passive: true });
