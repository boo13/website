import { gsap } from 'gsap';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import { escHtml, escAttr } from '../utils/escape.js';
import { CDN_BASE } from '../config.js';

// ─── Default Tweakpane config ──────────────────────────────────────────────
const DEFAULT_CONFIG = {
  hoverScale: 2,
  siblingScale: 0.98,
  duration: 0.5,
  ease: 'expo.out',
  gap: 18,
};

const STORAGE_KEY = 'portfolio-hover-config';
const EDGE_PAN_SPEED = 360;
const HOVER_PAN_INSET = 24;
const PORTFOLIO_SECTIONS = [
  {
    id: 'short-form',
    label: 'short-form',
    aliases: [
      'short-form',
      'short form',
      'shortform',
      'vertical',
      'promo',
      'promos',
      'trailer',
      'trailers',
      'sizzle',
      'clip',
      'clips',
      'reel',
      'reels',
      'youtube shorts',
      'tiktok',
      'instagram',
    ],
  },
  {
    id: 'social',
    label: 'social',
    aliases: [
      'social',
      'social design',
      'cover',
      'covers',
      'cover design',
      'carousel',
      'carousels',
      'explained',
      'instagram',
      'tiktok',
      'youtube shorts',
    ],
  },
  {
    id: 'long-form',
    label: 'long-form',
    aliases: [
      'long-form',
      'long form',
      'longform',
      'series',
      'docuseries',
      'documentary',
      'episode',
      'episodes',
      'special',
      'television',
      'tv',
      'film',
      'feature film',
    ],
  },
  {
    id: 'pitch-decks',
    label: 'pitch decks',
    aliases: [
      'pitch deck',
      'pitch decks',
      'deck',
      'decks',
      'presentation',
      'presentations',
      'proposal',
      'proposals',
      'pdf',
    ],
  },
  {
    id: 'websites',
    label: 'websites',
    aliases: [
      'website',
      'websites',
      'web site',
      'web sites',
      'landing page',
      'landing pages',
      'microsite',
      'microsites',
      'webpage',
      'web page',
      'web pages',
      'interactive',
    ],
  },
];

const SECTION_FIELDS = [
  'portfolioSection',
  'section',
  'category',
  'type',
  'medium',
  'format',
];
const SECTION_MATCH_PRIORITY = [
  'pitch-decks',
  'websites',
  'social',
  'short-form',
  'long-form',
];
const SECTIONS_BY_ID = new Map(
  PORTFOLIO_SECTIONS.map((section) => [section.id, section])
);

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
  const stripHeight =
    strip._portfolioBaseHeight ||
    strip.getBoundingClientRect().height ||
    strip.offsetHeight;

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

function panScrollerToFitHover(scroller, hoveredShot, scaledWidth, cfg) {
  if (!scroller || !hoveredShot || !(scaledWidth > 0)) return;

  const shotLeft = hoveredShot.offsetLeft;
  const scaledRight = shotLeft + scaledWidth;
  const viewportWidth = scroller.clientWidth;
  const currentScrollLeft = scroller.scrollLeft;
  const viewportRight = currentScrollLeft + viewportWidth;

  let target = currentScrollLeft;
  if (scaledRight > viewportRight - HOVER_PAN_INSET) {
    target = scaledRight - viewportWidth + HOVER_PAN_INSET;
  } else if (shotLeft < currentScrollLeft + HOVER_PAN_INSET) {
    target = shotLeft - HOVER_PAN_INSET;
  }
  target = Math.max(0, target);

  if (Math.abs(target - currentScrollLeft) < 1) return;

  scroller._portfolioBandingScrollTween?.kill();
  scroller._portfolioBandingScrollTween = gsap.to(scroller, {
    scrollLeft: target,
    duration: cfg.duration,
    ease: cfg.ease,
    overwrite: 'auto',
    onComplete: () => {
      scroller._portfolioBandingScrollTween = null;
    },
  });
}

function applyBanding(strip, hoveredShot, cfg) {
  strip._portfolioBaseHeight ||=
    strip.getBoundingClientRect().height || strip.offsetHeight;
  const measurements = measureStrip(strip);
  const shots = measurements.map(({ shot }) => shot);
  const expandedStripHeight = strip._portfolioBaseHeight * cfg.hoverScale;
  const scroller = strip.closest('.portfolio-row__strip-viewport');

  strip._portfolioResetTween?.kill();
  gsap.killTweensOf(strip, 'height');
  gsap.killTweensOf(shots);
  setExplicitRestSizes(measurements);

  strip.classList.add('is-banding');
  shots.forEach((shot) =>
    shot.classList.toggle('is-hovered', shot === hoveredShot)
  );
  gsap.set(shots, { zIndex: 1 });
  gsap.set(hoveredShot, { zIndex: 2 });

  gsap.to(strip, {
    height: expandedStripHeight,
    duration: cfg.duration,
    ease: cfg.ease,
    overwrite: 'auto',
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

  if (scroller) {
    stopEdgePan(scroller);
    const hoveredMeasurement = measurements.find((m) => m.shot === hoveredShot);
    const hoveredScaledWidth = hoveredMeasurement
      ? hoveredMeasurement.width * cfg.hoverScale
      : 0;
    panScrollerToFitHover(scroller, hoveredShot, hoveredScaledWidth, cfg);
    scheduleFramePanRefresh(scroller, cfg.duration);
  }
}

function clearBanding(strip, cfg) {
  const measurements = measureStrip(strip);
  const shots = measurements.map(({ shot }) => shot);
  const baseHeight =
    strip._portfolioBaseHeight ||
    strip.getBoundingClientRect().height ||
    strip.offsetHeight;
  const scroller = strip.closest('.portfolio-row__strip-viewport');

  strip._portfolioResetTween?.kill();
  gsap.killTweensOf(strip, 'height');
  gsap.killTweensOf(shots);
  shots.forEach((shot) => shot.classList.remove('is-hovered'));

  strip._portfolioResetTween = gsap.timeline({
    onComplete: () => {
      strip.classList.remove('is-banding');
      gsap.set(strip, { clearProps: 'height' });
      gsap.set(shots, { clearProps: 'width,height,zIndex' });
      strip._portfolioBaseHeight = null;
      strip._portfolioResetTween = null;
      if (scroller) refreshFramePan(scroller);
    },
  });

  strip._portfolioResetTween.to(
    strip,
    {
      height: baseHeight,
      duration: cfg.duration,
      ease: 'expo.inOut',
      overwrite: 'auto',
    },
    0
  );

  strip._portfolioResetTween.to(
    shots,
    {
      width: (index) => measurements[index].width,
      height: (index) => measurements[index].height,
      duration: cfg.duration,
      ease: 'expo.inOut',
      overwrite: true,
    },
    0
  );
}

// ─── Edge-hover frame panning ──────────────────────────────────────────────

function getFrameMaxScroll(frame) {
  return Math.max(0, frame.scrollWidth - frame.clientWidth);
}

function stopEdgePan(frame) {
  frame._portfolioPanTween?.kill();
  frame._portfolioPanTween = null;
  frame._portfolioPanDirection = null;
}

function startEdgePan(frame, direction) {
  const target = direction === 'left' ? 0 : getFrameMaxScroll(frame);
  const distance = Math.abs(target - frame.scrollLeft);

  frame._portfolioPanDirection = direction;
  frame._portfolioPanTween?.kill();

  if (distance < 1) {
    frame._portfolioPanTween = null;
    return;
  }

  frame._portfolioPanTween = gsap.to(frame, {
    scrollLeft: target,
    duration: distance / EDGE_PAN_SPEED,
    ease: 'none',
    overwrite: true,
    onComplete: () => {
      frame._portfolioPanTween = null;
    },
  });
}

function refreshFramePan(frame) {
  const maxScroll = getFrameMaxScroll(frame);

  if (frame.scrollLeft > maxScroll) {
    frame.scrollLeft = maxScroll;
  }

  if (frame._portfolioPanDirection) {
    startEdgePan(frame, frame._portfolioPanDirection);
  }
}

function scheduleFramePanRefresh(frame, delay = 0) {
  frame._portfolioPanRefresh?.kill();
  frame._portfolioPanRefresh = gsap.delayedCall(delay, () => {
    refreshFramePan(frame);
    frame._portfolioPanRefresh = null;
  });
}

function wireFramePan(frame, canHover) {
  const scroller = frame.querySelector('.portfolio-row__strip-viewport');
  const strip = frame.querySelector('.portfolio-row__strip');
  if (!scroller || !strip) return;

  const leftEdge = frame.querySelector('.portfolio-row__edge--left');
  const rightEdge = frame.querySelector('.portfolio-row__edge--right');

  function updateEdgeState() {
    const maxScroll = getFrameMaxScroll(scroller);
    const isBanding = strip.classList.contains('is-banding');
    if (leftEdge) leftEdge.style.pointerEvents = (isBanding || scroller.scrollLeft < 1) ? 'none' : '';
    if (rightEdge) rightEdge.style.pointerEvents = (isBanding || scroller.scrollLeft >= maxScroll - 1) ? 'none' : '';
  }

  const refresh = () => { refreshFramePan(scroller); updateEdgeState(); };
  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh);

  resizeObserver?.observe(frame);
  resizeObserver?.observe(scroller);
  resizeObserver?.observe(strip);
  frame._portfolioResizeObserver = resizeObserver;

  strip.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', refresh, { once: true });
    img.addEventListener('error', refresh, { once: true });
  });

  scheduleFramePanRefresh(scroller);

  if (!canHover) return;

  updateEdgeState();
  scroller.addEventListener('scroll', updateEdgeState, { passive: true });
  new MutationObserver(updateEdgeState).observe(strip, {
    attributes: true,
    attributeFilter: ['class'],
  });

  leftEdge?.addEventListener('mouseenter', () => startEdgePan(scroller, 'left'));
  rightEdge?.addEventListener('mouseenter', () => startEdgePan(scroller, 'right'));
  frame.querySelectorAll('.portfolio-row__edge').forEach((edge) => {
    edge.addEventListener('mouseleave', () => stopEdgePan(scroller));
  });
  frame.addEventListener('mouseleave', () => stopEdgePan(scroller));
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

// ─── Render rows from data ─────────────────────────────────────────────────

function encodeSrc(src) {
  return '/' + src.split('/').map(encodeURIComponent).join('/');
}

function resolveVideoUrl(src) {
  const source = String(src || '');
  if (/^https?:\/\//.test(source)) return source;

  const cleanSource = source.replace(/^\.?\//, '');
  if (cleanSource.startsWith('images/')) return encodeSrc(cleanSource);
  return `${CDN_BASE}/${cleanSource}`;
}

function normalizeSectionText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSection(value) {
  const text = normalizeSectionText(value);
  if (!text) return null;

  return (
    SECTION_MATCH_PRIORITY.map((id) => SECTIONS_BY_ID.get(id)).find((section) =>
      section?.aliases.some((alias) => text === alias || text.includes(alias))
    )?.id ?? null
  );
}

function normalizeSectionId(value) {
  const text = normalizeSectionText(value);
  const directId = text.replace(/\s+/g, '-');
  if (SECTIONS_BY_ID.has(directId)) return directId;
  return matchSection(value);
}

function resolvePortfolioSections(sectionIds) {
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return PORTFOLIO_SECTIONS;
  }

  const seen = new Set();
  const sections = sectionIds
    .map(normalizeSectionId)
    .filter((id) => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id) => SECTIONS_BY_ID.get(id))
    .filter(Boolean);

  return sections.length ? sections : PORTFOLIO_SECTIONS;
}

function inferProjectSection(project) {
  for (const field of SECTION_FIELDS) {
    const section = matchSection(project[field]);
    if (section) return section;
  }

  const textSection = matchSection(
    [
      project.tag,
      project.title,
      project.role,
      project.description,
      ...(project.screenshots ?? []),
    ].join(' ')
  );
  if (textSection) return textSection;

  if (project.liveUrl && !project.lightboxVideo) return 'websites';
  if (project.lightboxVideo) return 'long-form';
  return 'long-form';
}

function groupProjectsBySection(projects, sectionIds) {
  const groups = resolvePortfolioSections(sectionIds).map((section) => ({
    ...section,
    projects: [],
  }));
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  projects.forEach((project) => {
    const sectionId = inferProjectSection(project);
    groupsById.get(sectionId)?.projects.push(project);
  });

  return groups.filter((group) => group.projects.length > 0);
}

function renderViewPill(p) {
  const videoSource = p.lightboxVideo || p.videoUrl;
  const pills = [];

  if (videoSource) {
    const videoUrl = resolveVideoUrl(videoSource);
    pills.push(`<a
      class="portfolio-view-pill glightbox-portfolio"
      data-gallery="portfolio-${escAttr(p.id)}"
      data-type="video"
      href="${escAttr(videoUrl)}"
      aria-label="View ${escAttr(p.title)}"
    >${p.liveUrl ? 'Motion' : 'View'}</a>`);
  }

  if (p.liveUrl) {
    pills.push(`<a
      class="portfolio-view-pill"
      href="${escAttr(p.liveUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit ${escAttr(p.title)}"
    >${videoSource ? 'Site ↗' : 'View ↗'}</a>`);
  }

  return pills.join('');
}

function renderProjectRow(p) {
  const screenshots = p.screenshots ?? [];
  const shotsMarkup = screenshots.length
    ? `
      <div class="portfolio-row__strip-frame">
        <div class="portfolio-row__strip-viewport">
          <ul class="portfolio-row__strip">
            ${screenshots
              .map(
                (src) => `
              <li class="portfolio-shot">
                <img src="${encodeSrc(src)}" alt="" loading="lazy" draggable="false">
              </li>`
              )
              .join('')}
          </ul>
        </div>
        <span class="portfolio-row__edge portfolio-row__edge--left" aria-hidden="true"></span>
        <span class="portfolio-row__edge portfolio-row__edge--right" aria-hidden="true"></span>
      </div>`
    : '';

  return `
    <section class="portfolio-row${screenshots.length ? '' : ' portfolio-row--no-shots'}" data-project="${escAttr(p.id)}">
      <header class="portfolio-row__head">
        <div class="portfolio-row__head-left">
          <h3 class="portfolio-row__title">${escHtml(p.title)}</h3>
          ${renderViewPill(p)}
        </div>
        <span class="portfolio-row__tag">${escHtml(p.tag || '')}</span>
      </header>
      ${shotsMarkup}
    </section>`;
}

function renderSection(section) {
  return `
    <section class="portfolio-section" id="portfolio-${escAttr(section.id)}" data-section="${escAttr(section.id)}">
      ${section.projects.map(renderProjectRow).join('')}
    </section>`;
}

function renderRows(container, projects, sectionIds) {
  container.innerHTML = groupProjectsBySection(projects, sectionIds)
    .map(renderSection)
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

  pane.addBinding(cfg, 'hoverScale', {
    label: 'Hover scale',
    min: 1.0,
    max: 2.5,
    step: 0.05,
  });
  pane.addBinding(cfg, 'siblingScale', {
    label: 'Sibling scale',
    min: 0.7,
    max: 1.0,
    step: 0.02,
  });
  pane.addBinding(cfg, 'duration', {
    label: 'Duration (s)',
    min: 0.15,
    max: 1.2,
    step: 0.05,
  });
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
    document.documentElement.style.setProperty('--shot-gap', `${cfg.gap}px`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    onUpdate();
  });
}

// ─── Scroll-spy + smooth nav ───────────────────────────────────────────────

function wireScrollSpy() {
  const navLinks = [
    ...document.querySelectorAll('[data-section-link]'),
  ];
  if (!navLinks.length) return;

  const sections = [
    ...document.querySelectorAll('.portfolio-section[id^="portfolio-"]'),
  ];
  const sectionIds = new Set(
    sections.map((section) => section.dataset.section).filter(Boolean)
  );
  navLinks.forEach((link) => {
    link.hidden = !sectionIds.has(link.dataset.sectionLink);
  });
  const activeNavLinks = navLinks.filter((link) => !link.hidden);
  if (!sections.length || !activeNavLinks.length) return;

  function setActive(id) {
    activeNavLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.sectionLink === id);
    });
  }

  // Default: first section active until observer fires
  const firstId = sections[0]?.dataset.section;
  if (firstId) setActive(firstId);

  const visibleSections = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.add(entry.target);
        } else {
          visibleSections.delete(entry.target);
        }
      });

      if (visibleSections.size > 0) {
        const topmost = [...visibleSections].sort(
          (a, b) =>
            a.getBoundingClientRect().top - b.getBoundingClientRect().top
        )[0];
        const id = topmost.dataset.section;
        if (id) setActive(id);
      }
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const titleLink = document.querySelector('.portfolio-section-index__title');
  if (titleLink) {
    titleLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', window.location.pathname);
    });
  }

  activeNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.dataset.sectionLink;
      const target = document.getElementById(`portfolio-${id}`);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      history.replaceState(null, '', `#portfolio-${id}`);
      setActive(id);
    });
  });

  const container = document.getElementById('portfolio-rows');
  if (container) container._sectionObserver = observer;
}

// ─── Public init ──────────────────────────────────────────────────────────

export async function initPortfolioRows(data) {
  const container = document.getElementById('portfolio-rows');
  if (!container) return;

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const projects = data.projects ?? [];
  const sectionIds = data.sections ?? data.portfolioSections;

  renderRows(container, projects, sectionIds);
  wireScrollSpy();
  initLightbox();

  const params = new URLSearchParams(window.location.search);
  const isDebug = params.get('debug') === '1';
  const savedCfg = isDebug
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch {
          return null;
        }
      })()
    : null;
  const cfg = Object.assign({}, DEFAULT_CONFIG, savedCfg);
  delete cfg.model;
  document.documentElement.style.setProperty('--shot-gap', `${cfg.gap}px`);

  const canHover = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  ).matches;
  const mm = gsap.matchMedia();

  container.querySelectorAll('.portfolio-row__strip-frame').forEach((frame) => {
    wireFramePan(frame, canHover);
  });

  if (canHover) {
    container.querySelectorAll('.portfolio-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        container.classList.add('is-row-hovered');
        row.classList.add('is-hovered');
      });
      row.addEventListener('mouseleave', () => {
        row.classList.remove('is-hovered');
        if (!container.querySelector('.portfolio-row.is-hovered')) {
          container.classList.remove('is-row-hovered');
        }
      });
    });
  }

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    container.querySelectorAll('.portfolio-row').forEach((row) => {
      const strip = row.querySelector('.portfolio-row__strip');
      if (strip) wireStrip(strip, () => cfg, canHover);
    });

    container.querySelectorAll('.portfolio-row__strip').forEach((strip) => {
      strip.style.gap = `${cfg.gap}px`;
    });
  });

  if (isDebug) {
    await mountTweakpane(cfg, () => {
      container
        .querySelectorAll('.portfolio-row__strip-frame')
        .forEach((frame) => {
          const scroller = frame.querySelector(
            '.portfolio-row__strip-viewport'
          );
          const strip = frame.querySelector('.portfolio-row__strip');
          if (!scroller || !strip) return;
          strip.style.gap = `${cfg.gap}px`;
          const hoveredShot = strip.querySelector('.portfolio-shot.is-hovered');
          if (hoveredShot) applyBanding(strip, hoveredShot, cfg);
          refreshFramePan(scroller);
        });
    });
  }
}
