import './styles/resume.css';

const preview = document.getElementById('hoverPreview');
const previewImg = document.getElementById('hoverPreviewImg');
const previewNextImg = document.getElementById('hoverPreviewNextImg');
const items = document.querySelectorAll('.credits-list li[data-preview]');
const REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let activeImg = previewImg;
let idleImg = previewNextImg;
let requestedSrc = '';
let targetY = 0;
let currentY = 0;
let frameId = 0;
let tracking = false;
let imageRequestId = 0;

function setPreviewTop(y) {
  if (preview) preview.style.top = `${y}px`;
}

function tick() {
  currentY += (targetY - currentY) * 0.18;
  setPreviewTop(currentY);
  if (tracking) {
    frameId = window.requestAnimationFrame(tick);
    return;
  }
  frameId = 0;
}

function startTracking(y) {
  targetY = y;
  currentY = y;
  setPreviewTop(y);
  if (REDUCED_MOTION || frameId) return;
  tracking = true;
  frameId = window.requestAnimationFrame(tick);
}

function updateTracking(y) {
  targetY = y;
  if (REDUCED_MOTION) setPreviewTop(y);
}

function stopTracking() {
  tracking = false;
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }
}

function swapPreviewImage(src) {
  if (!src || src === requestedSrc || !activeImg) return;
  requestedSrc = src;

  if (!idleImg) {
    activeImg.src = src;
    return;
  }

  const requestId = ++imageRequestId;
  let settled = false;
  const reveal = () => {
    if (settled || requestId !== imageRequestId) return;
    settled = true;
    activeImg.classList.remove('is-visible');
    idleImg.classList.add('is-visible');
    [activeImg, idleImg] = [idleImg, activeImg];
  };
  idleImg.addEventListener('load', reveal, { once: true });
  idleImg.src = src;
  if (idleImg.complete) reveal();
}

items.forEach((item) => {
  item.addEventListener('mouseenter', (e) => {
    const src = item.dataset.preview;
    swapPreviewImage(src);
    startTracking(e.clientY);
    preview?.classList.add('active');
  });

  item.addEventListener('mouseleave', () => {
    preview?.classList.remove('active');
    stopTracking();
  });

  item.addEventListener('mousemove', (e) => {
    updateTracking(e.clientY);
  });
});
