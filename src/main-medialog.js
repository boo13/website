import './styles/medialog.css';
import { gsap } from 'gsap';
import { DUR, EASE } from './config.js';
import { swapHidden } from './utils/motion.js';

const FEED_URL = '/data/media-log.json';
const REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const TYPE_LABELS = {
  movie: 'Movies',
  tv: 'TV',
  book: 'Books',
  other: 'Other',
};

const TYPE_ORDER = ['movie', 'tv', 'book', 'other'];

const state = {
  items: [],
  year: 'all',
  type: 'all',
};

const mediaState = document.getElementById('media-state');
const mediaExperience = document.getElementById('media-experience');
const mediaList = document.getElementById('media-list');
const mediaCount = document.getElementById('media-count');
const yearFilters = document.getElementById('year-filters');
const typeFilters = document.getElementById('type-filters');

let renderGeneration = 0;

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function itemTypeLabel(type) {
  return TYPE_LABELS[type] || 'Other';
}

function uniqueYears(items) {
  return [
    ...new Set(items.map((item) => Number(item.year)).filter(Boolean)),
  ].sort((a, b) => b - a);
}

function uniqueTypes(items) {
  const present = new Set(items.map((item) => item.type).filter(Boolean));
  return TYPE_ORDER.filter((type) => present.has(type));
}

function creatorText(item) {
  if (Array.isArray(item.creators) && item.creators.length) {
    return item.creators.join(', ');
  }
  return '';
}

function yearText(item) {
  if (item.release_year) return `${item.release_year}`;
  return 'Release year unknown';
}

function initials(title) {
  const letters = String(title ?? '')
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase();
  return letters || 'ML';
}

function renderState({ eyebrow, title, description = '', error = false }) {
  mediaState.innerHTML = `
    <div class="media-state__inner ${error ? 'media-state__inner--error' : ''}">
      <p>${escHtml(eyebrow)}</p>
      <h2>${escHtml(title)}</h2>
      ${description ? `<span>${escHtml(description)}</span>` : ''}
    </div>
  `;
  swapHidden(mediaExperience, mediaState);
}

function buttonMarkup({ label, value, active, group }) {
  return `
    <button
      class="media-filter ${active ? 'is-active' : ''}"
      type="button"
      data-filter-group="${escHtml(group)}"
      data-filter-value="${escHtml(value)}"
      aria-pressed="${active ? 'true' : 'false'}"
    >
      ${escHtml(label)}
    </button>
  `;
}

function buildFilters(items) {
  const years = uniqueYears(items);
  const types = uniqueTypes(items);

  yearFilters.innerHTML = [
    buttonMarkup({
      label: 'All',
      value: 'all',
      active: state.year === 'all',
      group: 'year',
    }),
    ...years.map((year) =>
      buttonMarkup({
        label: String(year),
        value: String(year),
        active: state.year === String(year),
        group: 'year',
      })
    ),
  ].join('');

  typeFilters.innerHTML = [
    buttonMarkup({
      label: 'All',
      value: 'all',
      active: state.type === 'all',
      group: 'type',
    }),
    ...types.map((type) =>
      buttonMarkup({
        label: itemTypeLabel(type),
        value: type,
        active: state.type === type,
        group: 'type',
      })
    ),
  ].join('');
}

function updateFilterButtons() {
  for (const button of mediaExperience.querySelectorAll('.media-filter')) {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue || 'all';
    const active =
      (group === 'year' && state.year === value) ||
      (group === 'type' && state.type === value);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function filteredItems() {
  return state.items.filter((item) => {
    const yearMatches =
      state.year === 'all' || String(item.year) === state.year;
    const typeMatches = state.type === 'all' || item.type === state.type;
    return yearMatches && typeMatches;
  });
}

function createPoster(item) {
  if (item.image_url) {
    return `
      <figure class="media-item__poster">
        <img src="${escHtml(item.image_url)}" alt="" loading="lazy" decoding="async" />
      </figure>
    `;
  }

  return `
    <figure class="media-item__poster media-item__poster--fallback" aria-hidden="true">
      <span>${escHtml(initials(item.title))}</span>
    </figure>
  `;
}

function createItemMarkup(item, index) {
  const creators = creatorText(item);
  const review = String(item.review || '').trim();
  const meta = [itemTypeLabel(item.type), yearText(item), creators]
    .filter(Boolean)
    .join(' / ');
  const link = item.canonical_url
    ? `<a class="media-item__link" href="${escHtml(item.canonical_url)}" target="_blank" rel="noopener">Reference</a>`
    : '';

  return `
    <article class="media-item" style="--item-index:${index}">
      ${createPoster(item)}
      <div class="media-item__body">
        <div class="media-item__topline">
          <span>${escHtml(formatDate(item.finished_at))}</span>
          <span>${escHtml(itemTypeLabel(item.type))}</span>
        </div>
        <div class="media-item__title-row">
          <h2>${escHtml(item.title)}</h2>
          ${link}
        </div>
        <p class="media-item__meta">${escHtml(meta)}</p>
        ${review ? `<p class="media-item__review">${escHtml(review)}</p>` : ''}
      </div>
    </article>
  `;
}

function animateItems() {
  if (REDUCED_MOTION) return;
  const targets = mediaList.querySelectorAll('.media-item, .media-empty');
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.56,
      stagger: 0.055,
      ease: 'power2.out',
      clearProps: 'opacity,visibility,transform',
    }
  );
}

function bindPosterFallbacks() {
  for (const image of mediaList.querySelectorAll('img')) {
    image.addEventListener(
      'error',
      () => {
        const poster = image.closest('.media-item__poster');
        if (!poster) return;
        poster.classList.add('media-item__poster--fallback');
        poster.innerHTML = `<span>${escHtml(initials(poster.closest('.media-item')?.querySelector('h2')?.textContent))}</span>`;
      },
      { once: true }
    );
  }
}

function renderItems({ animateExit = false } = {}) {
  updateFilterButtons();
  const items = filteredItems();
  const noun = items.length === 1 ? 'entry' : 'entries';
  mediaCount.textContent = `${items.length} ${noun}`;
  const generation = ++renderGeneration;

  const swap = () => {
    if (generation !== renderGeneration) return;
    mediaList.innerHTML = items.length
      ? items.map((item, index) => createItemMarkup(item, index)).join('')
      : `
        <div class="media-empty">
          <p>No public entries match those filters.</p>
        </div>
      `;
    bindPosterFallbacks();
    animateItems();
  };

  const children = Array.from(mediaList.children);
  if (REDUCED_MOTION || !animateExit || !children.length) {
    swap();
    return;
  }

  gsap.killTweensOf(children);
  gsap.to(children, {
    autoAlpha: 0,
    y: -10,
    duration: DUR.instant,
    stagger: 0.015,
    ease: EASE.exit,
    onComplete: swap,
  });
}

function bindFilters() {
  mediaExperience.addEventListener('click', (event) => {
    const button =
      event.target instanceof HTMLElement
        ? event.target.closest('.media-filter')
        : null;
    if (!(button instanceof HTMLButtonElement)) return;

    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue || 'all';
    if (group !== 'year' && group !== 'type') return;

    state[group] = value;
    renderItems({ animateExit: true });
  });
}

function revealExperience() {
  swapHidden(mediaState, mediaExperience, { y: 18, duration: 0.5 });

  if (REDUCED_MOTION) return;
  gsap.fromTo(
    '.media-controls, .media-count',
    { autoAlpha: 0, y: 18 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out',
      clearProps: 'opacity,visibility,transform',
    }
  );
}

function initHero() {
  if (REDUCED_MOTION) return;
  gsap.fromTo(
    '.media-hero > *',
    { autoAlpha: 0, y: 26 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.72,
      stagger: 0.08,
      ease: 'power3.out',
      clearProps: 'opacity,visibility,transform',
    }
  );
}

async function loadFeed() {
  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok)
      throw new Error(`Feed request failed with ${response.status}`);
    const payload = await response.json();
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : null;
    if (!items) throw new Error('Feed payload is malformed');

    state.items = items;
    state.year = 'all';
    state.type = 'all';

    if (!items.length) {
      renderState({
        eyebrow: 'Empty feed',
        title: 'No public media entries yet.',
        description: 'The archive is ready for the first public entry.',
      });
      return;
    }

    buildFilters(items);
    revealExperience();
    renderItems();
  } catch {
    renderState({
      eyebrow: 'Feed error',
      title: 'The media log could not be loaded.',
      description:
        'The page expects /data/media-log.json to be present and valid JSON.',
      error: true,
    });
  }
}

bindFilters();
initHero();
loadFeed();
