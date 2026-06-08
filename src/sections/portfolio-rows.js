import { gsap } from 'gsap';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import { escHtml, escAttr } from '../utils/escape.js';

// ─── Default Tweakpane config ──────────────────────────────────────────────
const DEFAULT_CONFIG = {
  hoverScale: 1.45,
  siblingScale: 0.9,
  duration: 0.5,
  ease: 'expo.out',
  gap: 6,
};

const STORAGE_KEY = 'portfolio-hover-config';
const CA_BLUE = 'oklch(0.804 0.146 220)';
const CA_RED = 'oklch(0.656 0.235 13)';

// ─── CA clone helpers ──────────────────────────────────────────────────────

function buildCAClones(titleInner) {
  if (titleInner._caClones) return titleInner._caClones;

  const clones = [CA_BLUE, CA_RED].map((color) => {
    const clone = document.createElement('span');
    clone.className = 'portfolio-ca-clone';
    clone.style.color = color;
    clone.textContent = titleInner.dataset.text;
    titleInner.appendChild(clone);
    return clone;
  });

  titleInner._caClones = clones;
  return clones;
}

function animateCAIn(titleInner) {
  const clones = buildCAClones(titleInner);
  clones.forEach((clone, i) => {
    gsap.killTweensOf(clone);
    gsap.fromTo(
      clone,
      { opacity: 0, x: 0, y: 0 },
      {
        opacity: 0.85,
        x: i === 0 ? -2 : 2,
        y: i === 0 ? -2 : 2,
        duration: 0.4,
        delay: i * 0.06,
        ease: 'expo.out',
        overwrite: true,
      }
    );
  });
}

function animateCAOut(titleInner) {
  if (!titleInner._caClones) return;
  titleInner._caClones.forEach((clone) => {
    gsap.killTweensOf(clone);
    gsap.to(clone, { opacity: 0, x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: true });
  });
}

// ─── Proportional elastic banding ──────────────────────────────────────────

function getShotDimensions(shot, stripHeight) {
  const img = shot.querySelector('img');
  if (img?.naturalWidth && img?.naturalHeight && stripHeight) {
    return {
      width: (img.naturalWidth / img.naturalHeight) * stripHeight,
      height: stripHeight,
    };
  }

  const shotRect = shot.getBoundingClientRect();
  const imgRect = img?.getBoundingClientRect();

  return {
    width: shotRect.width || imgRect?.width || 0,
    height: shotRect.height || imgRect?.height || stripHeight || 0,
  };
}

function measureStrip(strip) {
  const stripHeight = strip._portfolioBaseHeight || strip.getBoundingClientRect().height || strip.offsetHeight;

  return [...strip.querySelectorAll('.portfolio-shot')].map((shot) => ({
    shot,
    ...getShotDimensions(shot, stripHeight),
  }));
}

function setExplicitRestSizes(measurements) {
  measurements.forEach(({ shot, width, height }) => {
    if (width > 0 && height > 0) gsap.set(shot, { width, height });
  });
}

function applyBanding(strip, hoveredShot, cfg) {
  strip._portfolioBaseHeight ||= strip.getBoundingClientRect().height || strip.offsetHeight;
  const measurements = measureStrip(strip);
  const shots = measurements.map(({ shot }) => shot);
  const expandedStripHeight = strip._portfolioBaseHeight * cfg.hoverScale;

  strip._portfolioResetTween?.kill();
  gsap.killTweensOf([strip, ...shots]);
  setExplicitRestSizes(measurements);

  strip.classList.add('is-banding');
  shots.forEach((shot) => shot.classList.toggle('is-hovered', shot === hoveredShot));
  gsap.set(shots, { zIndex: 1 });
  gsap.set(hoveredShot, { zIndex: 2 });

  gsap.to(strip, {
    height: expandedStripHeight,
    duration: cfg.duration,
    ease: cfg.ease,
    overwrite: true,
  });

  measurements.forEach(({ shot, width, height }) => {
    if (width <= 0 || height <= 0) return;

    const scale = shot === hoveredShot ? cfg.hoverScale : cfg.siblingScale;

    gsap.to(shot, {
      width: width * scale,
      height: height * scale,
      duration: cfg.duration,
      ease: cfg.ease,
      overwrite: true,
    });
  });
}

function clearBanding(strip, cfg) {
  const measurements = measureStrip(strip);
  const shots = measurements.map(({ shot }) => shot);
  const baseHeight = strip._portfolioBaseHeight || strip.getBoundingClientRect().height || strip.offsetHeight;

  strip._portfolioResetTween?.kill();
  gsap.killTweensOf([strip, ...shots]);
  shots.forEach((shot) => shot.classList.remove('is-hovered'));

  strip._portfolioResetTween = gsap.timeline({
    onComplete: () => {
      strip.classList.remove('is-banding');
      gsap.set(strip, { clearProps: 'height' });
      gsap.set(shots, { clearProps: 'width,height,zIndex' });
      strip._portfolioBaseHeight = null;
      strip._portfolioResetTween = null;
    },
  });

  strip._portfolioResetTween.to(strip, {
    height: baseHeight,
    duration: cfg.duration,
    ease: 'expo.inOut',
    overwrite: true,
  }, 0);

  strip._portfolioResetTween.to(shots, {
    width: (index) => measurements[index].width,
    height: (index) => measurements[index].height,
    duration: cfg.duration,
    ease: 'expo.inOut',
    overwrite: true,
  }, 0);
}

// ─── Wire a single strip ───────────────────────────────────────────────────

function wireStrip(strip, getCfg, canHover) {
  if (!canHover) return;

  [...strip.querySelectorAll('.portfolio-shot')].forEach((shot) => {
    shot.addEventListener('mouseenter', () => {
      const cfg = getCfg();
      applyBanding(strip, shot, cfg);
    });

    shot.addEventListener('mouseleave', () => {
      const cfg = getCfg();
      clearBanding(strip, cfg);
    });
  });
}

// ─── Wire CA on a title ────────────────────────────────────────────────────

function wireTitleCA(titleEl, canHover) {
  if (!canHover) return;

  const inner = document.createElement('span');
  inner.className = 'portfolio-row__title-inner';
  inner.dataset.text = titleEl.textContent;

  // Visible text span (sits on top of clones)
  const textSpan = document.createElement('span');
  textSpan.className = 'portfolio-row__title-text';
  textSpan.textContent = titleEl.textContent;

  titleEl.textContent = '';
  inner.appendChild(textSpan);
  titleEl.appendChild(inner);

  titleEl.addEventListener('mouseenter', () => animateCAIn(inner));
  titleEl.addEventListener('mouseleave', () => animateCAOut(inner));
}

// ─── Render rows from data ─────────────────────────────────────────────────

function encodeSrc(src) {
  return '/' + src.split('/').map(encodeURIComponent).join('/');
}

function renderViewPill(p) {
  if (p.videoUrl) {
    return `<a
      class="portfolio-view-pill glightbox-portfolio"
      data-gallery="portfolio-${escAttr(p.id)}"
      data-glightbox="type: video; source: ${escAttr(p.videoUrl)};"
      href="${escAttr(p.videoUrl)}"
      aria-label="View ${escAttr(p.title)}"
    >View</a>`;
  }
  if (p.liveUrl) {
    return `<a
      class="portfolio-view-pill"
      href="${escAttr(p.liveUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit ${escAttr(p.title)}"
    >View ↗</a>`;
  }
  return '';
}

function renderRows(container, projects) {
  container.innerHTML = projects
    .map(
      (p) => `
    <section class="portfolio-row" data-project="${escAttr(p.id)}">
      <header class="portfolio-row__head">
        <div class="portfolio-row__head-left">
          <h2 class="portfolio-row__title">${escHtml(p.title)}</h2>
          ${renderViewPill(p)}
        </div>
        <span class="portfolio-row__tag">${escHtml(p.tag || '')}</span>
      </header>
      <ul class="portfolio-row__strip">
        ${p.screenshots
          .map(
            (src) => `
          <li class="portfolio-shot">
            <img src="${encodeSrc(src)}" alt="" loading="lazy" draggable="false">
          </li>`
          )
          .join('')}
      </ul>
    </section>`
    )
    .join('');
}

// ─── GLightbox init ────────────────────────────────────────────────────────

function initLightbox() {
  const triggers = document.querySelectorAll('.glightbox-portfolio');
  if (!triggers.length) return;

  GLightbox({
    selector: '.glightbox-portfolio',
    touchNavigation: true,
    loop: false,
    autoplayVideos: true,
    closeButton: true,
    closeOnOutsideClick: true,
    keyboardNavigation: true,
    videosWidth: '90vw',
    openEffect: 'fade',
    closeEffect: 'fade',
  });
}

// ─── Tweakpane integration ─────────────────────────────────────────────────

async function mountTweakpane(cfg, onUpdate) {
  const { Pane } = await import('tweakpane');
  const pane = new Pane({
    title: 'Hover Physics',
    container: document.getElementById('tweakpane-mount'),
  });

  pane.addBinding(cfg, 'hoverScale', { label: 'Hover scale', min: 1.0, max: 2.5, step: 0.05 });
  pane.addBinding(cfg, 'siblingScale', { label: 'Sibling scale', min: 0.7, max: 1.0, step: 0.02 });
  pane.addBinding(cfg, 'duration', { label: 'Duration (s)', min: 0.15, max: 1.2, step: 0.05 });
  pane.addBinding(cfg, 'ease', {
    label: 'Ease',
    options: {
      'expo.out': 'expo.out',
      'power3.out': 'power3.out',
      'power2.out': 'power2.out',
      'elastic.out(1,0.6)': 'elastic.out(1,0.6)',
      'back.out(1.4)': 'back.out(1.4)',
    },
  });
  pane.addBinding(cfg, 'gap', { label: 'Gap (px)', min: 2, max: 48, step: 1 });

  pane.addButton({ title: 'Copy settings' }).on('click', () => {
    navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
  });

  pane.on('change', () => {
    document.querySelectorAll('.portfolio-row__strip').forEach((strip) => {
      strip.style.gap = `${cfg.gap}px`;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    onUpdate();
  });
}

// ─── Public init ──────────────────────────────────────────────────────────

export async function initPortfolioRows(data) {
  const container = document.getElementById('portfolio-rows');
  if (!container) return;

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const { projects } = data;

  renderRows(container, projects);
  initLightbox();

  const savedCfg = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  })();
  const cfg = Object.assign({}, DEFAULT_CONFIG, savedCfg);
  delete cfg.model;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    container.querySelectorAll('.portfolio-row').forEach((row) => {
      const strip = row.querySelector('.portfolio-row__strip');
      const title = row.querySelector('.portfolio-row__title');
      if (strip) wireStrip(strip, () => cfg, canHover);
      if (title) wireTitleCA(title, canHover);
    });

    container.querySelectorAll('.portfolio-row__strip').forEach((strip) => {
      strip.style.gap = `${cfg.gap}px`;
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    await mountTweakpane(cfg, () => {
      container.querySelectorAll('.portfolio-row__strip').forEach((strip) => {
        strip.style.gap = `${cfg.gap}px`;
        const hoveredShot = strip.querySelector('.portfolio-shot.is-hovered');
        if (hoveredShot) applyBanding(strip, hoveredShot, cfg);
      });
    });
  }
}
